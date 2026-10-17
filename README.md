# ICF Gambia website + Supabase backend

The existing ICF Gambia single-page website, real church photographs, and PDFs are retained. Express serves the existing index (4).html as the homepage, so its filename and design do not need to be replaced.

## Architecture
- Render hosts the Node.js/Express website and API.
- Supabase PostgreSQL stores membership applications, prayer and baptism requests, events, sermons, gallery metadata, announcements, settings, and contact messages.
- Supabase Storage stores new uploads.
- Existing church photographs and PDFs remain in GitHub as static assets.
- GitHub stores source code only, never live records, secrets, private uploads, or backup exports.

## Setup
1. Use Node.js 20 or newer and run npm install.
2. Copy .env.example to .env for local testing.
3. Run supabase/schema.sql in the Supabase SQL Editor.
4. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in Render.
5. Create an administrator in Supabase Authentication, then add that user's UUID to public.admin_users.
6. In Render use build command npm install and start command npm start.
7. Check /health; storageConfigured should be true.

## First administrator
Create the account yourself in Supabase Authentication with a strong password. Then run the following SQL with the real UUID:

insert into public.admin_users (user_id, display_name, role)
values ('REPLACE-WITH-AUTH-USER-UUID', 'ICF Administrator', 'super_admin');

There is no demo administrator or default password. A Supabase Auth account must also be listed in public.admin_users before it can access the admin portal.

## Storage and privacy
The church-public bucket serves public media uploads. The church-private bucket is private and its uploads receive temporary signed URLs. The service-role key stays on the server. Member records, contact details, and pending prayer/baptism requests are not included in public data responses.

The free Render filesystem is not used for persistent records. The browser keeps a local rendering cache only; Supabase is the source of truth.

## Independent backups
Supabase free projects do not include automatic database backups. Configure the GitHub Actions workflow in .github/workflows/supabase-backup.yml with the secrets SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY. The script exports records and copies both storage buckets to a separate S3-compatible destination. Run the workflow manually and verify the destination before collecting real records. Never commit backup exports to this repository.

## Before production
Configure Supabase and Render, grant an administrator, test /health, sign-in, forms, admin edits, file uploads, mobile layout and browser console, then run and restore-test a backup.
