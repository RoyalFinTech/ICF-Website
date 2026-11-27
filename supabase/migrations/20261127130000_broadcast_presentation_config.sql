-- ICF Worship Studio presentation settings
alter table public.broadcast_sessions add column if not exists presentation_config jsonb not null default '{}'::jsonb;
