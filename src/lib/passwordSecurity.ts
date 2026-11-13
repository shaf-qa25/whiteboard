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
