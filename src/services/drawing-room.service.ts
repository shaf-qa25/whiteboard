import { isSupabaseConfigured, supabase } from "../lib/initSupabase";

export const DRAWING_ROOM_TABLE = "drawing-rooms";

export interface DrawingRoom {
  id: string;
  name: string;
  owner: string;
  isPublic: boolean;
  isPasswordProtected?: boolean;
  drawing?: string | null;
  created_at: string;
  updated_at?: string;
  // NOTE: Password fields are never exposed to the client
}

const LOCAL_ROOMS_KEY = "collabboard_local_rooms";

const getLocalRooms = (): DrawingRoom[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_ROOMS_KEY);
  if (!stored) {
    const sample: DrawingRoom = {
      id: "demo-room-101",
      name: "Team Brainstorming & Architecture",
      owner: "system",
      isPublic: true,
      isPasswordProtected: false,
      created_at: new Date().toISOString(),
      drawing: null,
    };
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify([sample]));
    return [sample];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const saveLocalRooms = (rooms: DrawingRoom[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
  }
};

/**
 * Creates a drawing room via the secure server-side API (with bcrypt password hashing).
 */
export const createDrawingRoom = async (
  name: string,
  userId: string,
  isPublic: boolean = true,
  password?: string
): Promise<DrawingRoom[] | null> => {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId, isPublic, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          const rooms = getLocalRooms();
          rooms.unshift(data.room);
          saveLocalRooms(rooms);
          return [data.room];
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create room");
      }
    } catch (err) {
      console.warn("Server API room creation error, falling back to local:", err);
    }
  }

  // Local fallback
  const newRoomId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `room_${Date.now()}`;
  const now = new Date().toISOString();
  const localRoom: DrawingRoom = {
    id: newRoomId,
    name,
    owner: userId,
    isPublic,
    isPasswordProtected: Boolean(password),
    created_at: now,
    drawing: null,
  };

  const rooms = getLocalRooms();
  rooms.unshift(localRoom);
  saveLocalRooms(rooms);
  return [localRoom];
};

/**
 * Fetches user drawing rooms with sanitized fields (omits password)
 */
export const fetchUserDrawingRooms = async (userId: string): Promise<DrawingRoom[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from(DRAWING_ROOM_TABLE)
        .select("id, name, owner, isPublic, isPasswordProtected, created_at, updated_at")
        .eq("owner", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as DrawingRoom[];
      }
    } catch (err) {
      console.warn("Supabase fetchUserDrawingRooms error:", err);
    }
  }

  const rooms = getLocalRooms();
  return rooms.filter((r) => r.owner === userId || r.owner === "system");
};

/**
 * Fetches public drawing rooms with sanitized fields (omits password)
 */
export const fetchPublicDrawingRooms = async (): Promise<DrawingRoom[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from(DRAWING_ROOM_TABLE)
        .select("id, name, owner, isPublic, isPasswordProtected, created_at, updated_at")
        .eq("isPublic", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as DrawingRoom[];
      }
    } catch (err) {
      console.warn("Supabase fetchPublicDrawingRooms error:", err);
    }
  }

  const rooms = getLocalRooms();
  return rooms.filter((r) => r.isPublic);
};

/**
 * Fetches a single drawing room by ID with sanitized fields (password column is NEVER selected)
 */
export const fetchDrawingRoomById = async (id: string): Promise<DrawingRoom[] | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from(DRAWING_ROOM_TABLE)
        .select("id, name, owner, isPublic, isPasswordProtected, created_at, updated_at, drawing")
        .eq("id", id);

      if (!error && data && data.length > 0) {
        return data as DrawingRoom[];
      }
    } catch (err) {
      console.warn("Supabase fetchDrawingRoomById error:", err);
    }
  }

  const rooms = getLocalRooms();
  const found = rooms.find((r) => r.id === id);
  if (found) {
    return [found];
  }

  return null;
};

/**
 * Verifies room password safely via the rate-limited server API.
 */
export const verifyRoomPasswordOnServer = async (
  roomId: string,
  password: string,
  userId: string = "guest_user"
): Promise<{ success: boolean; message?: string; accessTicket?: string; drawing?: string | null }> => {
  try {
    const res = await fetch("/api/room/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, password, userId }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }
    return { success: false, message: data.message || "Failed to verify room password" };
  } catch (err) {
    return { success: false, message: "Network error while verifying password" };
  }
};

export const updateRoomDrawing = async (roomId: string, drawing: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from(DRAWING_ROOM_TABLE)
        .update({
          drawing,
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId);
      return;
    } catch (err) {
      console.warn("Supabase updateRoomDrawing error:", err);
    }
  }

  const rooms = getLocalRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    room.drawing = drawing;
    room.updated_at = new Date().toISOString();
    saveLocalRooms(rooms);
  }
};

export const deleteDrawingRoom = async (roomId: string, userId: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from(DRAWING_ROOM_TABLE)
        .delete()
        .eq("id", roomId)
        .eq("owner", userId);

      if (!error) return true;
    } catch (err) {
      console.warn("Supabase deleteDrawingRoom error:", err);
    }
  }

  let rooms = getLocalRooms();
  rooms = rooms.filter((r) => r.id !== roomId);
  saveLocalRooms(rooms);
  return true;
};
