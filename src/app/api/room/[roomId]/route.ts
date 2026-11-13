import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerAdmin } from "@/lib/supabaseServerAdmin";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { verifyRoomAccessTicket } from "@/lib/passwordSecurity";
import { resolveCallerIdentity } from "@/lib/serverAuth";

const DRAWING_ROOM_TABLE = "drawing-rooms";

interface RouteContext {
  params: Promise<{ roomId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    if (!roomId) {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const accessTicket = searchParams.get("ticket") || req.headers.get("x-access-ticket") || "";

    const dbClient = getSupabaseServerAdmin() || (isSupabaseConfigured ? supabase : null);
    if (!dbClient) {
      return NextResponse.json({ message: "Database not configured" }, { status: 503 });
    }

    // Fetch room from database
    const { data, error } = await dbClient
      .from(DRAWING_ROOM_TABLE)
      .select("id, name, owner, isPublic, isPasswordProtected, created_at, updated_at, drawing")
      .eq("id", roomId)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    // Cryptographically verified identity (never trusts client string alone)
    const callerIdentity = await resolveCallerIdentity(req);
    const isOwner = Boolean(callerIdentity && callerIdentity.userId === data.owner);
    const hasValidTicket = Boolean(accessTicket && verifyRoomAccessTicket(accessTicket, roomId));

    // Case 1: Private Room
    if (!data.isPublic) {
      if (!isOwner && !hasValidTicket) {
        return NextResponse.json(
          {
            message: "Access denied. This is a private whiteboard room accessible only to the host or invited guests.",
            isPrivate: true,
          },
          { status: 403 }
        );
      }

      // Authorized owner or ticket holder
      return NextResponse.json({ room: data });
    }

    // Case 2: Public Room with Password Protection
    if (data.isPasswordProtected) {
      if (isOwner || hasValidTicket) {
        return NextResponse.json({ room: data });
      }

      // Withhold drawing payload until password verification succeeds
      return NextResponse.json({
        room: {
          ...data,
          drawing: null,
        },
      });
    }

    // Case 3: Standard Open Public Room
    return NextResponse.json({ room: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    if (!roomId) {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const dbClient = getSupabaseServerAdmin() || (isSupabaseConfigured ? supabase : null);
    if (!dbClient) {
      return NextResponse.json({ message: "Database not configured" }, { status: 503 });
    }

    // 1. Fetch room owner
    const { data: room, error: fetchErr } = await dbClient
      .from(DRAWING_ROOM_TABLE)
      .select("id, owner")
      .eq("id", roomId)
      .single();

    if (fetchErr || !room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    // 2. Strict ownership check
    if (room.owner === "system") {
      return NextResponse.json(
        { message: "Forbidden. Default system rooms cannot be deleted." },
        { status: 403 }
      );
    }

    // Cryptographically verified identity required to delete room
    const callerIdentity = await resolveCallerIdentity(req, body);
    if (!callerIdentity || callerIdentity.userId !== room.owner) {
      return NextResponse.json(
        { message: "Forbidden. You cannot delete a room you do not own." },
        { status: 403 }
      );
    }

    // 3. Delete room
    const { error: delErr } = await dbClient
      .from(DRAWING_ROOM_TABLE)
      .delete()
      .eq("id", roomId);

    if (delErr) {
      return NextResponse.json({ message: "Failed to delete room: " + delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Room deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
