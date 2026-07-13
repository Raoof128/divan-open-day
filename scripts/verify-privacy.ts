#!/usr/bin/env tsx
/**
 * Privacy verification (design §23 / §30.4).
 *
 * Fail-closed static proof that the built site and its source contain no
 * analytics, tracking, advertising, fingerprinting, social SDK, cookie
 * writing, or geolocation. Browser storage is intentionally permitted for the
 * documented session state and the local motion preference (§5.4), so storage
 * is not treated as a violation here; `verify:dist` covers integrity/leakage.
 *
 * Exits non-zero on any violation. Run after `pnpm build:fixture`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

interface Rule {
  readonly id: string;
  readonly pattern: RegExp;
  readonly reason: string;
}

// Violations in BOTH source and built output. Host-based so they do not collide
// with minified identifiers (e.g. a bundled function named `ga`).
const FORBIDDEN_EVERYWHERE: readonly Rule[] = [
  {
    id: 'cookie-write',
    pattern: /document\s*\.\s*cookie\s*=[^=]/u,
    reason: 'no cookies (§23)',
  },
  {
    id: 'geolocation',
    pattern: /navigator\s*\.\s*geolocation/u,
    reason: 'no geolocation (§23)',
  },
  {
    id: 'analytics-host',
    pattern:
      /google-analytics\.com|googletagmanager\.com|stats\.g\.doubleclick|region1\.google-analytics/u,
    reason: 'no analytics host',
  },
  {
    id: 'ad-host',
    pattern: /doubleclick\.net|googlesyndication\.com|adservice\.google/u,
    reason: 'no advertising host',
  },
  {
    id: 'social-sdk-host',
    pattern:
      /connect\.facebook\.net|platform\.twitter\.com|platform\.linkedin\.com/u,
    reason: 'no social SDK host',
  },
  {
    id: 'tracker-host',
    pattern:
      /\bcdn\.mixpanel\b|\bcdn\.segment\b|static\.hotjar\.com|plausible\.io|\bmatomo\b|cdn\.amplitude\.com|fullstory\.com|clarity\.ms/iu,
    reason: 'no third-party tracker host',
  },
  {
    id: 'fingerprint',
    pattern: /fingerprintjs|@fingerprint/iu,
    reason: 'no fingerprinting library',
  },
];

// Additional call-shaped patterns checked only in unminified source, where they
// cannot collide with minified variable names.
const FORBIDDEN_SOURCE: readonly Rule[] = [
  { id: 'gtag-call', pattern: /\bgtag\s*\(/u, reason: 'no Google tag' },
  { id: 'fbq-call', pattern: /\bfbq\s*\(/u, reason: 'no Facebook pixel' },
  {
    id: 'datalayer',
    pattern: /\bdataLayer\s*\.\s*push/u,
    reason: 'no GTM dataLayer',
  },
];

const SOURCE_DIRS = ['src', 'src-sw'];
const DIST_DIR = 'dist';
const CODE_EXT = /\.(ts|tsx|css|js|html|webmanifest|json)$/u;

function walk(dir: string): string[] {
  const abs = resolve(ROOT, dir);
  let entries: string[];
  try {
    entries = readdirSync(abs);
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = resolve(abs, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(resolve(dir, entry)));
    } else if (CODE_EXT.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const violations: string[] = [];

function scan(dir: string, rules: readonly Rule[]): void {
  for (const file of walk(dir)) {
    const text = readFileSync(file, 'utf8');
    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        violations.push(
          `${file.replace(`${ROOT}/`, '')}: ${rule.id} — ${rule.reason}`,
        );
      }
    }
  }
}

for (const dir of SOURCE_DIRS) {
  scan(dir, [...FORBIDDEN_EVERYWHERE, ...FORBIDDEN_SOURCE]);
}
scan(DIST_DIR, FORBIDDEN_EVERYWHERE);

// Positive assertion: the app uses session-scoped storage for draw/session state.
const appFile = resolve(ROOT, 'src/app/App.tsx');
try {
  if (
    !/browserStorage\(\s*'sessionStorage'\s*\)/u.test(
      readFileSync(appFile, 'utf8'),
    )
  ) {
    violations.push(
      'src/app/App.tsx: expected session-scoped draw/session storage',
    );
  }
} catch {
  violations.push('src/app/App.tsx: application shell not found');
}

if (violations.length > 0) {
  console.error('Privacy verification FAILED:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(
  'Privacy verification passed: no cookies, analytics/ad/social/tracker hosts, tag/pixel calls, fingerprinting, or geolocation in source or dist; storage is session/local-preference only.',
);
