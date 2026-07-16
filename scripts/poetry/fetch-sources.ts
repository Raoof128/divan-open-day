/**
 * Secure acquisition of the five immutable DIVAN poetry source editions.
 *
 * Safety properties (enforced and unit-tested in tests/content/sourceLock.test.ts):
 *  - only allowlisted HTTPS hosts are contacted; every redirect hop is revalidated;
 *  - responses are streamed to a `.partial` file and atomically renamed on success;
 *  - SHA-256 is computed during streaming; oversize responses abort and clean up;
 *  - HTML served in place of an expected EPUB/PDF is rejected;
 *  - an existing file whose hash matches the lock is not re-downloaded; a mismatch
 *    fails loudly.
 *
 * No poem text or secret is ever printed. This module performs NO network I/O on
 * import — the CLI entrypoint is guarded at the bottom.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

import {
  artifactFileName,
  isAllowlistedHttpsUrl,
  sourceRegistrySchema,
  type SourceEdition,
} from '../../src/lib/content/sourceRegistrySchema';

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_REDIRECTS = 5;
const USER_AGENT =
  'DIVAN-OpenDay-source-archiver/1.0 (+static offline poetry exhibit; contact: Persian Society)';

export type ArtifactKind = 'epub' | 'pdf' | 'text';

export interface DownloadArtifactInput {
  readonly kind: ArtifactKind;
  readonly url: string;
  readonly required: boolean;
  readonly max_bytes: number;
}

export interface ResponseLike {
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  readonly body: AsyncIterable<Uint8Array> | null;
}

export type FetchLike = (
  url: string,
  init: {
    redirect: 'manual';
    headers: Record<string, string>;
    signal?: AbortSignal;
  },
) => Promise<ResponseLike>;

export interface DownloadResult {
  readonly sha256: string;
  readonly bytes: number;
  readonly content_type: string | null;
  readonly final_url: string;
}

/** Throws unless `value` is an absolute HTTPS URL on the source allowlist. */
export function assertAllowedUrl(value: string): void {
  if (!isAllowlistedHttpsUrl(value)) {
    throw new Error(
      `Refusing non-allowlisted or non-HTTPS source URL host: ${safeHost(value)}`,
    );
  }
}

function safeHost(value: string): string {
  try {
    return new URL(value).host || '(no host)';
  } catch {
    return '(unparseable url)';
  }
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** True if the first bytes / content type look like HTML rather than the payload. */
function looksLikeHtml(
  contentType: string | null,
  firstBytes: Uint8Array,
): boolean {
  if (contentType && /text\/html/i.test(contentType)) {
    return true;
  }
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(firstBytes.subarray(0, 64))
    .trimStart()
    .toLowerCase();
  return head.startsWith('<!doctype html') || head.startsWith('<html');
}

/** True if the payload's first bytes match the expected container magic. */
function magicMatchesKind(kind: ArtifactKind, firstBytes: Uint8Array): boolean {
  if (kind === 'epub') {
    // EPUB is a ZIP: "PK\x03\x04".
    return (
      firstBytes.length >= 2 && firstBytes[0] === 0x50 && firstBytes[1] === 0x4b
    );
  }
  if (kind === 'pdf') {
    // "%PDF"
    return (
      firstBytes.length >= 4 &&
      firstBytes[0] === 0x25 &&
      firstBytes[1] === 0x50 &&
      firstBytes[2] === 0x44 &&
      firstBytes[3] === 0x46
    );
  }
  return true; // text: no binary magic to assert
}

function assertContentSanity(
  kind: ArtifactKind,
  contentType: string | null,
  firstBytes: Uint8Array,
): void {
  if (looksLikeHtml(contentType, firstBytes)) {
    throw new Error(
      `Expected ${kind} payload but received HTML (content-type ${contentType ?? 'unknown'}).`,
    );
  }
  if (!magicMatchesKind(kind, firstBytes)) {
    throw new Error(
      `Payload does not match expected ${kind} container signature.`,
    );
  }
}

export interface DownloadArtifactOptions {
  readonly artifact: DownloadArtifactInput;
  readonly destPath: string;
  readonly fetchImpl?: FetchLike;
  readonly maxRedirects?: number;
  readonly timeoutMs?: number;
}

/** Resolves the request through allowlisted redirects to a final 2xx response. */
async function resolveToResponse(
  startUrl: string,
  fetchImpl: FetchLike,
  maxRedirects: number,
  timeoutMs: number,
): Promise<{ response: ResponseLike; finalUrl: string }> {
  let currentUrl = startUrl;
  assertAllowedUrl(currentUrl);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    let response: ResponseLike;
    try {
      response = await fetchImpl(currentUrl, {
        redirect: 'manual',
        headers: { 'user-agent': USER_AGENT, accept: '*/*' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error(
          `Redirect ${String(response.status)} without a Location header.`,
        );
      }
      const nextUrl = new URL(location, currentUrl).toString();
      assertAllowedUrl(nextUrl);
      currentUrl = nextUrl;
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Unexpected HTTP status ${String(response.status)} for ${safeHost(currentUrl)}.`,
      );
    }

    return { response, finalUrl: currentUrl };
  }

  throw new Error(`Exceeded ${String(maxRedirects)} redirects.`);
}

/**
 * Streams one artifact to `destPath`, enforcing size cap and content sanity, and
 * returns its lock metadata. Never leaves a `.partial` file behind on failure.
 */
export async function downloadArtifact(
  options: DownloadArtifactOptions,
): Promise<DownloadResult> {
  const {
    artifact,
    destPath,
    fetchImpl = globalThis.fetch,
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const { response, finalUrl } = await resolveToResponse(
    artifact.url,
    fetchImpl,
    maxRedirects,
    timeoutMs,
  );
  const contentType = response.headers.get('content-type');

  await mkdir(dirname(destPath), { recursive: true });
  const partialPath = `${destPath}.partial`;
  const hash = createHash('sha256');
  let bytes = 0;
  let sniffed = false;

  const handle = await open(partialPath, 'w');
  try {
    if (response.body) {
      for await (const chunk of response.body) {
        if (!sniffed) {
          assertContentSanity(artifact.kind, contentType, chunk);
          sniffed = true;
        }
        bytes += chunk.length;
        if (bytes > artifact.max_bytes) {
          throw new Error(
            `Response exceeded max_bytes (${String(artifact.max_bytes)}) for ${artifact.kind}.`,
          );
        }
        hash.update(chunk);
        await handle.write(chunk);
      }
    }
    if (!sniffed) {
      throw new Error(`Empty ${artifact.kind} response body.`);
    }
    await handle.sync();
  } catch (error) {
    await handle.close();
    await rm(partialPath, { force: true });
    throw error;
  }
  await handle.close();
  await rename(partialPath, destPath);

  return {
    sha256: hash.digest('hex'),
    bytes,
    content_type: contentType,
    final_url: finalUrl,
  };
}

export async function hashFile(path: string): Promise<string> {
  const buffer = await readFile(path);
  return createHash('sha256').update(buffer).digest('hex');
}

export interface AcquireArtifactOptions extends DownloadArtifactOptions {
  /** Previously locked SHA-256, if any. Present ⇒ reconcile before downloading. */
  readonly existingSha?: string | null;
}

export interface AcquireResult extends DownloadResult {
  readonly skipped: boolean;
}

/**
 * Reconciles an existing on-disk file against its locked hash before deciding to
 * download: a match is skipped, a mismatch fails loudly, absence triggers a fetch.
 */
export async function acquireArtifact(
  options: AcquireArtifactOptions,
): Promise<AcquireResult> {
  const { destPath, existingSha } = options;

  if (existsSync(destPath)) {
    const actual = await hashFile(destPath);
    if (existingSha != null) {
      if (actual === existingSha) {
        return {
          sha256: actual,
          bytes: (await readFile(destPath)).length,
          content_type: null,
          final_url: options.artifact.url,
          skipped: true,
        };
      }
      throw new Error(
        `Locked source file hash mismatch at ${destPath}: expected ${existingSha}, found ${actual}.`,
      );
    }
  }

  const result = await downloadArtifact(options);
  return { ...result, skipped: false };
}

// ---------------------------------------------------------------------------
// Registry-driven acquisition (real fetch path; runs only from the CLI).
// ---------------------------------------------------------------------------

export interface SourceLockEntry {
  readonly source_id: string;
  readonly artifact_kind: ArtifactKind;
  readonly file: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly content_type: string | null;
  readonly retrieved_at: string;
}

export interface SourceLock {
  readonly schema_version: 1;
  readonly generated_at: string;
  readonly entries: SourceLockEntry[];
}

interface RepoPaths {
  readonly registry: string;
  readonly rawRoot: string;
  readonly lock: string;
}

/** Lazily resolved so importing this module (e.g. in tests) does no path work. */
function repoPaths(): RepoPaths {
  const root = process.cwd();
  return {
    registry: resolve(root, 'sources-private/poetry/registry.yaml'),
    rawRoot: resolve(root, 'sources-private/poetry/raw'),
    lock: resolve(root, 'sources-private/poetry/source-lock.json'),
  };
}

function loadRegistry(registryPath: string): SourceEdition[] {
  const parsed = sourceRegistrySchema.parse(
    parseYaml(readFileSync(registryPath, 'utf8')),
  );
  return parsed.sources;
}

async function main(): Promise<void> {
  const paths = repoPaths();
  const nowIso = new Date().toISOString();
  const sources = loadRegistry(paths.registry);
  const previous = existsSync(paths.lock)
    ? (JSON.parse(await readFile(paths.lock, 'utf8')) as SourceLock)
    : null;
  // Keyed by destination file, not by kind: an edition may declare several
  // artifacts of one kind (a two-volume scan), and a kind-keyed map would
  // match a volume against its sibling's hash.
  const previousBySha = new Map(
    (previous?.entries ?? []).map((e) => [e.file, e]),
  );

  const entries: SourceLockEntry[] = [];
  for (const source of sources) {
    for (const artifact of source.download_artifacts) {
      const destDir = resolve(paths.rawRoot, source.id);
      const fileName = artifactFileName(artifact);
      const destPath = resolve(destDir, fileName);
      const relativeFile = `raw/${source.id}/${fileName}`;
      const prior = previousBySha.get(relativeFile);
      process.stdout.write(
        `• ${source.id} (${fileName}) → ${safeHost(artifact.url)}\n`,
      );
      try {
        const result = await acquireArtifact({
          artifact,
          destPath,
          existingSha: prior?.sha256 ?? null,
        });
        entries.push({
          source_id: source.id,
          artifact_kind: artifact.kind,
          file: relativeFile,
          requested_url: artifact.url,
          final_url: result.final_url,
          sha256: result.sha256,
          bytes: result.bytes,
          content_type: result.content_type,
          retrieved_at: prior && result.skipped ? prior.retrieved_at : nowIso,
        });
        process.stdout.write(
          `  ${result.skipped ? 'unchanged' : 'downloaded'} — ${result.sha256.slice(0, 12)}… (${String(result.bytes)} bytes)\n`,
        );
      } catch (error) {
        if (!artifact.required) {
          process.stdout.write(
            `  skipped optional artifact: ${(error as Error).message}\n`,
          );
          continue;
        }
        throw error;
      }
    }
  }

  const lock: SourceLock = {
    schema_version: 1,
    generated_at: nowIso,
    entries: entries.sort((a, b) =>
      `${a.source_id}:${a.artifact_kind}`.localeCompare(
        `${b.source_id}:${b.artifact_kind}`,
      ),
    ),
  };
  await writeFile(paths.lock, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `\nWrote ${String(entries.length)} lock entries to source-lock.json.\n`,
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url.startsWith('file:') &&
  resolve(invokedPath) === resolve(fileURLToPath(import.meta.url))
) {
  main().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Unknown acquisition failure.';
    process.stderr.write(`Source acquisition FAILED: ${message}\n`);
    process.exitCode = 1;
  });
}
