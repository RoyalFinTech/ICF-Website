drop policy if exists "Broadcast sessions are server managed" on public.broadcast_sessions;
create policy "Broadcast sessions are server managed" on public.broadcast_sessions
for all to anon, authenticated using (false) with check (false);
drop policy if exists "Broadcast assets are server managed" on public.broadcast_assets;
create policy "Broadcast assets are server managed" on public.broadcast_assets
for all to anon, authenticated using (false) with check (false);
