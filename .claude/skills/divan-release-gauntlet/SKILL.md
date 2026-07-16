---
name: divan-release-gauntlet
description: Run only for final DIVAN cinematic release verification after implementation, real asset generation, manual browser inspection, and completion of the verification report. Never invoke automatically during ordinary edits.
---

# DIVAN Release Gauntlet

## Entry conditions

Do not begin until the feature exists, released media derivatives exist, the asset manifest is current, manual mobile/desktop inspection is recorded, and the verification report is complete.

## Procedure

1. Run `node .claude/scripts/validate-pack.mjs`.
2. Inspect `.claude/divan-project.json`; verify every required command and set `releaseGateEnabled` to true only after review.
3. Run `node .claude/scripts/capture-protected-baseline.mjs` before cinematic work, not at release time. At release, run `check-protected-diff.mjs` and restore any drift.
4. Generate the asset manifest from actual released files.
5. Run the media-budget and verification-report validators.
6. Inspect live mobile and desktop routes, reduced motion, Save-Data/poster-only, keyboard, focus, Persian direction, offline, video failure, repeated reveal/redraw, and final-frame handoff.
7. Commit all intended implementation, released-asset, manifest, test, and report changes locally. Do not change tracked files after the gate passes.
8. Run `.claude/scripts/arm-release-gate.sh`.
9. Run `.claude/scripts/run-divan-gate.sh`.
10. Confirm `.claude/runtime/release-gate-pass.json` matches the current HEAD and worktree. Ask before push.

## Verdict

Use exactly `PASS`, `PASS WITH EXTERNAL LAUNCH GATES`, or `BLOCKED`. Never convert missing evidence into a pass.
