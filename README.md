# CHIMJA Website v1.2 — Final

Public contact routing:
- General / partnerships: hello@chimja.com
- Founder: krishnarjun@chimja.com
- Product support: support@chimja.com
- Billing: billing@chimja.com
- Careers: careers@chimja.com
- Privacy / legal / admin: admin@chimja.com

Stable product URLs:
- Marketing: https://chimja.com/
- Support: https://chimja.com/support/
- Privacy: https://chimja.com/privacy/
- Terms: https://chimja.com/terms/

Local preview:
python3 -m http.server 8080


## v1.2 final lock
- Hero engineering plate now uses `EST. 2026` instead of unexplained `01`.
- Removed `ROOTS / 01` from the Our Roots artwork for a cleaner, timeless composition.


## Global Services Inquiry Form

The static `/services/` page uses `services/services.css` and `services/services.js`. Shared CSS/JavaScript include targeted accessibility improvements: footer and number contrast, progressive navigation with Escape and desktop-resize state handling, and reveal content that remains visible without JavaScript. No build step or dependency installation is required.

### Web3Forms configuration

The form sends AJAX requests to `https://api.web3forms.com/submit`, using FormData converted to JSON. The `email` field supplies default Reply-To. Subject and sender name come from the founder-configured dashboard; no duplicate hidden overrides are included. Auto responder is disabled and no redirect is configured.

The public frontend access-key placeholder is in `services/index.html`, in the hidden `name="access_key"` input. Search for `CHIMJA_WEB3FORMS_ACCESS_KEY_REPLACE_ME` and replace only that input's value with the founder's key locally. Do not replace the placeholder guard in JavaScript or paste the real key into documentation or logs. Submission is blocked while the placeholder or an empty key remains.

### CAPTCHA and local testing

The form includes Web3Forms' documented `.h-captcha` / `data-captcha="true"` integration and `https://web3forms.com/client/script.js`. Compact size is requested for narrow screens. The dashboard must continue to require hCaptcha. The script reads the generated `h-captcha-response` token and submits it with the form; CAPTCHA reset uses the hCaptcha API and must be checked in a real browser. No custom site key is needed.

Run `python3 -m http.server 8080 --bind 127.0.0.1` from the repository and open `http://127.0.0.1:8080/services/`. Check 320, 375, 390, 430, 768, 1024, and 1440px widths, keyboard focus, native validation, FAQs, reduced motion, and disabled-JavaScript content. CAPTCHA and Google Fonts request third-party resources. Never send a live request with the placeholder.

Use mocked fetch responses to check success (`success: true` plus successful HTTP status), API rejection, malformed responses, network failure, timeout, and duplicate-submit prevention. Failure retains entered fields; only confirmed success resets the form. Timeout does not prove the provider failed to receive the inquiry; there is no automatic retry.

### Real submission verification and release prerequisites

After inserting the key and obtaining authorization for a real test, use non-sensitive test details and complete hCaptcha. Verify the successful response, field reset, CAPTCHA reset and a second CAPTCHA completion. Confirm the notification arrives at `hello@chimja.com`, has the dashboard-configured subject/sender, includes the expected fields, and Reply-To matches the test email. Test blocked/expired CAPTCHA and provider/network failure without bypassing protection. Check browser console/network and ensure neither key nor personal information is logged. Do not equate an API success with confirmed inbox delivery.

Browser layout, screen-reader behavior, CAPTCHA rendering/reset and real submission/email receipt require separate verification; mocked tests cannot certify them. Do not deploy until the founder reviews the changes and these checks are complete.

### Privacy and operational limits

The privacy policy discloses Web3Forms, CAPTCHA/spam prevention, voluntary inquiry fields, and inquiry processing. The founder reports the Free plan has 250 monthly submissions, Basic spam protection with advanced spam filtering enabled, no domain restriction, and one-year provider submission retention. Dashboard settings were supplied by the founder and were not independently inspected. Notification emails may be retained separately; one-year provider retention is not a promise that all copies are automatically deleted. Avoid sensitive information. Frontend validation is usability assistance, not an abuse boundary; CAPTCHA and spam filters do not eliminate all spam. Monitor quota and delivery, and keep the email fallback available.

No commit, push, deployment, infrastructure change, or real submission is part of this local checkpoint.
