import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { createServer, type ServerResponse } from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import { buildServiceWorkerBytes } from '../../scripts/build';

interface ReleaseDocument {
  readonly releaseId: string;
  readonly contentPath: string;
  readonly contentSha256: string;
  readonly assetManifestPath: string;
  readonly [key: string]: unknown;
}

interface AssetDocument {
  path: string;
  sha256: string;
  bytes: number;
  readonly [key: string]: unknown;
}

interface ManifestDocument {
  releaseId: string;
  assets: AssetDocument[];
}

interface Variant {
  readonly files: ReadonlyMap<string, Buffer>;
  readonly release: ReleaseDocument;
  readonly brokenPath: string | null;
}

const DIST = path.resolve(process.cwd(), 'dist');
const HOST = '127.0.0.1';
const PORT = 4173;

function canonicalStringify(value: unknown): string {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Canonical JSON cannot contain non-finite numbers.');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalStringify(entry)).join(',')}]`;
  }
  if (typeof value !== 'object') {
    throw new TypeError('Canonical JSON contains an unsupported value.');
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`)
    .join(',')}}`;
}

function digest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readDistFiles(directory = DIST): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  const walk = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile()) {
        const relative = path
          .relative(DIST, absolute)
          .split(path.sep)
          .join('/');
        files.set(`/${relative}`, await readFile(absolute));
      }
    }
  };
  await walk(directory);
  return files;
}

function parseJson<T>(bytes: Buffer | undefined, label: string): T {
  if (bytes === undefined) {
    throw new Error(`Missing ${label}.`);
  }
  return JSON.parse(bytes.toString('utf8')) as T;
}

async function createVariant(
  baseFiles: ReadonlyMap<string, Buffer>,
  baseRelease: ReleaseDocument,
  releaseId: string,
  builtAt: string,
  broken: boolean,
): Promise<Variant> {
  const files = new Map(baseFiles);
  const baseCorpus = parseJson<Record<string, unknown>>(
    baseFiles.get(baseRelease.contentPath),
    'base corpus',
  );
  const corpusBytes = Buffer.from(
    canonicalStringify({ ...baseCorpus, releaseId }),
  );
  const contentSha256 = digest(corpusBytes);
  const contentPath = `/content/${contentSha256}.json`;
  files.set(contentPath, corpusBytes);

  const manifest = structuredClone(
    parseJson<ManifestDocument>(
      baseFiles.get(baseRelease.assetManifestPath),
      'base asset manifest',
    ),
  );
  manifest.releaseId = releaseId;
  const workerBytes = Buffer.from(
    await buildServiceWorkerBytes(process.cwd(), releaseId, contentSha256),
  );
  if (workerBytes.byteLength === 0) {
    throw new Error('Missing base service worker.');
  }
  const workerAsset = manifest.assets.find(
    (asset) => asset.path === 'service-worker.js',
  );
  if (workerAsset === undefined) {
    throw new Error('Missing service-worker asset record.');
  }
  workerAsset.sha256 = digest(workerBytes);
  workerAsset.bytes = workerBytes.byteLength;
  files.set('/service-worker.js', workerBytes);

  const manifestBytes = Buffer.from(canonicalStringify(manifest));
  const assetManifestSha256 = digest(manifestBytes);
  const assetManifestPath = `/assets/${assetManifestSha256}.json`;
  files.set(assetManifestPath, manifestBytes);
  const release: ReleaseDocument = {
    ...baseRelease,
    releaseId,
    builtAt,
    contentPath,
    contentSha256,
    assetManifestPath,
    assetManifestSha256,
  };
  files.set('/release.json', Buffer.from(canonicalStringify(release)));
  return {
    files,
    release,
    brokenPath: broken ? contentPath : null,
  };
}

function mimeType(pathname: string): string {
  if (pathname.endsWith('.html')) return 'text/html; charset=utf-8';
  if (pathname.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (pathname.endsWith('.css')) return 'text/css; charset=utf-8';
  if (pathname.endsWith('.json')) return 'application/json; charset=utf-8';
  if (pathname.endsWith('.webmanifest')) return 'application/manifest+json';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.woff2')) return 'font/woff2';
  if (pathname.endsWith('.mp3')) return 'audio/mpeg';
  if (pathname.endsWith('.ogg')) return 'audio/ogg';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.avif')) return 'image/avif';
  return 'application/octet-stream';
}

function write(
  response: ServerResponse,
  status: number,
  body: Buffer,
  pathname: string,
  acceptEncoding = '',
): void {
  const compressed =
    /(?:^|,)\s*gzip\s*(?:,|$)/iu.test(acceptEncoding) &&
    /(?:text|javascript|json|manifest|svg)/iu.test(mimeType(pathname));
  const bytes = compressed ? gzipSync(body) : body;
  response.writeHead(status, {
    'cache-control':
      pathname === '/service-worker.js' || pathname === '/release.json'
        ? 'no-store'
        : 'public, max-age=60',
    'content-encoding': compressed ? 'gzip' : 'identity',
    'content-length': String(bytes.byteLength),
    'content-type': mimeType(pathname),
    'x-content-type-options': 'nosniff',
  });
  response.end(bytes);
}

const baseFiles = await readDistFiles();
const baseRelease = parseJson<ReleaseDocument>(
  baseFiles.get('/release.json'),
  'base release',
);
const rebuiltBaseWorker = Buffer.from(
  await buildServiceWorkerBytes(
    process.cwd(),
    baseRelease.releaseId,
    baseRelease.contentSha256,
  ),
);
const baseWorker = baseFiles.get('/service-worker.js');
if (baseWorker === undefined || !rebuiltBaseWorker.equals(baseWorker)) {
  throw new Error(
    'Fixture worker bytes are not the genuine release-versioned build.',
  );
}
const variants = new Map<string, Variant>([
  ['one', { files: baseFiles, release: baseRelease, brokenPath: null }],
  [
    'two',
    await createVariant(
      baseFiles,
      baseRelease,
      'test-only-fixture-release-two',
      '2026-07-13T00:00:01.000Z',
      false,
    ),
  ],
  [
    'broken',
    await createVariant(
      baseFiles,
      baseRelease,
      'test-only-fixture-release-broken',
      '2026-07-13T00:00:02.000Z',
      true,
    ),
  ],
]);
let selected = 'one';

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${HOST}:${PORT}`);
  const stateMatch = /^\/__test\/release\/(one|two|broken)$/u.exec(
    url.pathname,
  );
  if (request.method === 'POST' && stateMatch !== null) {
    selected = stateMatch[1]!;
    response.writeHead(204, { 'cache-control': 'no-store' });
    response.end();
    return;
  }
  if (url.pathname === '/healthz') {
    write(response, 200, Buffer.from('ok'), url.pathname);
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    write(response, 405, Buffer.from('method not allowed'), url.pathname);
    return;
  }
  const variant = variants.get(selected)!;
  let pathname = url.pathname;
  if (
    pathname === '/' ||
    ['/about', '/privacy', '/accessibility', '/credits', '/offline'].includes(
      pathname,
    )
  ) {
    // `/offline` is a live SPA route (the OfflinePage); only `/offline.html`
    // is the static recovery artefact. This mirrors production Caddy routing.
    pathname = '/index.html';
  }
  if (pathname === variant.brokenPath) {
    write(response, 503, Buffer.from('simulated failed update'), pathname);
    return;
  }
  const body = variant.files.get(pathname);
  if (body === undefined) {
    write(response, 404, Buffer.from('not found'), pathname);
    return;
  }
  if (request.method === 'HEAD') {
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-length': String(body.byteLength),
      'content-type': mimeType(pathname),
    });
    response.end();
    return;
  }
  write(
    response,
    200,
    body,
    pathname,
    request.headers['accept-encoding'] ?? '',
  );
});

server.listen(PORT, HOST);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
