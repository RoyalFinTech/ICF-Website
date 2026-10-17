# ICF Website — Render deployment checklist

## Render service
- Workspace: Royal's workspace
- Service name: `icf-website`
- Repository: `https://github.com/RoyalFinTech/ICF-Website`
- Branch: `feature/supabase-render-backend`
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check path (optional): `/healthz`

## Environment variables
Set these in Render → service → Environment. Never commit secret values.

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://iaxtmenmbduaxhyhikjq.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase project's anon/legacy anon key or supported publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-side service-role/secret key; keep private |
| `SUPABASE_PUBLIC_BUCKET` | `church-public` |
| `SUPABASE_PRIVATE_BUCKET` | `church-private` |
| `ICF_ADMIN_EMAIL` | The administrator email chosen by the church |
| `ICF_ADMIN_PASSWORD` | A strong administrator password (12+ characters) |

The Supabase schema migration has already been applied to the connected project. It creates `public.app_records`, `public.admin_users`, and the `church-public` and `church-private` storage buckets.

When both admin variables and the server-side key are present, the server startup routine creates or updates that administrator in Supabase Auth and grants the `super_admin` role in `public.admin_users`. Do not put admin credentials in frontend HTML or GitHub.

## Verification after deploy
1. Open `/healthz`; expect HTTP 200 and JSON with `status: "ok"`.
2. Open `/api/health`; confirm `supabaseConfigured: true`.
3. Sign in at the admin portal using the configured administrator email and password.
4. Publish a test announcement and event, then confirm they appear on their public pages.
5. Test a prayer request, contact form, and membership application.
6. Upload one image and one PDF, then verify their public URLs load.
7. Configure and run the independent backup workflow; verify a successful offsite backup before relying on it for real records.

## Important
- The public/publishable API key is not a substitute for `SUPABASE_SERVICE_ROLE_KEY`.
- Never place server secrets in browser JavaScript or public Git history.
- Confirm private-file access rules before storing sensitive documents.
- Free Render instances may sleep while idle; first requests can take longer.
