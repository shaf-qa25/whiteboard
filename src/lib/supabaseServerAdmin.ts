import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_SECRET ||
  "";

/**
 * Server-only Supabase Admin Client.
 * WARNING: Never import this file into Client Components.
 */
export const getSupabaseServerAdmin = (): SupabaseClient | null => {
  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes("placeholder")) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
