import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { StreamChat } from "stream-chat";
import { getSupabaseServerAdmin } from "@/lib/supabaseServerAdmin";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { verifyRoomAccessTicket } from "@/lib/passwordSecurity";
import { resolveCallerIdentity } from "@/lib/serverAuth";

const DRAWING_ROOM_TABLE = "drawing-rooms";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rate limiting map: ip -> { count: number, resetAt: number }
const tokenRateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_TOKEN_REQUESTS = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkTokenRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = tokenRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    tokenRateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_TOKEN_REQUESTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

/**
 * Generates an HMAC-SHA256 signed Stream JWT token with issued-at and expiration claims.
 * Tokens expire in 12 hours.
 */
function generateStreamJwtToken(secretKey: string, userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 12 * 60 * 60; // 12 hours expiration

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      user_id: userId,
      iat: now,
      exp: exp,
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    if (!checkTokenRateLimit(ip)) {
      return NextResponse.json(
        { message: "Too many video token requests. Please wait before generating another token." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { userId, roomId, callId, accessTicket } = body;
    const targetRoomId = (roomId || callId || "").trim();

    if (!userId || typeof userId !== "string" || userId.trim().length < 2) {
      return NextResponse.json({ message: "Valid user ID is required" }, { status: 400 });
    }

    const cleanUserId = userId.trim();
    if (!/^[a-zA-Z0-9_-]{2,100}$/.test(cleanUserId)) {
      return NextResponse.json({ message: "User ID contains invalid characters" }, { status: 400 });
    }

    // Room ID is strictly required to join a video session
    if (!targetRoomId) {
      return NextResponse.json(
        { message: "Associated room ID is required to generate video call token" },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(targetRoomId)) {
      return NextResponse.json({ message: "Invalid room ID format" }, { status: 400 });
    }

    // Room membership & authorization validation
    const dbClient = getSupabaseServerAdmin() || (isSupabaseConfigured ? supabase : null);
    if (!dbClient) {
      return NextResponse.json({ message: "Database service unavailable" }, { status: 503 });
    }

    const { data: room, error } = await dbClient
      .from(DRAWING_ROOM_TABLE)
      .select("id, isPublic, isPasswordProtected, owner")
      .eq("id", targetRoomId)
      .single();

    if (error || !room) {
      return NextResponse.json({ message: "Associated room not found" }, { status: 404 });
    }

    const callerIdentity = await resolveCallerIdentity(req, body);
    const isOwner = Boolean(callerIdentity && callerIdentity.userId === room.owner);

    // Private Room Check: non-owner must present valid signed access ticket
    if (!room.isPublic && !isOwner) {
      const isAuthorized = accessTicket && verifyRoomAccessTicket(accessTicket, targetRoomId);
      if (!isAuthorized) {
        return NextResponse.json(
          { message: "Access restricted: you do not have permission to join video call in this private room" },
          { status: 403 }
        );
      }
    }

    // Password-Protected Room Check: non-owner must present validated access ticket
    if (room.isPasswordProtected && !isOwner) {
      const isAuthorized = accessTicket && verifyRoomAccessTicket(accessTicket, targetRoomId);
      if (!isAuthorized) {
        return NextResponse.json(
          { message: "Password verification required: unlock room to access video calling" },
          { status: 403 }
        );
      }
    }

    // Authenticated user session validation if a registered UUID is supplied
    if (UUID_REGEX.test(cleanUserId)) {
      const authHeader = req.headers.get("authorization");
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
      if (bearerToken) {
        const adminClient = getSupabaseServerAdmin();
        if (adminClient) {
          const { data: authData, error: authErr } = await adminClient.auth.getUser(bearerToken);
          if (authErr || !authData?.user || authData.user.id !== cleanUserId) {
            return NextResponse.json(
              { message: "Session mismatch: authenticated user ID does not match token request" },
              { status: 401 }
            );
          }
        }
      }
    }

    const apiKey =
      process.env.STREAM_CHAT_API_KEY ||
      process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY;
    const secretKey = process.env.STREAM_CHAT_SECRET_KEY;

    const hasKeys =
      apiKey &&
      apiKey.length > 5 &&
      !apiKey.includes("placeholder");

    if (!hasKeys) {
      return NextResponse.json({
        message: "Stream credentials not configured, operating in preview mode",
        token: null,
        username: cleanUserId,
        isConfigured: false,
      });
    }

    let token: string;
    if (secretKey && !secretKey.includes("placeholder")) {
      token = generateStreamJwtToken(secretKey, cleanUserId);
    } else {
      const chatClient = StreamChat.getInstance(apiKey);
      token = chatClient.devToken(cleanUserId);
    }

    return NextResponse.json({
      message: "Token generated successfully",
      token,
      username: cleanUserId,
      isConfigured: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "An error occurred while processing the request: " + message },
      { status: 500 }
    );
  }
}
