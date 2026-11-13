import { NextRequest } from "next/server";
import { getSupabaseServerAdmin } from "./supabaseServerAdmin";
import { verifyGuestSessionToken } from "./passwordSecurity";

export interface ResolvedCallerIdentity {
  userId: string;
  isGuest: boolean;
  verified: boolean;
}

/**
 * Resolves and cryptographically authenticates the caller's identity:
 * - Authenticated Supabase user: validates Bearer token with Supabase Auth -> returns verified UUID
 * - Guest user: validates x-guest-token header (or body/query guestToken) -> returns verified guestId
 * - Unauthenticated callers: returns null (unverified)
 */
export async function resolveCallerIdentity(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any
): Promise<ResolvedCallerIdentity | null> {
  // 1. Check Supabase Auth Bearer Token (Registered Users)
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (bearerToken) {
    const adminClient = getSupabaseServerAdmin();
    if (adminClient) {
      const { data, error } = await adminClient.auth.getUser(bearerToken);
      if (!error && data?.user?.id) {
        return {
          userId: data.user.id,
          isGuest: false,
          verified: true,
        };
      }
    }
  }

  // 2. Check Server-Signed Guest Identity Token (Guest Users)
  const url = new URL(req.url);
  const guestToken =
    req.headers.get("x-guest-token") ||
    body?.guestToken ||
    url.searchParams.get("guestToken");

  if (guestToken && typeof guestToken === "string") {
    const verifiedGuest = verifyGuestSessionToken(guestToken);
    if (verifiedGuest?.guestId) {
      return {
        userId: verifiedGuest.guestId,
        isGuest: true,
        verified: true,
      };
    }
  }

  return null;
}
