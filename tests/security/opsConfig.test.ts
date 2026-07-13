import {
  execFileSync,
  spawnSync,
  type SpawnSyncReturns,
} from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
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
  extraEnv: Readonly<Record<string, string>> = {},
): SpawnSyncReturns<string> {
  return spawnSync('bash', [resolve(opsRoot, 'scripts', script), ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      PATH: process.env['PATH'],
      ...extraEnv,
    },
  });
}

function runLibraryFunction(
  command: string,
  env: Readonly<Record<string, string>>,
): SpawnSyncReturns<string> {
  return spawnSync(
    'bash',
    ['--noprofile', '--norc', '-c', `source "${resolve(opsRoot, 'scripts', 'lib.sh')}"; ${command}`],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { PATH: process.env['PATH'], ...env },
    },
  );
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

  test('requires production release metadata at both image and filesystem layers', () => {
    const dockerfile = readProjectFile('ops/Dockerfile');
    const health = readProjectFile('ops/scripts/container-health.sh');

    expect(dockerfile).toContain(
      'org.opencontainers.image.divan-build-mode=$DIVAN_BUILD_MODE',
    );
    expect(health).toContain('[ -f /srv/index.html ] || exit 1');
    expect(health).toContain('[ "$build_profile" = production ] || exit 1');
    expect(health).toContain('[ "$production_eligible" = true ] || exit 1');
    expect(health).toContain(
      '[ "$content_path" = "/content/${content_sha}.json" ] || exit 1',
    );
    expect(health).toContain(
      '[ "$asset_manifest_path" = "/assets/${asset_manifest_sha}.json" ] || exit 1',
    );
    expect(health).toContain('wget -q -T 5');
    expect(health).not.toMatch(
      /\[ -f \/srv\/index\.html \] \|\| \[ -f "\$release_file" \]/u,
    );
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
    expect(caddyfile).toContain('no-cache, must-revalidate');
    expect(caddyfile).toContain('public, max-age=31536000, immutable');
    expect(caddyfile).toContain('public, max-age=3600');
    expect(caddyfile).toContain('?Cache-Control "no-store"');
    expect(caddyfile).toMatch(/@immutable\s*\{[\s\S]*path_regexp[\s\S]*file[\s\S]*\}/u);
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
      driver: 'bridge',
      labels: {
        'org.persiansocietyeoi.divan.network-role': 'origin',
        'org.persiansocietyeoi.divan.scope': 'dedicated',
      },
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
      services: Record<string, {
        depends_on?: unknown;
        healthcheck?: unknown;
        volumes?: Array<{
          bind?: { create_host_path?: boolean };
          read_only?: boolean;
          source?: string;
          target?: string;
          type?: string;
        }>;
      }>;
    };

    expect(compose.services['divan-web']!.healthcheck).toBeDefined();
    expect(compose.services['cloudflared']!.depends_on).toEqual({
      'divan-web': { condition: 'service_healthy' },
    });
    expect(compose.services['divan-web']!.volumes).toBeUndefined();
    expect(compose.services['cloudflared']!.volumes).toEqual([
      {
        type: 'bind',
        source: '${DIVAN_TUNNEL_CONFIG_FILE:?set DIVAN_TUNNEL_CONFIG_FILE}',
        target: '/etc/cloudflared/config.yml',
        read_only: true,
        bind: { create_host_path: false },
      },
      {
        type: 'bind',
        source:
          '${DIVAN_TUNNEL_CREDENTIALS_FILE:?set DIVAN_TUNNEL_CREDENTIALS_FILE}',
        target: '/run/secrets/divan-tunnel.json',
        read_only: true,
        bind: { create_host_path: false },
      },
    ]);

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

  test('rejects non-production images and verifies the exact running digest', () => {
    const library = readProjectFile('ops/scripts/lib.sh');
    const deploy = readProjectFile('ops/scripts/deploy.sh');
    const verify = readProjectFile('ops/scripts/verify.sh');
    const rollback = readProjectFile('ops/scripts/rollback.sh');

    expect(library).toContain('require_production_image');
    expect(library).toContain('org.opencontainers.image.divan-build-mode');
    expect(library).toContain('production');
    expect(deploy).toContain('require_production_image "$candidate_image"');
    expect(deploy).toContain('require_production_image "$previous_image"');
    expect(rollback).toContain('require_production_image "$previous_image"');
    expect(rollback).toContain('require_production_image "$current_image"');
    expect(verify).toContain('require_running_image "$web_id" "$COMMON_IMAGE"');
    expect(verify).toContain('buildProfile');
    expect(verify).toContain('productionEligible');
  });

  test('bounds every HTTPS request and verifies the complete public contract', () => {
    const verify = readProjectFile('ops/scripts/verify.sh');

    expect(verify).toContain("--proto '=https'");
    expect(verify).toContain('--connect-timeout 5');
    expect(verify).toContain('--max-time 20');
    expect(verify).toContain('Referrer-Policy');
    expect(verify).toContain('Cross-Origin-Opener-Policy');
    expect(verify).toContain('Cross-Origin-Resource-Policy');
    expect(verify).toContain('Permissions-Policy');
    expect(verify).toContain('Content-Security-Policy');
    expect(verify).toContain('contentSha256');
    expect(verify).toContain('assetManifestSha256');
    expect(verify).toContain('public, max-age=31536000, immutable');
    expect(verify).toContain('public, max-age=3600');
    expect(verify).toContain('no-cache, must-revalidate');
    expect(verify).toContain('no-store');
    expect(verify).toContain('Server');
  });

  test('checks exact hardening and network membership for both containers', () => {
    const verify = readProjectFile('ops/scripts/verify.sh');

    expect(verify).toContain('require_hardened_container "$web_id"');
    expect(verify).toContain('require_hardened_container "$tunnel_id"');
    expect(verify).toContain("'divan_origin'");
    expect(verify).toContain("'divan_egress divan_origin'");
    expect(verify).toContain('no-new-privileges');
    expect(verify).toContain('PortBindings');
    expect(verify).toContain('65532:65532');
    expect(verify).toContain(
      '{"2019/tcp":null,"443/tcp":null,"443/udp":null,"80/tcp":null,"8080/tcp":null}',
    );
    expect(verify).toContain('"$image" == "$DIVAN_TUNNEL_IMAGE"');
  });

  test('requires root-provisioned tunnel files readable by UID 65532', () => {
    const library = readProjectFile('ops/scripts/lib.sh');
    const runbook = readProjectFile('docs/deployment-runbook.md');
    const renderer = readProjectFile('ops/scripts/render-tunnel-config.sh');

    expect(library).toContain('65532');
    expect(library).toContain('require_cloudflared_file');
    expect(renderer).toContain('chown 65532:65532');
    expect(renderer).toContain('chmod 0400');
    expect(runbook).toContain('install -o 65532 -g 65532 -m 0400');
    expect(runbook).toContain('UID/GID `65532:65532`');
  });

  test('validates tunnel file metadata without requiring operator read access', () => {
    const library = readProjectFile('ops/scripts/lib.sh');

    expect(library).toContain('require_absolute_regular_file_metadata');
    expect(library).toMatch(
      /require_cloudflared_file\(\)[\s\S]*require_absolute_regular_file_metadata "\$path" "\$label"/u,
    );
    expect(library).not.toMatch(
      /require_cloudflared_file\(\)[\s\S]*require_absolute_regular_file "\$path" "\$label"/u,
    );
  });

  test('binds release paths to their declared hashes and release identity', () => {
    const verify = readProjectFile('ops/scripts/verify.sh');

    expect(verify).toContain(
      '"$content_path" == "/content/${content_sha}.json"',
    );
    expect(verify).toContain(
      '"$asset_manifest_path" == "/assets/${asset_manifest_sha}.json"',
    );
    expect(verify).toContain('corpus_release_id');
    expect(verify).toContain('"$corpus_release_id" == "$release_id"');
  });

  test('checks global headers across every successful public cache class', () => {
    const verify = readProjectFile('ops/scripts/verify.sh');

    expect(verify).toMatch(
      /fetch_public '\/service-worker\.js'[\s\S]*require_global_headers "\$work_dir\/worker\.headers"/u,
    );
    expect(verify).toMatch(
      /fetch_public '\/manifest\.webmanifest'[\s\S]*require_global_headers "\$work_dir\/manifest\.headers"/u,
    );
  });

  test('requires missing hashed and unhashed paths to remain no-store 404s', () => {
    const verify = readProjectFile('ops/scripts/verify.sh');

    expect(verify).toContain('/assets/not-content-addressed.js');
    expect(verify).toContain('/assets/missing-deadbeef.js');
    expect(verify).toContain('Missing hashed static path did not remain an exact 404.');
  });

  test('rejects permissive or symlink-traversing state directories', () => {
    const temp = mkdtempSync(resolve(tmpdir(), 'divan-ops-state-boundary-'));
    const realState = resolve(temp, 'real-state');
    const linkedState = resolve(temp, 'linked-state');

    try {
      chmodSync(temp, 0o755);
      // mkdir through Node keeps this test independent from an interactive shell.
      const bootstrap = runScript('preflight.sh', [
        '--image',
        immutableImage,
        '--state-dir',
        temp,
        '--config',
        config,
        '--credentials',
        credentials,
        '--dry-run',
      ]);
      expect(bootstrap.status).not.toBe(0);

      execFileSync('mkdir', [realState]);
      chmodSync(realState, 0o700);
      symlinkSync(realState, linkedState);
      const linked = runScript('preflight.sh', [
        '--image',
        immutableImage,
        '--state-dir',
        linkedState,
        '--config',
        config,
        '--credentials',
        credentials,
        '--dry-run',
      ]);
      expect(linked.status).not.toBe(0);

      chmodSync(realState, 0o755);
      const permissive = runScript('preflight.sh', [
        '--image',
        immutableImage,
        '--state-dir',
        realState,
        '--config',
        config,
        '--credentials',
        credentials,
        '--dry-run',
      ]);
      expect(permissive.status).not.toBe(0);
    } finally {
      rmSync(temp, { force: true, recursive: true });
    }
  });

  test('records state only after verification and restores failed rollback attempts', () => {
    const deploy = readProjectFile('ops/scripts/deploy.sh');
    const library = readProjectFile('ops/scripts/lib.sh');
    const rollback = readProjectFile('ops/scripts/rollback.sh');

    expect(deploy.indexOf('compose pull')).toBeLessThan(
      deploy.indexOf('write_state_file "$current_file" "$candidate_image"'),
    );
    expect(rollback).toContain(
      'Rollback verification failed; restoring the current immutable image.',
    );
    expect(deploy).toContain('arm_fail_closed');
    expect(rollback).toContain('arm_fail_closed');
    expect(library).toContain('stop_unverified_stack');
    expect(library).toContain('fail_closed_exit_handler');
  });

  describe('fail-closed activation mocks', () => {
    const candidateImage =
      'registry.invalid/divan@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const currentImage =
      'registry.invalid/divan@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

    function runMockedActivation(
      script: 'deploy.sh' | 'rollback.sh',
      options: {
        readonly invalidImage?: string;
        readonly invalidReason?: 'absent' | 'digest' | 'fixture';
        readonly withPrevious?: boolean;
      } = {},
    ): { readonly actions: string; readonly result: SpawnSyncReturns<string> } {
      const temp = mkdtempSync(resolve(tmpdir(), 'divan-ops-activation-'));
      const stateDir = resolve(temp, 'state');
      const actionLog = resolve(temp, 'actions.log');
      execFileSync('mkdir', [stateDir]);
      chmodSync(stateDir, 0o700);
      writeFileSync(resolve(stateDir, 'current-image.txt'), `${currentImage}\n`, {
        mode: 0o600,
      });
      if (options.withPrevious || script === 'rollback.sh') {
        writeFileSync(resolve(stateDir, 'previous-image.txt'), `${immutableImage}\n`, {
          mode: 0o600,
        });
      }

      const args =
        script === 'deploy.sh'
          ? [
              '--image',
              candidateImage,
              '--state-dir',
              stateDir,
              '--config',
              config,
              '--credentials',
              credentials,
              '--public-origin',
              'https://divan.test.invalid',
            ]
          : [
              '--state-dir',
              stateDir,
              '--config',
              config,
              '--credentials',
              credentials,
              '--public-origin',
              'https://divan.test.invalid',
            ];

      const result = runScript(script, args, {
        PATH: `${resolve(fixtureRoot, 'mock-bin')}:${process.env['PATH'] ?? ''}`,
        MOCK_ACTION_LOG: actionLog,
        MOCK_CONFIG: config,
        MOCK_CREDENTIALS: credentials,
        MOCK_GID: String(process.getgid?.() ?? 0),
        MOCK_INVALID_IMAGE: options.invalidImage ?? '',
        MOCK_INVALID_REASON: options.invalidReason ?? '',
        MOCK_STATE_DIR: stateDir,
        MOCK_UID: String(process.getuid?.() ?? 0),
      });
      const actions = existsSync(actionLog) ? readFileSync(actionLog, 'utf8') : '';
      rmSync(temp, { force: true, recursive: true });
      return { actions, result };
    }

    test.each(['absent', 'fixture', 'digest'] as const)(
      'deploy prevalidates an %s saved release before activation',
      (invalidReason) => {
        const { actions, result } = runMockedActivation('deploy.sh', {
          invalidImage: currentImage,
          invalidReason,
        });

        expect(result.status).not.toBe(0);
        expect(actions).not.toContain('UP:');
      },
    );

    test.each(['absent', 'fixture', 'digest'] as const)(
      'rollback prevalidates an %s current restore release before activation',
      (invalidReason) => {
        const { actions, result } = runMockedActivation('rollback.sh', {
          invalidImage: currentImage,
          invalidReason,
        });

        expect(result.status).not.toBe(0);
        expect(actions).not.toContain('UP:');
      },
    );

    test('deploy stops after candidate verification fails without a saved release', () => {
      const temp = mkdtempSync(resolve(tmpdir(), 'divan-ops-empty-state-'));
      const stateDir = resolve(temp, 'state');
      const actionLog = resolve(temp, 'actions.log');
      execFileSync('mkdir', [stateDir]);
      chmodSync(stateDir, 0o700);
      const result = runScript(
        'deploy.sh',
        [
          '--image',
          candidateImage,
          '--state-dir',
          stateDir,
          '--config',
          config,
          '--credentials',
          credentials,
          '--public-origin',
          'https://divan.test.invalid',
        ],
        {
          PATH: `${resolve(fixtureRoot, 'mock-bin')}:${process.env['PATH'] ?? ''}`,
          MOCK_ACTION_LOG: actionLog,
          MOCK_CONFIG: config,
          MOCK_CREDENTIALS: credentials,
          MOCK_GID: String(process.getgid?.() ?? 0),
          MOCK_INVALID_IMAGE: '',
          MOCK_INVALID_REASON: '',
          MOCK_STATE_DIR: stateDir,
          MOCK_UID: String(process.getuid?.() ?? 0),
        },
      );
      const actions = existsSync(actionLog) ? readFileSync(actionLog, 'utf8') : '';
      rmSync(temp, { force: true, recursive: true });

      expect(result.status).not.toBe(0);
      expect(actions).toContain(`UP:${candidateImage}`);
      expect(actions).toContain('STOP');
    });

    test.each([
      ['deploy.sh', true],
      ['rollback.sh', false],
    ] as const)('%s stops when target and restoration verification fail', (script, withPrevious) => {
      const { actions, result } = runMockedActivation(script, { withPrevious });

      expect(result.status).not.toBe(0);
      expect(actions.match(/UP:/gu)).toHaveLength(2);
      expect(actions).toContain('STOP');
    });
  });

  test('runtime contract helpers reject swapped, extra, and unrelated resources', () => {
    const configPath = '/runtime/config.yml';
    const credentialsPath = '/runtime/credentials.json';
    const validMounts = `${configPath}|/etc/cloudflared/config.yml|false|bind\n${credentialsPath}|/run/secrets/divan-tunnel.json|false|bind`;
    const validTunnel = runLibraryFunction(
      'require_exact_tunnel_mounts "$ACTUAL" "$CONFIG" "$CREDENTIALS"',
      { ACTUAL: validMounts, CONFIG: configPath, CREDENTIALS: credentialsPath },
    );
    expect(validTunnel.status, validTunnel.stderr).toBe(0);

    const swapped = runLibraryFunction(
      'require_exact_tunnel_mounts "$ACTUAL" "$CONFIG" "$CREDENTIALS"',
      {
        ACTUAL: `${credentialsPath}|/etc/cloudflared/config.yml|false|bind\n${configPath}|/run/secrets/divan-tunnel.json|false|bind`,
        CONFIG: configPath,
        CREDENTIALS: credentialsPath,
      },
    );
    expect(swapped.status).not.toBe(0);

    const extraWebMount = runLibraryFunction(
      'require_no_web_mounts "$ACTUAL"',
      { ACTUAL: '/host|/srv|false|bind' },
    );
    expect(extraWebMount.status).not.toBe(0);

    const validMembers = runLibraryFunction(
      'require_exact_network_members "$ACTUAL" "$EXPECTED" "origin"',
      { ACTUAL: 'tunnel-id\nweb-id', EXPECTED: 'tunnel-id\nweb-id' },
    );
    expect(validMembers.status, validMembers.stderr).toBe(0);
    const unrelatedMember = runLibraryFunction(
      'require_exact_network_members "$ACTUAL" "$EXPECTED" "origin"',
      {
        ACTUAL: 'foreign-id\ntunnel-id\nweb-id',
        EXPECTED: 'tunnel-id\nweb-id',
      },
    );
    expect(unrelatedMember.status).not.toBe(0);
  });

  test('running and public release pointers must be byte-identical', () => {
    const temp = mkdtempSync(resolve(tmpdir(), 'divan-release-pointer-'));
    const running = resolve(temp, 'running.json');
    const publicSame = resolve(temp, 'public-same.json');
    const publicOther = resolve(temp, 'public-other.json');
    writeFileSync(running, '{"releaseId":"release-b"}\n');
    writeFileSync(publicSame, '{"releaseId":"release-b"}\n');
    writeFileSync(publicOther, '{"releaseId":"release-a"}\n');

    try {
      const same = runLibraryFunction(
        'require_matching_release_files "$RUNNING" "$PUBLIC"',
        { PUBLIC: publicSame, RUNNING: running },
      );
      expect(same.status, same.stderr).toBe(0);
      const other = runLibraryFunction(
        'require_matching_release_files "$RUNNING" "$PUBLIC"',
        { PUBLIC: publicOther, RUNNING: running },
      );
      expect(other.status).not.toBe(0);
    } finally {
      rmSync(temp, { force: true, recursive: true });
    }
  });
});

afterAll(() => {
  // Ensure this suite never accidentally relies on a local interactive shell.
  expect(execFileSync('bash', ['-c', 'printf test'], { encoding: 'utf8' })).toBe(
    'test',
  );
});
