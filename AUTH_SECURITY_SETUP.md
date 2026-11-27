# ICF member authentication and Cloudflare Turnstile

## Current production behaviour

- A public registration creates the Supabase Auth identity on the server and writes the member application to `public.app_records` as `members`.
- The application is saved with `status: "pending"`. A valid registration does not wait for an SMTP email to be sent.
- The account is created with Supabase Auth's email-confirmation gate bypassed so the applicant can sign in after approval. The ICF member record deliberately keeps `emailVerified: false` and `emailVerificationStatus: "not_verified_email_delivery_pending"`; this is not proof that the applicant owns the email address.
- The Admin Portal displays the unverified-email warning. Administrators should verify the applicant's contact details before approving the account or assigning a public leadership listing.
- Member login still requires `status: "approved"`. Pending and suspended members are blocked. Member-editable profile fields cannot modify membership status, church roles, or Auth identity.
- Password recovery and confirmation resend endpoints remain in the backend but return a clear unavailable response while their feature flags are off. The login page describes these actions as coming soon.

## Cloudflare Turnstile setup

Turnstile is free for most normal production use, supports up to 20 widgets per account and unlimited challenge/verification requests on its Free plan. It does not require moving ICF traffic behind Cloudflare. See the [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/) and [Get started](https://developers.cloudflare.com/turnstile/get-started/) guides.

1. In the Cloudflare dashboard, open **Turnstile** and create a widget named **ICF Gambia Member Registration**.
2. Choose **Managed** mode and **Rest of World** as the region for the ICF audience in The Gambia and elsewhere in Africa.
3. Add `icf-website.onrender.com` under allowed hostnames. Add any ICF custom domain too, if one is configured. The Free plan supports up to 10 hostnames per widget.
4. Copy the public **Sitekey** and private **Secret key**.
5. In Render, open the `ICF-Website` web service → **Environment** and add:
   - `TURNSTILE_SITE_KEY` = the public sitekey
   - `TURNSTILE_SECRET_KEY` = the private secret key
6. Save the Render environment changes and allow the service to restart. Do not put the secret key in GitHub, browser code, screenshots, or this chat.

The public auth-config endpoint exposes only the sitekey. The server validates each token with Cloudflare Siteverify and checks the action and hostname before creating the Auth identity or member record. A token is single-use and expires after five minutes. If both variables are blank, the registration challenge stays disabled; if only one is set, registration fails closed until the pair is corrected.

## Future email delivery

Supabase's built-in Auth SMTP is for testing only: it sends to pre-authorized team addresses and has a low shared rate limit. For public membership registration, configure a custom SMTP provider in **Supabase → Authentication → Emails → SMTP Settings**, verify its sender domain, and test delivery before turning on the app features. Supabase's current SMTP guide: https://supabase.com/docs/guides/auth/auth-smtp.

After testing signup confirmation and password reset with a real test mailbox, set these Render environment flags to `true`:

- `ICF_EMAIL_VERIFICATION_REQUIRED=true`
- `ICF_PASSWORD_RECOVERY_ENABLED=true`

Then deploy and test confirmation, resend, recovery, and completed password reset end to end. Do not enable these flags before email delivery and redirect URLs are verified. The future confirmation flow only marks the member's app-level email state as verified after Supabase confirms the email.

## Operational security notes

- Keep Supabase `service_role` credentials server-side only.
- Rotate any LiveKit API secret that has been exposed in a screenshot or other public context.
- Review pending applications regularly; keep directory consent and directory visibility separate.
- After enabling email verification in the future, review any applications created under the temporary deferred-verification mode. They are intentionally marked as unverified and should be confirmed before being publicly listed.
