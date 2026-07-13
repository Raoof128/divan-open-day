import {
  execFileSync,
  spawnSync,
  type SpawnSyncReturns,
} from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { afterAll, describe, expect, test } from 'vitest';
import { parse } from 'yaml';

const projectRoot = resolve(import.meta.dirname, '../..');
const fixtureRoot = resolve(projectRoot, 'tests/fixtures/ops');
const opsRoot = resolve(projectRoot, 'ops');
const immutableImagePattern =
  /^[a-z0-9][a-z0-9._:/-]*(?::[a-z0-9._-]+)?@sha256:[a-f0-9]{64}$/u;

function readProjectFile(path: string): string {
  return readFileSync(resolve(projectRoot, path), 'utf8');
}

function runScript(
  script: string,
  args: readonly string[],
): SpawnSyncReturns<string> {
  return spawnSync('bash', [resolve(opsRoot, 'scripts', script), ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      PATH: process.env['PATH'],
    },
  });
}

describe('production image contract', () => {
  test('pins every upstream stage to a real immutable digest', () => {
    const dockerfile = readProjectFile('ops/Dockerfile');
    const syntaxReference = dockerfile.match(/^# syntax=([^\n]+)$/mu)?.[1];
    const imageReferences = [
      ...dockerfile.matchAll(/^FROM\s+([^\s]+)(?:\s+AS\s+\S+)?$/gimu),
    ].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

    expect(imageReferences).toHaveLength(2);
    expect(syntaxReference).toMatch(
      /^docker\/dockerfile:[a-z0-9._-]+@sha256:[a-f0-9]{64}$/u,
    );
    expect(imageReferences.every((image) => immutableImagePattern.test(image))).toBe(true);
    expect(dockerfile).not.toMatch(/VERIFIED_DIGEST|PLACEHOLDER|CHANGEME|latest/iu);
  });

  test('defaults to the production content gate and marks fixture builds', () => {
    const dockerfile = readProjectFile('ops/Dockerfile');

    expect(dockerfile).toContain('ARG DIVAN_BUILD_MODE=production');
    expect(dockerfile).toMatch(/production\).*pnpm build:production/su);
    expect(dockerfile).toMatch(/fixture\).*pnpm build:fixture/su);
    expect(dockerfile).toContain('org.opencontainers.image.divan-build-mode=$DIVAN_BUILD_MODE');
    expect(dockerfile).toContain('pnpm verify:dist');
  });

  test('copies only verified public output into an unprivileged Caddy runtime', () => {
    const dockerfile = readProjectFile('ops/Dockerfile');

    expect(dockerfile).toContain('RUN setcap -r /usr/bin/caddy');
    expect(dockerfile).toMatch(/COPY --from=build[^\n]*\/app\/dist \/srv/u);
    expect(dockerfile).not.toMatch(/COPY --from=build[^\n]*(content-private|src|\.git)/u);
    expect(dockerfile).toContain('USER 10001:10001');
    expect(dockerfile).toContain('EXPOSE 8080');
  });
});

describe('static origin delivery contract', () => {
  const targetCsp = [
    "default-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
  ].join('; ');

  test('sets the exact CSP and locked browser security headers', () => {
    const caddyfile = readProjectFile('ops/Caddyfile');

    expect(caddyfile).toContain(`Content-Security-Policy "${targetCsp};"`);
    expect(caddyfile).toContain('X-Content-Type-Options "nosniff"');
    expect(caddyfile).toContain('Referrer-Policy "no-referrer"');
    expect(caddyfile).toContain('Cross-Origin-Opener-Policy "same-origin"');
    expect(caddyfile).toContain('Cross-Origin-Resource-Policy "same-origin"');
    expect(caddyfile).toContain(
      'Permissions-Policy "camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()"',
    );
    expect(caddyfile).not.toMatch(/unsafe-inline|unsafe-eval/iu);
  });

  test('disables access logs and implements exact health, cache, and fallback rules', () => {
    const caddyfile = readProjectFile('ops/Caddyfile');

    expect(caddyfile).toMatch(/:8080/u);
    expect(caddyfile).toMatch(/log\s*\{[^}]*output discard/su);
    expect(caddyfile).toMatch(/\/healthz[\s\S]*Cache-Control "no-store"/u);
    expect(caddyfile).toContain('?Cache-Control "no-cache, must-revalidate"');
    expect(caddyfile).toContain('no-cache, must-revalidate');
    expect(caddyfile).toContain('public, max-age=31536000, immutable');
    expect(caddyfile).toContain('public, max-age=3600');
    expect(caddyfile).toMatch(/@documents[\s\S]*rewrite \* \/index\.html/su);
    expect(caddyfile).toMatch(/@staticAssets[\s\S]*file_server/su);
    expect(caddyfile).not.toMatch(/browse/u);
  });
});

describe('Compose and tunnel isolation', () => {
  test('uses immutable images without host publication', () => {
    const source = readProjectFile('ops/compose.yml');
    const compose = parse(source) as {
      services: Record<string, { image: string; ports?: unknown }>;
    };

    expect(source).toContain('${DIVAN_WEB_IMAGE:?');
    expect(immutableImagePattern.test(compose.services['cloudflared']!.image)).toBe(true);
    expect(compose.services['divan-web']!.ports).toBeUndefined();
    expect(compose.services['cloudflared']!.ports).toBeUndefined();
    expect(source).not.toMatch(/VERIFIED_DIGEST|PLACEHOLDER|CHANGEME|latest/iu);
  });

  test('keeps the web origin internal while cloudflared alone receives egress', () => {
    const compose = parse(readProjectFile('ops/compose.yml')) as {
      services: Record<string, { networks: string[] }>;
      networks: Record<string, { internal?: boolean; name: string }>;
    };

    expect(compose.networks['divan_origin']).toEqual({
      internal: true,
      name: 'divan_origin',
    });
    expect(compose.networks['divan_egress']).toMatchObject({ name: 'divan_egress' });
    expect(compose.services['divan-web']!.networks).toEqual(['divan_origin']);
    expect(compose.services['cloudflared']!.networks).toEqual([
      'divan_origin',
      'divan_egress',
    ]);
  });

  test.each(['divan-web', 'cloudflared'])('hardens %s', (serviceName) => {
    const compose = parse(readProjectFile('ops/compose.yml')) as {
      services: Record<
        string,
        {
          cap_drop: string[];
          cpus: number;
          mem_limit: string;
          read_only: boolean;
          restart: string;
          security_opt: string[];
          user: string;
        }
      >;
    };
    const service = compose.services[serviceName]!;

    expect(service.read_only).toBe(true);
    expect(service.cap_drop).toEqual(['ALL']);
    expect(service.security_opt).toContain('no-new-privileges:true');
    expect(service.restart).toBe('unless-stopped');
    expect(service.user).not.toMatch(/^0(?::0)?$/u);
    expect(service.mem_limit).toMatch(/^\d+m$/u);
    expect(service.cpus).toBeGreaterThan(0);
  });

  test('isolates health and credentials from the public web container', () => {
    const source = readProjectFile('ops/compose.yml');
    const template = readProjectFile('ops/cloudflared/config.yml.example');
    const compose = parse(source) as {
      services: Record<
        string,
        { depends_on?: unknown; healthcheck?: unknown; volumes?: string[] }
      >;
    };

    expect(compose.services['divan-web']!.healthcheck).toBeDefined();
    expect(compose.services['cloudflared']!.depends_on).toEqual({
      'divan-web': { condition: 'service_healthy' },
    });
    expect(compose.services['divan-web']!.volumes).toBeUndefined();
    expect(
      compose.services['cloudflared']!.volumes?.every((value) =>
        value.endsWith(':ro'),
      ),
    ).toBe(true);

    const healthIndex = template.indexOf('path: ^/healthz$');
    const originIndex = template.indexOf('service: http://divan-web:8080');
    const catchAllIndex = template.lastIndexOf('service: http_status:404');
    expect(healthIndex).toBeGreaterThan(0);
    expect(originIndex).toBeGreaterThan(healthIndex);
    expect(catchAllIndex).toBeGreaterThan(originIndex);
    expect(template).not.toMatch(/[0-9a-f]{8}-[0-9a-f-]{27,}|\.com\b|credentials\.json/iu);
  });
});

describe('safe deployment controls', () => {
  const immutableImage = readFileSync(
    resolve(fixtureRoot, 'immutable-image.txt'),
    'utf8',
  ).trim();
  const config = resolve(fixtureRoot, 'rendered-config.yml');
  const credentials = resolve(fixtureRoot, 'test-credentials.json');

  test('renders tunnel config only from validated non-secret inputs', () => {
    const temp = mkdtempSync(resolve(tmpdir(), 'divan-ops-render-'));
    const output = resolve(temp, 'config.yml');

    try {
      const result = runScript('render-tunnel-config.sh', [
        '--hostname',
        'divan.test.invalid',
        '--tunnel-id',
        '00000000-0000-4000-8000-000000000000',
        '--output',
        output,
      ]);

      expect(result.status).toBe(0);
      const rendered = readFileSync(output, 'utf8');
      expect(rendered).toContain('hostname: divan.test.invalid');
      expect(rendered).toContain('tunnel: 00000000-0000-4000-8000-000000000000');
      expect(rendered).toContain('credentials-file: /run/secrets/divan-tunnel.json');
      expect(rendered).toContain('path: ^/healthz$');
      expect(rendered.trimEnd()).toMatch(/service: http_status:404$/u);
    } finally {
      rmSync(temp, { force: true, recursive: true });
    }
  });

  test('rejects malformed DNS names before rendering configuration', () => {
    const temp = mkdtempSync(resolve(tmpdir(), 'divan-ops-hostname-'));
    const output = resolve(temp, 'config.yml');

    try {
      const result = runScript('render-tunnel-config.sh', [
        '--hostname',
        'divan..test.invalid',
        '--tunnel-id',
        '00000000-0000-4000-8000-000000000000',
        '--output',
        output,
      ]);

      expect(result.status).not.toBe(0);
      expect(existsSync(output)).toBe(false);
    } finally {
      rmSync(temp, { force: true, recursive: true });
    }
  });

  test.each(['deploy.sh', 'preflight.sh', 'verify.sh'])(
    '%s accepts an immutable candidate in privacy-safe dry-run mode',
    (script) => {
      const stateDir = mkdtempSync(resolve(tmpdir(), 'divan-ops-state-'));

      try {
        writeFileSync(resolve(stateDir, 'current-image.txt'), `${immutableImage}\n`, {
          mode: 0o600,
        });
        const result = runScript(script, [
          '--image',
          immutableImage,
          '--state-dir',
          stateDir,
          '--config',
          config,
          '--credentials',
          credentials,
          '--dry-run',
        ]);

        expect(result.status, result.stderr).toBe(0);
        expect(result.stdout).toContain('DRY-RUN');
        expect(`${result.stdout}${result.stderr}`).not.toContain(
          'TEST-ONLY-CREDENTIAL-MATERIAL',
        );
      } finally {
        rmSync(stateDir, { force: true, recursive: true });
      }
    },
  );

  test('rollback selects the previous immutable image without rebuilding', () => {
    const stateDir = mkdtempSync(resolve(tmpdir(), 'divan-ops-rollback-'));

    try {
      writeFileSync(resolve(stateDir, 'current-image.txt'), `${immutableImage}\n`, {
        mode: 0o600,
      });
      writeFileSync(resolve(stateDir, 'previous-image.txt'), `${immutableImage}\n`, {
        mode: 0o600,
      });
      const result = runScript('rollback.sh', [
        '--state-dir',
        stateDir,
        '--config',
        config,
        '--credentials',
        credentials,
        '--dry-run',
      ]);

      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('DRY-RUN');
      expect(result.stdout).not.toMatch(/docker build/u);
    } finally {
      rmSync(stateDir, { force: true, recursive: true });
    }
  });

  test('preflight rejects a missing state directory without creating it', () => {
    const temp = mkdtempSync(resolve(tmpdir(), 'divan-ops-preflight-'));
    const missingState = resolve(temp, 'missing-state');
    const privateCredentials = resolve(temp, 'credentials.json');
    writeFileSync(privateCredentials, '{"test_only":true}\n', { mode: 0o400 });

    try {
      const result = runScript('preflight.sh', [
        '--image',
        immutableImage,
        '--state-dir',
        missingState,
        '--config',
        config,
        '--credentials',
        privateCredentials,
        '--public-origin',
        'https://divan.test.invalid',
      ]);

      expect(result.status).not.toBe(0);
      expect(existsSync(missingState)).toBe(false);
    } finally {
      rmSync(temp, { force: true, recursive: true });
    }
  });

  test.each(['deploy.sh', 'preflight.sh', 'verify.sh'])(
    '%s rejects mutable or command-shaped image input',
    (script) => {
      const temp = mkdtempSync(resolve(tmpdir(), 'divan-ops-injection-'));
      const sentinel = resolve(temp, 'must-not-exist');
      const result = runScript(script, [
        '--image',
        `divan-open-day:latest;touch ${sentinel}`,
        '--state-dir',
        temp,
        '--config',
        config,
        '--credentials',
        credentials,
        '--dry-run',
      ]);

      try {
        expect(result.status).not.toBe(0);
        expect(() => readFileSync(sentinel)).toThrow();
      } finally {
        rmSync(temp, { force: true, recursive: true });
      }
    },
  );

  test('deployment scripts never invoke a server-side image build', () => {
    const scripts = ['preflight.sh', 'deploy.sh', 'verify.sh', 'rollback.sh']
      .map((script) => readProjectFile(`ops/scripts/${script}`))
      .join('\n');

    expect(scripts).not.toMatch(/docker\s+(?:compose\s+)?build/u);
    expect(scripts).not.toMatch(/\beval\b/u);
    expect(scripts).not.toMatch(/credentials[^\n]*(?:cat|echo|printf)/iu);
  });

  test('records state only after verification and restores failed rollback attempts', () => {
    const deploy = readProjectFile('ops/scripts/deploy.sh');
    const rollback = readProjectFile('ops/scripts/rollback.sh');

    expect(deploy.indexOf('compose pull')).toBeLessThan(
      deploy.indexOf('write_state_file "$current_file" "$COMMON_IMAGE"'),
    );
    expect(rollback).toContain(
      'Rollback verification failed; restoring the current immutable image.',
    );
  });
});

afterAll(() => {
  // Ensure this suite never accidentally relies on a local interactive shell.
  expect(execFileSync('bash', ['-c', 'printf test'], { encoding: 'utf8' })).toBe(
    'test',
  );
});
