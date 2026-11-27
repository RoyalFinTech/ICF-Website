-- ICF-managed hymn library; direct browser roles remain denied.
create table if not exists public.worship_hymns (id uuid primary key default gen_random_uuid(), title text not null check (char_length(title) between 2 and 180), hymn_number text not null default '', lyrics text not null check (char_length(lyrics) between 1 and 12000), created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.worship_hymns enable row level security;
revoke all privileges on table public.worship_hymns from public, anon, authenticated;
grant select, insert, update, delete on table public.worship_hymns to service_role;
create index if not exists worship_hymns_created_idx on public.worship_hymns (created_at desc);
