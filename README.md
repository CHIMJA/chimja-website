# CHIMJA Website

CHIMJA's existing website, AI project assistant and consent-based inquiry follow-ups. Node.js 24, Next.js, Neon Postgres, Vercel AI Gateway, Resend and Vercel Workflow.

## Development

```sh
npm ci
npm test
npm run build
npm run dev
```

Live public pages are under `public/`. API routes and workflow entry points are under `app/`; follow-ups are under `workflows/`. Keep all secrets in Vercel environment variables. No credentials are included in this repository.

## Runtime configuration

Production requires DATABASE_URL, AI_GATEWAY_API_KEY, RESEND_API_KEY, RESEND_WEBHOOK_SECRET, TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY. Enable public inquiry handling with CHIMJA_LIVE_ENABLED=true. Turnstile action is inquiry; permitted production hostnames are chimja.com and www.chimja.com. Resend email.received webhook points to https://chimja.com/api/resend. Retain its exact endpoint signing secret. Do not reuse preview signing secrets.

Vercel project: CHIMJA / chimja-website. Keep Vercel Authentication enabled for all deployments except custom domains. The dashboard https://chimja-website-chimja.vercel.app/live.html relies on that setting and is available only after Vercel sign-in. Public domain API responses contain no inquiry records.

Production stores records in chimja_live_* tables; preview uses chimja_test_* tables and restricts delivery to the approved founder inbox. Acknowledgment is followed by emails at days 2 and 5 in production, or minutes 3 and 8 in preview. A signed reply event or opt-out stops remaining follow-ups; an in-flight email cannot be recalled. Provider acceptance does not prove inbox delivery. Uncertain sends require review, with no blind resend.

## Visitor experience

Bottom-anchored composer, separate editable review form with contact autofill, structured requirements extraction and explicit consent. Chat cannot send an email merely because a visitor says yes. After submission the visitor can keep chatting; the submitted brief is read-only and changes should be requested by replying to the acknowledgment email. New chat starts a separate inquiry. Duplicate submission is blocked.

## Verification and operations

19 automated tests passed. Founder confirmed live acknowledgment, scheduled follow-ups, manual stop, reply cancellation and the corrected chat/intake experience. Accelerated preview tests covered timing; production day-2/day-5 elapsed delivery is not yet independently verified. Live API privacy and authenticated-dashboard boundaries were checked. Tests/inquiry.mjs preserves the earlier static service-form browser harness, adjusted for public/; it requires its documented external Chrome setup and is not included in npm test.

Initial limits: 50 model calls/day, 20 production inquiries/day, 2 inquiries/email/day, 3 creates/IP/day, 30 chat/brief requests/IP/day. AI responses may contain mistakes; visitors review briefs before submitting. Existing record content is not rewritten by code releases. Delivery/bounce events and inbound message body processing are not implemented.

Historical website documentation: docs/website-v1.2.md and WEB-001-report.md. Deployment history and the tested source checkpoint are retained separately. This branch imports the code deployed on 2 November 2026.
