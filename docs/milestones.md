# CHIMJA website milestones

| Milestone | Git revision | Reference |
| --- | --- | --- |
| Corporate website v1.2 | `0d8e1d6` | [Original website notes](website-v1.2.md) |
| REUTAP and SMARUNI showcase | `a9d38a6` | [Showcase commit](https://github.com/CHIMJA/chimja-website/commit/a9d38a6) |
| Global Services launch | `514d5b6` | [Launch commit](https://github.com/CHIMJA/chimja-website/commit/514d5b6) |
| Services inquiry availability and regression checks | `49270e2` | [WEB-001 engineering report](../WEB-001-report.md) |
| AI chatbot and lead follow-ups | `8d079f2` | [PR #1](https://github.com/CHIMJA/chimja-website/pull/1) · [Production deployment](https://vercel.com/chimja/chimja-website/9nWTsyuqeaNu2foyiwfWi4Td9HPd) |

## AI chatbot release · 3 November 2026

Visitors can chat, review an editable project brief with contact autofill, and submit with explicit consent. They can continue chatting after submission. An acknowledgment is queued on receipt, with follow-ups at days 2 and 5. Replies and opt-outs stop remaining follow-ups. The [private leads dashboard](https://chimja-website-chimja.vercel.app/live.html) requires Vercel authentication.

The first Git preview failed because an optional dependency in the lockfile lacked a version. Commit `8ca1f48` restored its package metadata, pinned Node to 24.x, and configured `npm ci --ignore-scripts`. A clean install, 19 tests, and the build passed locally. The founder confirmed passing PR checks, then Vercel served merge commit `8d079f2` on chimja.com. The production API reported reply detection enabled and returned zero public lead records. That post-merge check did not submit an inquiry or send email.

## Record each future milestone

1. Add a row with the milestone name, commit SHA, PR, and deployment link where applicable.
2. Record the behavior change, required configuration names, verification results, and remaining gaps. Keep credentials, customer records, and private inbox screenshots out of GitHub.
3. For a release, tag the verified source commit and link its GitHub release notes here. Record the last known good deployment for rollback. Verify the production domain points to the intended commit after deploying.

See the [README](../README.md) for runtime configuration and operating instructions.
