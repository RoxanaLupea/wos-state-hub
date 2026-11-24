-- Changing what each of a person's accounts is: Main, Alt or Farm (owner, 24 Nov), from
-- "Edit accounts" on the profile. All the changes are saved together, so the person always
-- has exactly one main, even if something fails half way. Safe to run again.
create or replace function public.set_game_account_kinds(kinds jsonb) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in to change your accounts.'; end if;
  if exists (select 1 from jsonb_each_text(kinds) one where one.value not in ('main', 'alt', 'farm')) then
    raise exception 'An account is a main, an alt or a farm.';
  end if;
  if (select count(*) from jsonb_each_text(kinds) one where one.value = 'main') > 1 then
    raise exception 'Only one account can be the main.';
  end if;
  -- Alts and farms first, so the old main is no longer the main before the new one is.
  update game_accounts set kind = one.value, updated_at = now()
    from jsonb_each_text(kinds) one
    where game_accounts.id = one.key::bigint and game_accounts.owner_id = auth.uid() and one.value <> 'main';
  update game_accounts set kind = 'main', updated_at = now()
    from jsonb_each_text(kinds) one
    where game_accounts.id = one.key::bigint and game_accounts.owner_id = auth.uid() and one.value = 'main';
  if (select count(*) from game_accounts where owner_id = auth.uid() and kind = 'main') <> 1 then
    raise exception 'There must be exactly one main.';
  end if;
end $$;

revoke all on function public.set_game_account_kinds(jsonb) from public, anon;
grant execute on function public.set_game_account_kinds(jsonb) to authenticated;
