import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_ROUNDS = 10;
const TICKET_SECRET =
  process.env.STREAM_CHAT_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "collabboard_room_auth_secret_key";

/**
 * Strong password hashing using bcrypt
 */
export async function hashRoomPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies room password safely on the server using bcrypt.
 * Enforces bcrypt-only hashed passwords. Legacy plaintext passwords are strictly rejected.
 */
export async function verifyRoomPassword(
  inputPassword: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  if (!storedHash) return false;

  // Check if stored value is a valid bcrypt hash ($2a$, $2b$, or $2y$)
  const isBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash);

  if (!isBcrypt) {
    // Legacy plaintext passwords are strictly rejected for production security
    return false;
  }

  return bcrypt.compare(inputPassword, storedHash);
}

/**
 * Generates a signed, time-limited access ticket for a validated room session
 */
export function generateRoomAccessTicket(roomId: string, userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours
  const payload = JSON.stringify({ roomId, userId, exp: expiresAt });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TICKET_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Validates a signed room access ticket
 */
export function verifyRoomAccessTicket(ticket: string, roomId: string): boolean {
  if (!ticket || !ticket.includes(".")) return false;

  try {
    const [encodedPayload, providedSignature] = ticket.split(".");
    const expectedSignature = crypto
      .createHmac("sha256", TICKET_SECRET)
      .update(encodedPayload)
      .digest("base64url");

    if (providedSignature !== expectedSignature) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.roomId !== roomId) {
      return false;
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false; // Expired
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a signed, cryptographic guest session token.
 * Valid for 30 days. Contains cryptographically verified guest ID, name, and color.
 */
export function generateGuestSessionToken(guestId: string, name?: string, color?: string): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 30; // 30 days
  const payload = JSON.stringify({
    guestId,
    name: name || "Guest Artist",
    color: color || "#3b82f6",
    iat: now,
    exp,
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TICKET_SECRET)
    .update(`guest:${encodedPayload}`)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Validates a signed guest session token and extracts the verified guest identity.
 * Returns null if token is forged, expired, or invalid.
 */
export function verifyGuestSessionToken(
  token: string | null | undefined
): { guestId: string; name: string; color: string } | null {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;

  try {
    const [encodedPayload, providedSignature] = token.split(".");
    const expectedSignature = crypto
      .createHmac("sha256", TICKET_SECRET)
      .update(`guest:${encodedPayload}`)
      .digest("base64url");

    if (providedSignature !== expectedSignature) {
      return null; // Forged signature
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (!payload.guestId || typeof payload.guestId !== "string" || !payload.guestId.startsWith("guest_")) {
      return null;
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      guestId: payload.guestId,
      name: payload.name,
      color: payload.color,
    };
  } catch {
    return null;
  }
}
