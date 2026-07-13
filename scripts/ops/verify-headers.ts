#!/usr/bin/env tsx
// Security header / CSP / cache verification (design §22.4-22.6 / §30.5).
import { runOpsCheck } from './runOpsCheck';

runOpsCheck(
  'static origin delivery contract',
  'run ops/scripts/verify.sh to capture the live CSP, security headers, and cache matrix from the served origin.',
);
