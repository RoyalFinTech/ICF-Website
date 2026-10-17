# Repository repair report

## Inspected
- The public website is a single-page HTML file named index (4).html, approximately 1.18 MB.
- Real church and Fofuo mission photographs, membership-statement.pdf, and workers-manual.pdf are in the repository root.
- The admin portal is embedded in the same HTML file.
- The existing page had a hard-coded admin password, client-only login, localStorage-only records, and sample records that looked real. These are unsuitable for production.

## Added in this branch
- Express server and Supabase PostgreSQL persistence.
- Server-side Supabase Auth verification and an explicit administrator allow-list.
- Validated public endpoints for prayer requests, baptism requests, contact messages, and membership signup.
- Admin-only record reads/writes and Supabase Storage uploads.
- API bridge for the existing forms and admin portal.
- Removed hard-coded demo credentials and non-media sample records while preserving the existing visual layout and real photo seed.
- Supabase schema, Render instructions, and an off-site backup script/workflow.

## Deployment QA still required
A real end-to-end test cannot complete until the owner creates/configures the Supabase project and Render service. Before accepting real records, configure the external backup secrets, run a backup manually, and verify recovery.
