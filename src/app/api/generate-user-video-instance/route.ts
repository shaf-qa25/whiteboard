import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { StreamChat } from "stream-chat";

function generateStreamJwtToken(secretKey: string, userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ user_id: userId })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ message: "User id is required" }, { status: 400 });
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
        username: userId,
        isConfigured: false,
      });
    }

    let token: string;
    if (secretKey && !secretKey.includes("placeholder")) {
      token = generateStreamJwtToken(secretKey, userId);
    } else {
      const chatClient = StreamChat.getInstance(apiKey);
      token = chatClient.devToken(userId);
    }

    return NextResponse.json({
      message: "Token generated successfully",
      token,
      username: userId,
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
