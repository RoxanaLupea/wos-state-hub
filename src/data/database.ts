import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// The project address and key. Both are safe to ship inside the page: they say which
// project to talk to, not who you are. What stops a stranger changing anything is the
// access rules in the database itself.
//
// A local .env file or the repository secrets can set other values, for example to
// try a second project. When they are missing or empty, the site uses the state hub
// project below, so the published site never depends on the secrets being there.
const STATE_HUB_PROJECT_URL = 'https://tnfghlayeguyheoyrakq.supabase.co';
const STATE_HUB_PUBLIC_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZmdobGF5ZWd1eWhl' +
  'b3lyYWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwMDk5NDMsImV4cCI6MjExMDU4NTk0M30.' +
  '6w_B7UjHC_wGZSiDqlMJinFUvK7DSGTFnO2DTdlfAJY';

const projectUrl: string = import.meta.env.VITE_SUPABASE_URL || STATE_HUB_PROJECT_URL;
const publicKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || STATE_HUB_PUBLIC_KEY;

let openConnection: SupabaseClient | null = null;

export function database(): SupabaseClient {
  if (!openConnection) {
    openConnection = createClient(projectUrl, publicKey);
  }
  return openConnection;
}
