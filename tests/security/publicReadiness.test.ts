import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);

function readProjectFile(path: string): string {
  return readFileSync(resolve(projectRoot, path), 'utf8');
}

describe('public repository status and ownership', () => {
  test('publishes a WIP README without granting a repository licence', () => {
    const readme = readProjectFile('README.md');
    const packageJson = JSON.parse(readProjectFile('package.json')) as Record<
      string,
      unknown
    >;

    expect(readme).toContain('Work in progress');
    expect(readme).toContain('not deployed');
    expect(readme).toContain('no approved production poetry corpus');
    expect(readme).toContain('productionEligible: false');
    expect(readme).toContain('Node.js 22.16.0');
    expect(readme).toContain('pnpm 10.33.0');
    expect(readme).toContain(
      'pnpm exec vite preview --host 127.0.0.1 --port 4173',
    );
    expect(readme).toContain('fail-closed release error');
    expect(readme).toContain('No licence is granted');
    expect(readme).toContain('All rights reserved');
    expect(readme).toContain('[Security policy](SECURITY.md)');
    expect(readme).toContain('[Third-party notices](THIRD_PARTY_NOTICES.md)');
    expect(readProjectFile('.node-version')).toBe('22.16.0\n');
    expect(packageJson).not.toHaveProperty('license');
    expect(packageJson).toMatchObject({
      private: true,
      repository: {
        type: 'git',
        url: 'git+https://github.com/Raoof128/divan-open-day.git',
      },
      homepage: 'https://github.com/Raoof128/divan-open-day#readme',
    });
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
});
