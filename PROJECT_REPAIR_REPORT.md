# ICF Website — Engineering status report

## Completed in `feature/supabase-render-backend`
- Added an Express/Node API backend that serves the existing `index (4).html` site and its existing media.
- Added Supabase-backed records, admin-role checks, member sign-up/login, public prayer/baptism/contact submissions, and administrator upload routes.
- Added health endpoints: `/healthz` and `/api/health`.
- Applied the Supabase migration `icf_app_records_and_admin_storage` to project `iaxtmenmbduaxhyhikjq`.
- Verified `public.app_records` and `public.admin_users` exist with row-level security enabled.
- Verified `church-public` (public) and `church-private` (private) storage buckets exist with 15 MB limits.
- Added server startup provisioning for the administrator configured through `ICF_ADMIN_EMAIL` and `ICF_ADMIN_PASSWORD`, with the role granted in `public.admin_users`.
- Improved frontend bridge responsiveness, motion preferences, input sizing, card hover feedback, accessible PDF labels, and PDF opening behavior.
- Updated Render deployment instructions and corrected administrator email validation.
- Retained the existing church media/PDF source paths; no HTML redesign replacement has been committed.

## Not yet completed / must be verified
- A Render service has not yet been created or deployed. The connected Render service-creation operation was blocked.
- The Render environment must include `SUPABASE_SERVICE_ROLE_KEY`; the connected key retrieval only exposed public/anon keys, not the server-side secret.
- Administrator login, member registration/login, public publishing, and upload routes have not yet passed end-to-end tests against a live deployment.
- The logo's transparent PNG was prepared as a working artifact, but has not yet been added to the Git repository or integrated throughout the HTML because the large existing homepage file is not readable through the connected file API.
- Premium generated Christian photography and full page-by-page design integration remain pending; the generated UI concept is not a deployed website page.
- The offsite backup workflow requires its external destination and credentials, and a successful backup run, before it should be treated as operational.

## Deployment gate
Do not describe this project as production-ready until the Render deployment succeeds and the checks in `RENDER_DEPLOYMENT.md` pass. Keep all service-role keys and administrator credentials in Render environment variables, never in frontend code or GitHub.
