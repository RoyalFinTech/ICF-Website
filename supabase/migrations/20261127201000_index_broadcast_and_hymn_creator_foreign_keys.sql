-- Add covering indexes for creator foreign keys used by administration and ownership queries.
-- Safe to re-run: each index is created only if it does not already exist.
create index if not exists broadcast_sessions_created_by_idx
  on public.broadcast_sessions (created_by);

create index if not exists worship_hymns_created_by_idx
  on public.worship_hymns (created_by);
