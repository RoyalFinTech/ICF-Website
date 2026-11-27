create table if not exists public.broadcast_sessions (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 title text not null check (char_length(title) between 3 and 180),
 description text not null default '', room_name text not null unique,
 status text not null default 'draft' check (status in ('draft','preparing','live','ended','failed')),
 is_public boolean not null default true, recording_enabled boolean not null default false,
 recording_status text not null default 'not_requested' check (recording_status in ('not_requested','local_recording','downloaded','archived','delete_pending','deleted','failed')),
 logo_url text, logo_position text not null default 'top-left' check (logo_position in ('top-left','top-right','bottom-left','bottom-right')),
 overlay_text text not null default '', scripture_reference text not null default '', scripture_text text not null default '',
 scheduled_at timestamptz, started_at timestamptz, ended_at timestamptz,
 created_by uuid references public.admin_users(user_id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists broadcast_sessions_public_live_idx on public.broadcast_sessions(status,is_public,started_at desc);
create index if not exists broadcast_sessions_created_idx on public.broadcast_sessions(created_at desc);
create table if not exists public.broadcast_assets (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.broadcast_sessions(id) on delete cascade,
 asset_type text not null check (asset_type in ('recording','thumbnail','overlay','slide','audio')),
 storage_provider text not null default 'external', storage_bucket text, storage_path text, public_url text,
 file_name text, content_type text, size_bytes bigint check (size_bytes is null or size_bytes>=0),
 retention_status text not null default 'pending' check (retention_status in ('pending','keep','delete_pending','deleted','failed')),
 retain_until timestamptz, created_at timestamptz not null default now(), deleted_at timestamptz
);
create index if not exists broadcast_assets_session_idx on public.broadcast_assets(session_id,created_at desc);
alter table public.broadcast_sessions enable row level security;
alter table public.broadcast_assets enable row level security;
revoke all on public.broadcast_sessions from anon,authenticated;
revoke all on public.broadcast_assets from anon,authenticated;
