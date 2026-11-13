import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerAdmin } from "@/lib/supabaseServerAdmin";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { verifyRoomPassword, generateRoomAccessTicket } from "@/lib/passwordSecurity";

const DRAWING_ROOM_TABLE = "drawing-rooms";

// In-memory rate limiting map: ip_roomId -> { attempts: number, resetAt: number }
const rateLimitMap = new Map<string, { attempts: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { attempts: 0, resetAt: now + LOCKOUT_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.attempts };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (record) {
    record.attempts += 1;
  } else {
    rateLimitMap.set(key, { attempts: 1, resetAt: now + LOCKOUT_MS });
  }
}

function clearRateLimit(key: string) {
  rateLimitMap.delete(key);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const body = await req.json().catch(() => ({}));
    const { roomId, password, userId = "guest_user" } = body;

    if (!roomId || typeof roomId !== "string") {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    const rateLimitKey = `${ip}_${roomId}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          message: `Too many failed password attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
          retryAfter: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // Query room directly on server (requires password field for verification)
    const dbClient = getSupabaseServerAdmin() || (isSupabaseConfigured ? supabase : null);
    let storedPassword: string | null = null;
    let roomDrawing: string | null = null;
    let isPasswordProtected = false;

    if (dbClient) {
      const { data, error } = await dbClient
        .from(DRAWING_ROOM_TABLE)
        .select("id, password, isPasswordProtected, drawing")
        .eq("id", roomId)
        .single();

      if (error || !data) {
        return NextResponse.json({ message: "Room not found" }, { status: 404 });
      }

      storedPassword = data.password;
      roomDrawing = data.drawing;
      isPasswordProtected = Boolean(data.isPasswordProtected);
    }

    // If the room is not password-protected
    if (!isPasswordProtected) {
      return NextResponse.json({
        success: true,
        verified: true,
        accessTicket: generateRoomAccessTicket(roomId, userId),
        drawing: roomDrawing,
      });
    }

    // Verify password safely on server
    const isMatch = await verifyRoomPassword(password, storedPassword);

    if (!isMatch) {
      recordFailedAttempt(rateLimitKey);
      const remaining = Math.max(0, rateCheck.remaining - 1);
      return NextResponse.json(
        {
          message: "Incorrect room password",
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }

    // Successful password match
    clearRateLimit(rateLimitKey);
    const accessTicket = generateRoomAccessTicket(roomId, userId);

    return NextResponse.json({
      success: true,
      verified: true,
      accessTicket,
      drawing: roomDrawing,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
