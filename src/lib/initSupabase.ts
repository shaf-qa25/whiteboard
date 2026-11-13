import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_API_KEY || "";
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_SECRET || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("placeholder")
);

// Fallback dummy client if credentials are not configured yet
const dummyUrl = "https://placeholder-project.supabase.co";
const dummyKey = "placeholder-anon-key";

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

// Admin client (only initialized when service role key is present)
export const supabaseWithAdminRole: SupabaseClient | null =
  isSupabaseConfigured && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export const adminAuthClient = supabaseWithAdminRole?.auth?.admin ?? null;
