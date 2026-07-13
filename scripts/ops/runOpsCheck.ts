import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

/**
 * Run the docker-free static verification for one operations concern by
 * executing its authoritative `opsConfig.test.ts` group. Live runtime evidence
 * (against a deployed container) is produced separately by
 * `ops/scripts/verify.sh` and remains a deployment-time gate.
 */
export function runOpsCheck(group: string, liveNote: string): never {
  console.log(`Static ops verification (docker-free): "${group}"`);
  console.log(`Live runtime evidence gate: ${liveNote}`);
  const result = spawnSync(
    'pnpm',
    ['exec', 'vitest', 'run', 'tests/security/opsConfig.test.ts', '-t', group],
    { stdio: 'inherit', cwd: REPO_ROOT },
  );
  process.exit(result.status ?? 1);
}
