import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Normalize URL (strip trailing /rest/v1 or slashes if user pasted full REST endpoint)
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_API_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("placeholder")
);

// Fallback dummy client if credentials are not configured yet
const dummyUrl = "https://placeholder-project.supabase.co";
const dummyKey = "placeholder-anon-key";

// Client-safe Supabase instance (uses only public anon key)
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : dummyUrl,
  isSupabaseConfigured ? supabaseAnonKey : dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
