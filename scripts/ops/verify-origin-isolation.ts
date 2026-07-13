#!/usr/bin/env tsx
// Origin/network isolation verification (design §22.2 / §24 / §30.8).
import { runOpsCheck } from './runOpsCheck';

runOpsCheck(
  'Compose and tunnel isolation',
  'run ops/scripts/verify.sh to confirm no host-published ports, tunnel-only egress, and dedicated internal networks on the live host.',
);
