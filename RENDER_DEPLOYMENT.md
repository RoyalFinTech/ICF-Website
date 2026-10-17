# Render deployment checklist
1. Create the Supabase project and run supabase/schema.sql in SQL Editor.
2. Create an administrator in Supabase Authentication and grant its UUID in public.admin_users.
3. Create a Render Node Web Service for this repository/branch.
4. Build command: npm install
5. Start command: npm start
6. Add SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLIC_BUCKET=church-public, SUPABASE_PRIVATE_BUCKET=church-private, NODE_ENV=production.
7. Deploy and visit /health; expect status ok and storageConfigured true.
8. Test admin login, announcement create/update/delete, prayer request, contact form, membership signup, and one media upload.
9. Configure the independent backup workflow and verify a successful backup before collecting real records.
Never put the service-role key in browser code or source files.
