/**
 * Ingests the REAL Persian Masnavi verse from Persian Wikisource.
 *
 * The `مثنوی معنوی` work is a Wikisource ProofreadPage edition (Nicholson,
 * `DowreKamelMasnavi.pdf`): the root page is only a section index, so the EPUB
 * export contains section *titles*, not couplets. The verse lives in each of the
 * ~hundreds of section subpages, wrapped in `<span class="beyt">` hemistichs.
 *
 * This script enumerates the section subpages, fetches each rendered page,
 * extracts the beyt lines (skipping running headers, page numbers and verse
 * counters), orders sections by their scan page (`<pages … from=N>`), and writes
 * deterministic staging into `extracted/rumi-fa.jsonl` plus a raw provenance
 * artifact. Reviewed-approved excerpts still flow through the existing human
 * pipeline; nothing here is public content.
 *
 * Only fa.wikisource.org (allowlisted) is contacted. No poem text is committed
 * (raw/ and extracted/ are git-ignored).
 */
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isAllowlistedHttpsUrl } from '../../src/lib/content/sourceRegistrySchema';

const SOURCE_ID = 'rumi-nicholson-fa-wikisource';
const WORK_PREFIX = 'مثنوی معنوی/';
const API = 'https://fa.wikisource.org/w/api.php';
const USER_AGENT =
  'DIVAN-OpenDay-source-archiver/1.0 (+static offline poetry exhibit; contact: Persian Society)';

const HTML_BLOCK_BOUNDARY = /<\/(?:p|div|li|tr|h[1-6])>|<br\s*\/?>/giu;
const TAG = /<[^>]+>/gu;
const BEYT_SPAN =
  /<span[^>]*class="[^"]*\bbeyt\b[^"]*"[^>]*>([\s\S]*?)<\/span>/giu;
const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&zwnj;': '‌',
  '&#8204;': '‌',
};

function unescapeHtml(value: string): string {
  return value.replace(
    /&(?:nbsp|amp|lt|gt|quot|zwnj|#160|#39|#8204);/gu,
    (match) => ENTITIES[match] ?? match,
  );
}

/** Extracts one string per `<span class="beyt">` hemistich, tags stripped. */
export function extractBeytLines(html: string): string[] {
  const lines: string[] = [];
  for (const match of html.matchAll(BEYT_SPAN)) {
    const inner = (match[1] ?? '')
      .replace(HTML_BLOCK_BOUNDARY, ' ')
      .replace(TAG, '')
      .trim();
    const text = unescapeHtml(inner).replace(/\s+/gu, ' ').trim();
    if (text.length > 0) {
      lines.push(text);
    }
  }
  return lines;
}

/** Scan page number from `<pages index="…" from=N …>`, for reading order. */
export function parsePdfFromPage(wikitext: string): number | null {
  const match = /<pages\b[^>]*\bfrom\s*=\s*"?(\d+)"?/u.exec(wikitext);
  return match ? Number.parseInt(match[1] ?? '', 10) : null;
}

interface WikiApiResponse {
  readonly continue?: Record<string, string>;
  readonly query?: {
    readonly allpages?: { readonly title: string }[];
  };
  readonly parse?: {
    readonly text?: string;
    readonly wikitext?: string;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

async function apiGet(
  params: Record<string, string>,
  attempt = 0,
): Promise<WikiApiResponse> {
  const url = new URL(API);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  if (!isAllowlistedHttpsUrl(url.toString())) {
    throw new Error('Refusing non-allowlisted Wikisource API URL.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, 30_000);
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
      signal: controller.signal,
    });
    // Politely back off on rate-limit / transient errors (Wikimedia etiquette).
    if ((response.status === 429 || response.status === 503) && attempt < 6) {
      const retryAfter = Number.parseInt(
        response.headers.get('retry-after') ?? '',
        10,
      );
      const waitMs = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : Math.min(30_000, 1000 * 2 ** attempt);
      await sleep(waitMs);
      return apiGet(params, attempt + 1);
    }
    if (!response.ok) {
      throw new Error(`Wikisource API HTTP ${String(response.status)}`);
    }
    return (await response.json()) as WikiApiResponse;
  } finally {
    clearTimeout(timer);
  }
}

async function enumerateSubpages(): Promise<string[]> {
  const titles: string[] = [];
  let cont: string | undefined;
  do {
    const params: Record<string, string> = {
      action: 'query',
      list: 'allpages',
      apprefix: WORK_PREFIX,
      apnamespace: '0',
      aplimit: '500',
      format: 'json',
      formatversion: '2',
    };
    if (cont) {
      params['apcontinue'] = cont;
    }
    const data = await apiGet(params);
    for (const page of data.query?.allpages ?? []) {
      titles.push(page.title);
    }
    cont = data.continue?.['apcontinue'];
  } while (cont);
  return titles;
}

interface Section {
  readonly title: string;
  readonly pdfFrom: number | null;
  readonly lines: string[];
}

function cachePathFor(cacheDir: string, title: string): string {
  const key = createHash('sha1').update(title, 'utf8').digest('hex');
  return resolve(cacheDir, `${key}.json`);
}

/**
 * Fetches (or loads from the on-disk checkpoint) one section. Returns null if the
 * section still can't be retrieved after backoff — a later resume run retries it,
 * so a few stubborn rate-limits never abort or corrupt the whole ingest.
 */
async function fetchSection(
  title: string,
  cacheDir: string,
): Promise<Section | null> {
  const cacheFile = cachePathFor(cacheDir, title);
  if (existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, 'utf8')) as Section;
  }
  try {
    const data = await apiGet({
      action: 'parse',
      page: title,
      prop: 'text|wikitext',
      format: 'json',
      formatversion: '2',
      disablelimitreport: '1',
    });
    const section: Section = {
      title,
      pdfFrom: parsePdfFromPage(data.parse?.wikitext ?? ''),
      lines: extractBeytLines(data.parse?.text ?? ''),
    };
    writeFileSync(cacheFile, JSON.stringify(section), 'utf8');
    return section;
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item !== undefined) {
        results[index] = await worker(item, index);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const rawDir = resolve(root, 'sources-private/poetry/raw', SOURCE_ID);
  const cacheDir = resolve(rawDir, '.section-cache');
  const extracted = resolve(
    root,
    'sources-private/poetry/extracted/rumi-fa.jsonl',
  );
  mkdirSync(cacheDir, { recursive: true });

  // `--assemble-only` rebuilds staging from the on-disk checkpoint cache without
  // any network — used to proceed with whatever sections have been ingested so
  // far while the (rate-limited) fetch continues/resumes separately.
  const assembleOnly = process.argv.includes('--assemble-only');
  let failed = 0;
  let sections: (Section | null)[];

  if (assembleOnly) {
    sections = readdirSync(cacheDir)
      .filter((file) => file.endsWith('.json'))
      .map(
        (file) =>
          JSON.parse(readFileSync(resolve(cacheDir, file), 'utf8')) as Section,
      );
    process.stdout.write(
      `Assemble-only: loaded ${String(sections.length)} cached sections (no network).\n`,
    );
  } else {
    process.stdout.write('Enumerating Masnavi section subpages…\n');
    const titles = await enumerateSubpages();
    const cachedAtStart = titles.filter((title) =>
      existsSync(cachePathFor(cacheDir, title)),
    ).length;
    process.stdout.write(
      `Found ${String(titles.length)} subpages (${String(cachedAtStart)} already cached). Fetching the rest…\n`,
    );
    sections = await mapWithConcurrency(titles, 2, async (title, index) => {
      const alreadyCached = existsSync(cachePathFor(cacheDir, title));
      if (!alreadyCached) {
        await sleep(200); // polite stagger to respect Wikimedia rate limits
      }
      const section = await fetchSection(title, cacheDir);
      if (section === null) {
        failed += 1;
      }
      if ((index + 1) % 50 === 0) {
        process.stdout.write(
          `  …${String(index + 1)}/${String(titles.length)} (${String(failed)} unresolved)\n`,
        );
      }
      return section;
    });
  }

  const verseSections = sections
    .filter((section): section is Section => section !== null)
    .filter((section) => section.lines.length > 0)
    .sort(
      (a, b) =>
        (a.pdfFrom ?? Number.MAX_SAFE_INTEGER) -
          (b.pdfFrom ?? Number.MAX_SAFE_INTEGER) ||
        a.title.localeCompare(b.title),
    );

  const totalLines = verseSections.reduce((sum, s) => sum + s.lines.length, 0);

  // Raw provenance artifact (git-ignored).
  const rawArtifact = {
    sourceId: SOURCE_ID,
    work: 'مثنوی معنوی (Nicholson, DowreKamelMasnavi.pdf)',
    retrievedFrom: 'fa.wikisource.org ProofreadPage sections',
    sectionCount: verseSections.length,
    beytLineCount: totalLines,
    sections: verseSections,
  };
  const rawJson = `${JSON.stringify(rawArtifact, null, 2)}\n`;
  writeFileSync(resolve(rawDir, 'masnavi-sections.json'), rawJson, 'utf8');

  // Deterministic staging: one block per section (ExtractedBlock shape).
  const jsonl = verseSections
    .map((section, sequence) => {
      const rawText = section.lines.join('\n');
      return JSON.stringify({
        sourceId: SOURCE_ID,
        documentPath: section.title,
        sequence,
        headingPath: [section.title.replace(WORK_PREFIX, '')],
        rawText,
        searchText: rawText
          .normalize('NFC')
          // Strip zero-width chars (ZWSP/ZWNJ/ZWJ/BOM) for SEARCH text only.
          .replace(/\p{Cf}/gu, '')
          .replace(/\s+/gu, ' ')
          .trim(),
        rawTextSha256: createHash('sha256')
          .update(rawText, 'utf8')
          .digest('hex'),
      });
    })
    .join('\n');
  writeFileSync(extracted, jsonl.length > 0 ? `${jsonl}\n` : '', 'utf8');

  const digest = createHash('sha256').update(rawJson, 'utf8').digest('hex');
  process.stdout.write(
    `\nIngested ${String(verseSections.length)} verse sections, ${String(totalLines)} beyt lines.\n` +
      `Raw artifact sha256: ${digest}\n` +
      `Staging: sources-private/poetry/extracted/rumi-fa.jsonl\n` +
      (failed > 0
        ? `${String(failed)} sections unresolved (rate-limited). Re-run \`pnpm poetry:fetch-masnavi\` to resume — cached sections are skipped.\n`
        : 'All sections resolved.\n'),
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
      error instanceof Error ? error.message : 'Unknown Masnavi fetch failure.';
    process.stderr.write(`Masnavi section fetch FAILED: ${message}\n`);
    process.exitCode = 1;
  });
}
