import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerAdmin } from "@/lib/supabaseServerAdmin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    const isUuid = UUID_REGEX.test(userId);
    const adminClient = getSupabaseServerAdmin();

    // If not a UUID (guest or system user) or admin not configured, return safe guest profile
    if (!adminClient || !isUuid) {
      return NextResponse.json({
        user: {
          id: userId,
          user_metadata: {
            userName: userId.startsWith("guest_")
              ? `Guest_${userId.slice(-4)}`
              : userId === "system"
              ? "System Host"
              : `User_${userId.slice(0, 6)}`,
            userColor: "#3b82f6",
          },
        },
      });
    }

    // Attempt to lookup real authenticated Supabase user profile
    try {
      const { data, error } = await adminClient.auth.admin.getUserById(userId);
      if (!error && data?.user) {
        return NextResponse.json({
          user: {
            id: data.user.id,
            user_metadata: {
              userName: data.user.user_metadata?.userName || `User_${data.user.id.slice(0, 6)}`,
              userColor: data.user.user_metadata?.userColor || "#3b82f6",
            },
          },
        });
      }
    } catch (lookupErr) {
      console.warn("Supabase admin getUserById lookup failed:", lookupErr);
    }

    // Default safe fallback
    return NextResponse.json({
      user: {
        id: userId,
        user_metadata: {
          userName: `User_${userId.slice(0, 6)}`,
          userColor: "#3b82f6",
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
