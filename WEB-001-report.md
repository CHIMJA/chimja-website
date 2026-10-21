# WEB-001 engineering report

Date: 21 October 2026. Overall status: **PARTIAL**. Local patch: **READY FOR FOUNDER REVIEW**. Production verification remains pending. No deployment, commit, push, dashboard change, or real inquiry submission was performed.

## Executive summary

The reported message is confirmed in committed source, but the deployed response could not be inspected. It is an unconditional initial HTML message, not an environment diagnostic. JavaScript replaces it only when the hidden public access key is nonempty and differs from the placeholder. It can therefore remain visible with a missing key or failed/disabled JavaScript, and can appear briefly before initialization even with a configured key. Its presence alone does not prove missing configuration or broken submission.

The checkout already contained the minimal wording fixes when investigation started. They were preserved and validated rather than rewritten. No additional form implementation defect was confirmed. The remaining production risk is unverified configuration/delivery, not a demonstrated production outage. Confirmed wording defects have low severity; a genuinely unusable production form would have higher customer impact, but that has not been established.

## Baseline and architecture

- Preexisting modified files: `README.md`, `services/index.html`, `services/services.js`. Their diffs were inspected before editing. No AGENTS.md was found beneath the repository's parent directory.
- Plain static HTML/CSS/JavaScript. No package manifest, dependencies, build, linter, type checker, existing test runner, environment examples, or deployment automation was found. README documents Python's static HTTP server.
- The form reads the hidden `access_key` in `services/index.html:89`. A non-placeholder public integration identifier is present. Its value was not changed. No environment variable name exists to configure; changing a hosting environment variable would not populate this static HTML.
- Local, preview, and production execute identical code. There is no hostname or environment detection to misclassify.
- Hosting credentials, production environment settings, provider dashboard, key validity, quota, retention configuration, and email delivery were inaccessible. README dashboard assertions remain founder-supplied information, not independently verified facts.

## Confirmed root causes and current corrections

| Location | Committed behavior and root cause | Expected/current local behavior |
| --- | --- | --- |
| `services/index.html:87`; `services/services.js:80–83` | Initial HTML unconditionally says “Local setup”; JavaScript replaces it after checking the key. This conflates form availability with environment setup. | Initial HTML provides a customer-facing unavailable message and the existing email fallback; configured JavaScript enables submission and labels it PROJECT INQUIRY. |
| `services/index.html:84` | Getting-started FAQ exposes “once its submission configuration is complete,” an internal launch instruction. | FAQ directs customers to the existing email address or inquiry form without internal setup terminology. |
| `services/services.js:93` | Missing-key submit guard exposes “not configured yet.” | Guard keeps submission blocked and gives a customer-facing fallback. |

All three wording corrections above predated this investigation's edits. The nonempty/placeholder guard remains intact: the warning was not simply hidden while permitting an unconfigured request. Provider acceptance cannot be established by this client guard.

## Submission and security review

Required name, email, service, and description have native constraints plus custom error text, whitespace checks, invalid-field focus, and accessible error associations. Optional inputs retain native constraints. FormData is captured before controls are disabled, converted to JSON, and posted to `https://api.web3forms.com/submit` with credentials omitted and redirects rejected. Success requires both a successful HTTP status and `success: true`. Only confirmed success clears fields. Pending state disables fields/button and prevents duplicate requests. A 20-second timeout reports uncertain receipt without automatic retry. Failure preserves entries; CAPTCHA reset is attempted after each request with recovery guidance if reset fails.

The existing honeypot and hCaptcha token check remain. The widget markup and provider loader match [official hCaptcha integration guidance](https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha). That guidance also requires dashboard enforcement; frontend checks alone do not enforce abuse protection. [Official honeypot guidance](https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection) describes its limitations. No new CAPTCHA service or dependency was introduced.

Reviewed form code uses `textContent` for messages and never inserts provider responses or customer input into HTML. No form personal-data logging or private server credential was found in the reviewed integration. The access key is a public frontend identifier, not a server secret. Existing third-party loading includes Web3Forms/hCaptcha and Google Fonts; privacy disclosures are present. Server-side validation, dashboard enforcement, retention, and infrastructure security were not audited. No security guarantee is inferred from client tests.

The only customer FAQ section found is the six-item services FAQ. Its current content covers project fit, remote collaboration, estimates, ownership, maintenance, and getting started. No remaining internal setup instructions or broken FAQ destinations were found. Legitimate developer instructions remain in README.

## Changes made during this investigation

- Added `tests/inquiry.mjs`: dependency-free Chrome DevTools browser regression harness. It serves the local site on loopback, substitutes a mock key in served HTML, blocks nonlocal resources, and mocks fetch/CAPTCHA. It does not send real submissions or change production configuration.
- Added this report. Existing source and README changes were preserved. No CSS, metadata, routes, privacy content, dependencies, or business claims were changed.
- Compatibility: no production runtime change introduced by these two new files. The test requires Node with built-in fetch/WebSocket (executed with Node 24.14.0) and Chrome with remote debugging enabled.

## Executed validation

- `node tests/inquiry.mjs`: **PASS**, 22 browser scenarios, plus FAQ content/interaction, anchor targets, mobile menu/Escape, and JavaScript exception assertions.
- Cases include empty and placeholder keys; configured initialization; required fields and email; missing CAPTCHA; honeypot; mocked success, rejection, HTTP failure, malformed JSON, network error, timeout, duplicate submission; CAPTCHA reset failure; disabled JavaScript.
- Verified payload contains the mock CAPTCHA token and uses the intended endpoint. Success clears fields; failures retain them; controls recover. An HTML-shaped message remains data, with no injected error markup.
- No horizontal overflow at 320, 375, 390, 430, 768, 1024, and 1440 CSS pixels. Inquiry screenshots at 320 and 1440 were visually inspected; CAPTCHA/fonts were blocked, so these do not certify live third-party rendering. Screenshots are temporary files at `/private/tmp/chimja-web001-320.png` and `/private/tmp/chimja-web001-1440.png`.
- `node --check services/services.js`, `node --check script.js`, `node --check tests/inquiry.mjs`, and `git diff --check`: **PASS**.
- Existing automated suite/lint/type-check/build: **not applicable**, none configured; there is no production compilation step. The static source was served directly in Chrome.
- Initial sandboxed Chrome launch exited 134; initial sandboxed loopback server failed with EPERM. Both checks were successfully executed with approved local sandbox escalation. No final test failures remain.
- No uncaught page JavaScript exceptions occurred in the mocked run. Third-party requests were intentionally blocked; resulting resource-load failures are expected and do not establish a clean live-production console. Screen-reader testing and live CAPTCHA rendering/expiry/reset remain pending.
- Read-only production requests: web tool could not access the services page; shell requests for home, services, and services JavaScript failed DNS resolution. These are environment access limitations, not evidence that production is down.

To reproduce locally, start a separate Chrome instance with `--headless --disable-gpu --no-first-run --user-data-dir=/private/tmp/chimja-web001-review --remote-debugging-port=9334 about:blank`, then run `node tests/inquiry.mjs`. Use a dedicated debugging profile and close it afterwards. No package installation is required.

## Production readiness and proposed deployment procedure

**READY FOR FOUNDER REVIEW**, with **production verification pending**. No configuration replacement is justified by current evidence, and no environment variable change is proposed.

1. Founder reviews the existing three-file patch plus this report and regression test.
2. Through the authorized provider dashboard, verify that the HTML's public key belongs to the intended form, notifications route correctly, hCaptcha is mandatory, and quota/settings permit submission. If the key is actually missing or invalid, replace only the hidden `access_key` input's value with the approved public integration identifier; retain the JavaScript placeholder guard. No key value should be placed in reports or logs.
3. After explicit founder deployment approval, use the existing hosting process to publish the reviewed static HTML and JavaScript together. The repository does not identify that hosting process, so no provider-specific command is claimed. Preserve the previous static artifact for rollback.
4. Read back deployed assets and verify `/services/#inquiry`, FAQ, responsive presentation, fallback, and browser console. Any genuine live submission/email-receipt test requires separate explicit founder approval. Only then verify CAPTCHA, provider acceptance, notification delivery, and Reply-To using non-sensitive test data.
5. If the release regresses behavior, restore the prior static artifact using the existing hosting process.

Deployment and real submission remain unexecuted. Local behavior is verified within the mocked scope; production acceptance remains open.
