import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy web/.env.example to web/.env.local and fill them in.",
  );
}

// Browser Supabase client. Session persists to localStorage (the supabase-js
// default), auto-refreshed. detectSessionInUrl stays on for email magic-link /
// OAuth redirects landing back here.
export const supabase = createClient(url, anonKey, {
  auth: { autoRefreshToken: true, persistSession: true },
});
