import { isSupabaseConfigured, supabase } from "../lib/initSupabase";

export const DRAWING_ROOM_TABLE = "drawing-rooms";

export interface DrawingRoom {
  id: string;
  name: string;
  owner: string;
  isPublic: boolean;
  isPasswordProtected?: boolean;
  password?: string | null;
  drawing?: string | null;
  created_at: string;
  updated_at?: string;
}

const LOCAL_ROOMS_KEY = "collabboard_local_rooms";

const getLocalRooms = (): DrawingRoom[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_ROOMS_KEY);
  if (!stored) {
    // Initial sample room
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

export const createDrawingRoom = async (
  name: string,
  userId: string,
  isPublic: boolean = true,
  password?: string
): Promise<DrawingRoom[] | null> => {
  const newRoomId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `room_${Date.now()}`;
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from(DRAWING_ROOM_TABLE)
        .insert({
          id: newRoomId,
          name,
          owner: userId,
          isPublic,
          isPasswordProtected: Boolean(password),
          password: password || null,
          drawing: null,
          created_at: now,
          updated_at: now,
        })
        .select();

      if (!error && data) {
        return data as DrawingRoom[];
      }
      console.warn("Supabase insert error, falling back to local:", error);
    } catch (err) {
      console.warn("Supabase createDrawingRoom exception:", err);
    }
  }

  // Local fallback
  const localRoom: DrawingRoom = {
    id: newRoomId,
    name,
    owner: userId,
    isPublic,
    isPasswordProtected: Boolean(password),
    password: password || null,
    created_at: now,
    drawing: null,
  };

  const rooms = getLocalRooms();
  rooms.unshift(localRoom);
  saveLocalRooms(rooms);
  return [localRoom];
};

export const fetchUserDrawingRooms = async (userId: string): Promise<DrawingRoom[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from(DRAWING_ROOM_TABLE)
        .select("*")
        .eq("owner", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as DrawingRoom[];
      }
    } catch (err) {
      console.warn("Supabase fetchUserDrawingRooms error:", err);
    }
  }

  // Local fallback
  const rooms = getLocalRooms();
  return rooms.filter((r) => r.owner === userId || r.owner === "system");
};

export const fetchPublicDrawingRooms = async (): Promise<DrawingRoom[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from(DRAWING_ROOM_TABLE)
        .select("*")
        .eq("isPublic", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as DrawingRoom[];
      }
    } catch (err) {
      console.warn("Supabase fetchPublicDrawingRooms error:", err);
    }
  }

  // Local fallback
  const rooms = getLocalRooms();
  return rooms.filter((r) => r.isPublic);
};

export const fetchDrawingRoomById = async (id: string): Promise<DrawingRoom[] | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from(DRAWING_ROOM_TABLE)
        .select("*")
        .eq("id", id);

      if (!error && data && data.length > 0) {
        return data as DrawingRoom[];
      }
    } catch (err) {
      console.warn("Supabase fetchDrawingRoomById error:", err);
    }
  }

  // Local fallback
  const rooms = getLocalRooms();
  const found = rooms.find((r) => r.id === id);
  if (found) {
    return [found];
  }

  // If opening a new room link directly that hasn't been saved yet
  const autoCreatedRoom: DrawingRoom = {
    id,
    name: "Collaborative Board",
    owner: "unknown",
    isPublic: true,
    isPasswordProtected: false,
    created_at: new Date().toISOString(),
    drawing: null,
  };
  rooms.push(autoCreatedRoom);
  saveLocalRooms(rooms);
  return [autoCreatedRoom];
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

  // Local fallback
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

  // Local fallback
  let rooms = getLocalRooms();
  rooms = rooms.filter((r) => r.id !== roomId);
  saveLocalRooms(rooms);
  return true;
};
