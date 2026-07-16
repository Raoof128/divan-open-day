import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);

function readProjectFile(path: string): string {
  return readFileSync(resolve(projectRoot, path), 'utf8');
}

/**
 * README prose with runs of whitespace collapsed, so licence assertions match
 * on wording rather than on wherever Prettier happens to wrap the line.
 */
function readmeProse(): string {
  return readProjectFile('README.md').replace(/\s+/gu, ' ');
}

describe('public repository status and ownership', () => {
  test('publishes a WIP README that licenses the code and withholds the rest', () => {
    const readme = readmeProse();
    const packageJson = JSON.parse(readProjectFile('package.json')) as Record<
      string,
      unknown
    >;

    expect(readme).toContain('Work in progress');
    expect(readme).toContain('not deployed');
    expect(readme).toContain('exactly 60 Hafez and 60 Rumi');
    expect(readme).toContain('source-bound production corpus');
    expect(readme).toContain('productionEligible: false');
    expect(readme).toContain('Node.js 22.16.0');
    expect(readme).toContain('pnpm 10.33.0');
    expect(readme).toContain(
      'pnpm exec vite preview --host 127.0.0.1 --port 4173',
    );
    expect(readme).toContain('fail-closed release error');
    expect(readme).toContain('[Security policy](SECURITY.md)');
    expect(readme).toContain('[Third-party notices](THIRD_PARTY_NOTICES.md)');
    expect(readProjectFile('.node-version')).toBe('22.16.0\n');
    expect(packageJson).toMatchObject({
      private: true,
      repository: {
        type: 'git',
        url: 'git+https://github.com/Raoof128/divan-open-day.git',
      },
      homepage: 'https://github.com/Raoof128/divan-open-day#readme',
    });
  });

  // The MIT grant is stated in three places that can drift apart independently.
  // They disagreed once already: LICENSE and package.json said MIT while the
  // README still refused every right MIT grants. Bind them together here so a
  // future licence change has to move all three or fail.
  test('states one coherent MIT grant across LICENSE, package.json, and README', () => {
    const licence = readProjectFile('LICENSE');
    const readme = readmeProse();
    const packageJson = JSON.parse(readProjectFile('package.json')) as Record<
      string,
      unknown
    >;

    expect(existsSync(resolve(projectRoot, 'LICENSE'))).toBe(true);
    expect(licence).toContain('MIT License');
    expect(licence).toContain('Copyright (c) 2026 Raouf Abedini');
    expect(packageJson).toHaveProperty('license', 'MIT');

    expect(readme).toContain('MIT Licence');
    expect(readme).toContain('[LICENSE](LICENSE)');
    expect(readme).toContain("this repository's own code only");

    // The old all-rights-reserved wording must not survive alongside the grant.
    expect(readme).not.toContain('All rights reserved');
    expect(readme).not.toContain('No licence is granted to copy');
  });

  // MIT covers the code. It must never be read as licensing the poetry, the
  // third-party source editions, or the Society's marks.
  test('withholds the poetry, the source editions, and the marks from the MIT grant', () => {
    const readme = readmeProse();

    expect(readme).toContain('no licence is granted for');
    expect(readme).toContain('Persian poetry, translations, and reflections');
    expect(readme).toContain('CC BY-SA');
    expect(readme).toContain('Persian Society names and marks');
    expect(readme).toContain('not licensed for reuse');
    expect(readme).toContain(
      'Third-party components remain under their own licences',
    );
  });

  test('uses GitHub private vulnerability reporting without invented contact data', () => {
    const security = readProjectFile('SECURITY.md');

    expect(security).toContain('private vulnerability reporting');
    expect(security).toContain('Security');
    expect(security).toContain('Report a vulnerability');
    expect(security).toContain('Do not open a public issue');
    expect(security).not.toMatch(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/u,
    );
  });

  test('assigns public repository review ownership to the validated account', () => {
    expect(readProjectFile('.github/CODEOWNERS')).toBe('* @Raoof128\n');
  });
});

describe('font redistribution notices', () => {
  const fontPackages = [
    '@fontsource/cormorant-garamond',
    '@fontsource/inter',
    '@fontsource/noto-nastaliq-urdu',
    '@fontsource/vazirmatn',
  ] as const;

  test('copies the installed OFL text and exact metadata attribution', () => {
    const notices = readProjectFile('THIRD_PARTY_NOTICES.md');
    let sharedOflText: string | null = null;

    for (const packageName of fontPackages) {
      const packageJsonPath = require.resolve(`${packageName}/package.json`);
      const metadataPath = require.resolve(`${packageName}/metadata.json`);
      const licensePath = require.resolve(`${packageName}/LICENSE`);
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        license: string;
        version: string;
      };
      const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
        family: string;
        license: { attribution: string; type: string };
        version: string;
      };
      const installedLicense = readFileSync(licensePath, 'utf8');
      const attribution = installedLicense.slice(
        0,
        installedLicense.indexOf('\n\n'),
      );
      const oflText = installedLicense.slice(
        installedLicense.indexOf(
          '-----------------------------------------------------------',
        ),
      );

      expect(packageJson.license).toBe('OFL-1.1');
      expect(metadata.license.type).toBe('OFL-1.1');
      expect(metadata.license.attribution).toBe(attribution);
      expect(notices).toContain(
        `${metadata.family} | ${packageName} ${packageJson.version} | upstream ${metadata.version}`,
      );
      expect(notices).toContain(attribution);
      sharedOflText ??= oflText;
      expect(oflText).toBe(sharedOflText);
    }

    expect(sharedOflText).not.toBeNull();
    expect(notices).toContain(sharedOflText!);
    expect(notices).toContain(
      'No licence is granted for repository-authored material',
    );
  });
});

describe('public operational evidence boundary', () => {
  test('keeps machine discovery private while retaining public image pins', () => {
    const phaseZero = readProjectFile('docs/phase-0-environment-decisions.md');
    const publicBoundary = phaseZero.slice(
      0,
      phaseZero.indexOf('## Immutable upstream images'),
    );

    expect(publicBoundary).toContain('private deployment evidence');
    expect(publicBoundary).toContain('No machine survey is published');
    expect(publicBoundary).not.toMatch(
      /Ubuntu 24\.04|2 vCPU|2 GiB|36 GiB|Docker Engine 29\.3\.1|Docker Compose 5\.1\.1|cloudflared 2026\.3\.0|nginx|UFW|EOI|ballot/iu,
    );
    expect(phaseZero).not.toMatch(
      /\/Users\/|\.ssh\/|persian-society-eoi-secrets|eoiadmin/iu,
    );
    expect(phaseZero).toContain(
      'docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e',
    );
    expect(phaseZero).toContain(
      'node:22.16.0-alpine3.21@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca',
    );
    expect(phaseZero).toContain(
      'caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d',
    );
    expect(phaseZero).toContain(
      'cloudflare/cloudflared:2026.7.0@sha256:5e49861633763e8933475477c20bae6039ed47f32c1d267a34babc347f28f0df',
    );
  });

  test('names the ops fixture as synthetic and keeps the old credential name absent', () => {
    const opsTests = readProjectFile('tests/security/opsConfig.test.ts');
    const fixtureReadme = readProjectFile('tests/fixtures/ops/README.md');

    expect(opsTests).toContain('synthetic-not-a-credential.json');
    expect(opsTests).not.toContain('test-credentials.json');
    expect(fixtureReadme).toContain('synthetic');
    expect(fixtureReadme).toContain('cannot authenticate');
    expect(
      existsSync(
        resolve(
          projectRoot,
          'tests/fixtures/ops/synthetic-not-a-credential.json',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(projectRoot, 'tests/fixtures/ops/test-credentials.json'),
      ),
    ).toBe(false);
  });

  test('requires the exact production release and a pinned OSV CI scan', () => {
    const check = readProjectFile('scripts/check.sh');
    const workflow = readProjectFile('.github/workflows/ci.yml');

    expect(check).toContain(
      "DIVAN_PUBLIC_ORIGIN='https://divan.raoufabedini.dev'",
    );
    expect(check).toContain("DIVAN_MIN_HAFEZ_COUNT='60'");
    expect(check).toContain("DIVAN_MIN_RUMI_COUNT='60'");
    expect(check).toContain("step 'build:production' production_build");
    expect(check).not.toContain("gate_closed 'build:production'");
    expect(workflow).toContain('name: OSV dependency scan');
    expect(workflow).toContain(
      'osv-scanner-reusable.yml@8dc09193bb540e09b23da07ad7e30bd33bf87018',
    );
    expect(workflow).toContain('needs: osv-scan');
  });
});
