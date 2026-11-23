-- The database's web-call tool (the http extension), kept for tests run from the
-- database's admin side, for example a call to the Whiteout Stats API.
-- It lives in its own schema that the website roles (anon, authenticated) cannot open,
-- because Supabase grants everyone the right to call the extension's functions and only
-- Supabase's own admin account could take that back. Run once; safe to run again.
-- API keys are never written here: the repo is public.
create schema if not exists admin_tools;
comment on schema admin_tools is 'Tools only the owner uses from the database admin side (the http extension for tests). Never opened to the website roles.';
revoke all on schema admin_tools from public, anon, authenticated;
create extension if not exists http with schema admin_tools;
