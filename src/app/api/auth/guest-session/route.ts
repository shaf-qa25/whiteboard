import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateGuestSessionToken } from "@/lib/passwordSecurity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { preferredName, preferredColor } = body;

    // Generate secure random guest ID on the server
    const randomSuffix = crypto.randomUUID().replace(/-/g, "").substring(0, 10);
    const guestId = `guest_${randomSuffix}`;

    const defaultColors = [
      "#3b82f6", // blue
      "#10b981", // emerald
      "#f59e0b", // amber
      "#ef4444", // red
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#06b6d4", // cyan
    ];

    const color =
      preferredColor && typeof preferredColor === "string" && preferredColor.startsWith("#")
        ? preferredColor
        : defaultColors[Math.floor(Math.random() * defaultColors.length)];

    const userName =
      preferredName && typeof preferredName === "string" && preferredName.trim().length > 0
        ? preferredName.trim().slice(0, 30)
        : `Artist_${guestId.slice(-4)}`;

    const guestToken = generateGuestSessionToken(guestId, userName, color);

    const userSession = {
      user: {
        id: guestId,
        email: `${userName.toLowerCase().replace(/\s+/g, "_")}@guest.local`,
        user_metadata: {
          userName,
          userColor: color,
          isGuest: true,
        },
      },
      guestToken,
    };

    return NextResponse.json(userSession);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
