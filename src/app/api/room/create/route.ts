import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerAdmin } from "@/lib/supabaseServerAdmin";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { hashRoomPassword } from "@/lib/passwordSecurity";
import { resolveCallerIdentity } from "@/lib/serverAuth";

const DRAWING_ROOM_TABLE = "drawing-rooms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, userId, isPublic = true, password } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ message: "Room title is required" }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ message: "Room title must be 100 characters or less" }, { status: 400 });
    }
    if (!userId || typeof userId !== "string" || userId.trim().toLowerCase() === "system") {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const cleanUserId = userId.trim();
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const GUEST_REGEX = /^guest_[a-zA-Z0-9_-]{2,50}$/;

    if (!UUID_REGEX.test(cleanUserId) && !GUEST_REGEX.test(cleanUserId)) {
      return NextResponse.json({ message: "User ID format is invalid" }, { status: 400 });
    }

    // Cryptographic Identity Verification (Step 1 - GUEST IDENTITY SECURITY)
    // If a signed guest token or bearer token is present, enforce caller identity matches requested owner
    const callerIdentity = await resolveCallerIdentity(req, body);
    if (callerIdentity && callerIdentity.userId !== cleanUserId) {
      return NextResponse.json(
        { message: "Identity mismatch: cannot create room under an unverified user ID" },
        { status: 401 }
      );
    }

    let hashedPassword: string | null = null;
    const isPasswordProtected = Boolean(password && typeof password === "string" && password.trim().length > 0);

    if (isPasswordProtected) {
      if (password.length < 4) {
        return NextResponse.json(
          { message: "Room password must be at least 4 characters long" },
          { status: 400 }
        );
      }
      if (password.length > 100) {
        return NextResponse.json(
          { message: "Room password must be 100 characters or less" },
          { status: 400 }
        );
      }
      hashedPassword = await hashRoomPassword(password);
    }

    const roomId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `room_${Date.now()}`;
    const now = new Date().toISOString();

    const insertPayload = {
      id: roomId,
      name: name.trim(),
      owner: cleanUserId,
      isPublic: Boolean(isPublic),
      isPasswordProtected,
      password: hashedPassword,
      drawing: null,
      created_at: now,
      updated_at: now,
    };

    // Use admin client if available, or standard supabase client
    const dbClient = getSupabaseServerAdmin() || (isSupabaseConfigured ? supabase : null);

    if (dbClient) {
      const { data, error } = await dbClient
        .from(DRAWING_ROOM_TABLE)
        .insert(insertPayload)
        .select("id, name, owner, isPublic, isPasswordProtected, created_at, updated_at, drawing");

      if (error) {
        console.error("Database room creation error:", error);
        return NextResponse.json(
          { message: "Failed to create room in database: " + error.message },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        return NextResponse.json({ room: data[0] });
      }
    }

    // Fallback response for offline/local mode (never returns password)
    const safeLocalRoom = {
      id: roomId,
      name: name.trim(),
      owner: userId,
      isPublic: Boolean(isPublic),
      isPasswordProtected,
      created_at: now,
      updated_at: now,
      drawing: null,
    };

    return NextResponse.json({ room: safeLocalRoom });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
