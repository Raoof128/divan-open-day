#!/usr/bin/env tsx
// Deployment/rollback safety verification (design §24.6-24.7 / §30.2).
import { runOpsCheck } from './runOpsCheck';

runOpsCheck(
  'safe deployment controls',
  'rehearse ops/scripts/rollback.sh against a staging deployment to capture a live rollback-without-rebuild record.',
);
