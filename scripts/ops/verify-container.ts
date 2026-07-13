#!/usr/bin/env tsx
// Container hardening verification (design §22.7 / §30.2).
import { runOpsCheck } from './runOpsCheck';

runOpsCheck(
  'production image contract',
  'run ops/scripts/verify.sh against the deployed container to capture non-root, read-only, cap-drop, and image-digest evidence.',
);
