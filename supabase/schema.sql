-- ICF Gambia production schema. Run in the Supabase SQL Editor.
-- The service-role key must remain server-side.
create extension if not exists pgcrypto;

create table if not exists public.app_records (
  collection text not null check (collection in (
    'members','prayers','baptisms','events','sermons','media','announcements',
    'contactMessages','emailHistory','livestream','siteSettings','enabledLangs'
  )),
  record_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, record_id)
);
create index if not exists app_records_collection_created_idx on public.app_records (collection, created_at desc);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'ICF Administrator',
  role text not null default 'admin' check (role in ('admin','super_admin')),
  created_at timestamptz not null default now()
);

alter table public.app_records enable row level security;
alter table public.admin_users enable row level security;
-- No anon/authenticated policies are intentionally created. The Express backend
-- uses the service-role key and performs all authorization checks server-side.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('church-public','church-public',true,15728640,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('church-private','church-private',false,15728640,
  array['image/jpeg','image/png','image/webp','application/pdf','audio/mpeg','audio/mp4','audio/wav','audio/ogg','video/mp4','video/webm'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- After creating an administrator in Supabase Authentication, grant its UUID:
-- insert into public.admin_users (user_id,display_name,role)
-- values ('REPLACE-WITH-AUTH-USER-UUID','ICF Administrator','super_admin');

-- Keep direct browser/API roles away from private application records.
-- The Express server uses the service_role key, kept only in Render environment variables.
revoke all privileges on table public.app_records, public.admin_users from public, anon, authenticated;
grant select, insert, update, delete on table public.app_records, public.admin_users to service_role;
