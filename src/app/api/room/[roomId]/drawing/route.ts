import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerAdmin } from "@/lib/supabaseServerAdmin";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { verifyRoomAccessTicket } from "@/lib/passwordSecurity";

const DRAWING_ROOM_TABLE = "drawing-rooms";

interface RouteContext {
  params: Promise<{ roomId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    if (!roomId) {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { drawing, userId, accessTicket } = body;

    if (!drawing || typeof drawing !== "string") {
      return NextResponse.json({ message: "Drawing data is required" }, { status: 400 });
    }

    const dbClient = getSupabaseServerAdmin() || (isSupabaseConfigured ? supabase : null);
    if (!dbClient) {
      return NextResponse.json({ message: "Database not configured" }, { status: 503 });
    }

    // 1. Check room permissions
    const { data: room, error: fetchErr } = await dbClient
      .from(DRAWING_ROOM_TABLE)
      .select("id, owner, isPublic, isPasswordProtected")
      .eq("id", roomId)
      .single();

    if (fetchErr || !room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    const isOwner = Boolean(userId && (room.owner === userId || room.owner === "system"));
    const hasValidTicket = Boolean(accessTicket && verifyRoomAccessTicket(accessTicket, roomId));

    // If private or password protected, require ownership or valid access ticket
    if (!room.isPublic || room.isPasswordProtected) {
      if (!isOwner && !hasValidTicket) {
        return NextResponse.json(
          { message: "Forbidden: You are not authorized to update this room's canvas." },
          { status: 403 }
        );
      }
    }

    const now = new Date().toISOString();

    // 2. Perform safe update
    const { error: updateErr } = await dbClient
      .from(DRAWING_ROOM_TABLE)
      .update({
        drawing,
        updated_at: now,
      })
      .eq("id", roomId);

    if (updateErr) {
      return NextResponse.json({ message: "Failed to update drawing: " + updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated_at: now });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
