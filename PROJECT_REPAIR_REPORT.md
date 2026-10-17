# ICF Website — Engineering status report

## Completed in `feature/supabase-render-backend`
- Added an Express/Node API backend that serves the existing `index (4).html` site and its existing media.
- Added Supabase-backed records, administrator-role checks, member sign-up/login, public prayer/baptism/contact submissions, and administrator upload routes.
- Added `/healthz` and `/api/health` deployment verification endpoints.
- Applied migration `icf_app_records_and_admin_storage` to Supabase project `iaxtmenmbduaxhyhikjq`.
- Verified `public.app_records` and `public.admin_users` exist with row-level security enabled.
- Verified `church-public` (public) and `church-private` (private) buckets exist with 15 MB limits.
- Added server startup provisioning for the administrator configured through `ICF_ADMIN_EMAIL` and `ICF_ADMIN_PASSWORD`; the role is granted in `public.admin_users` when the server-side key is configured.
- Improved frontend bridge responsive styling, motion preferences, input sizing, card feedback, PDF link labels/opening, error-card fallback, and admin record persistence for `DB.push`.
- Fixed PDF extension detection and duplicate health route handling.
- Restricted public access to deployment-only `supabase`, `scripts`, `.github`, and `.git` paths.
- Added a GitHub Actions workflow to validate Node syntax and the package manifest.
- Updated Render deployment instructions.
- Retained the existing church photos and PDF paths.

## Not yet completed / must be verified
- Render service creation/deployment has not been confirmed. The user is creating a Render Web Service using the `main` branch; this branch has not yet been merged to `main`.
- Render still needs `SUPABASE_SERVICE_ROLE_KEY` (or a supported server-side secret key) in environment variables; the connected key retrieval exposed only the public key.
- Admin bootstrap, admin login, member registration/login, public publishing, and upload routes have not passed end-to-end tests on a live deployment.
- The transparent logo is available as a working artifact but has not yet been committed/integrated into the HTML. The large homepage blob is above the normal contents endpoint size and needs a safe binary/asset integration step.
- A generated premium homepage concept is available as a design reference, but it is not yet a deployed page or integrated asset set.
- Offsite backups require an external destination and secrets, and a successful run.

## QA performed
- JavaScript syntax parsing passed for `server.js` and `js/api-bridge.js` after the latest fixes. The validation workflow checks server, bridge, backup script, and package manifest.
- Checked that the public API does not expose member records or contact-message records.
- Confirmed the source does not contain the administrator password or email.
- The latest branch contains additional commits beyond `main`; PR #1 remains open and mergeable.

## Deployment gate
Do not call the application production-ready until Render deployment succeeds and the checks in `RENDER_DEPLOYMENT.md` pass. Keep all server-side keys and administrator credentials in Render environment variables, never in frontend code or GitHub.
