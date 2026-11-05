drop policy if exists "Agent reads own membership" on public.admin_users;
create policy "Agent reads own membership" on public.admin_users for select to authenticated using (user_id = auth.uid());