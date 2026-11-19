import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// The project address and key come from the .env file when running locally, and from
// the repository secrets when the site is built for publishing. Both are safe to ship
// inside the page: they say which project to talk to, not who you are. What stops a
// stranger changing anything is the access rules in the database itself.
const projectUrl = import.meta.env.VITE_SUPABASE_URL;
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let openConnection: SupabaseClient | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(projectUrl) && Boolean(publicKey);
}

export function database(): SupabaseClient {
  if (!projectUrl || !publicKey) {
    throw new Error(
      'The database address or key is missing. Copy .env.example to .env and fill ' +
      'in both values from the Supabase project, then restart the dev server.'
    );
  }
  if (!openConnection) {
    openConnection = createClient(projectUrl, publicKey);
  }
  return openConnection;
}
