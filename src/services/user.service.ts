import { isSupabaseConfigured, supabase } from "../lib/initSupabase";

export interface AppUserSession {
  user: {
    id: string;
    email?: string;
    user_metadata: {
      userName?: string;
      userColor?: string;
      isGuest?: boolean;
    };
  };
  guestToken?: string;
}

const GUEST_STORAGE_KEY = "collabboard_guest_session";

// Retrieve stored server-signed guest token
export const getGuestToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(GUEST_STORAGE_KEY);
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    return session.guestToken || null;
  } catch {
    return null;
  }
};

// Retrieve current session (Supabase or local Guest fallback)
export const getUserSession = async (): Promise<AppUserSession | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) {
        return data.session as unknown as AppUserSession;
      }
    } catch (err) {
      console.warn("Supabase auth getSession check failed:", err);
    }
  }

  // Fallback to local guest session if available in browser
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.guestToken) {
          return parsed;
        }
      } catch {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }
  }

  // Generate server-signed guest identity if not present
  try {
    const res = await fetch("/api/auth/guest-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const serverSession = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(serverSession));
      }
      return serverSession;
    }
  } catch (err) {
    console.warn("Could not acquire server-signed guest token:", err);
  }

  return null;
};

// Create a guest session with server signature
export const createGuestSession = (name?: string, preferredColor?: string): AppUserSession => {
  const defaultColors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
  ];

  const randomId = "guest_" + Math.random().toString(36).substring(2, 9);
  const color = preferredColor || defaultColors[Math.floor(Math.random() * defaultColors.length)];
  const userName = name?.trim() || `Artist_${randomId.slice(-4)}`;

  const session: AppUserSession = {
    user: {
      id: randomId,
      email: `${userName.toLowerCase().replace(/\s+/g, "_")}@guest.local`,
      user_metadata: {
        userName,
        userColor: color,
        isGuest: true,
      },
    },
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session));
    // Asynchronously upgrade to server-signed token
    fetch("/api/auth/guest-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredName: userName, preferredColor: color }),
    })
      .then((r) => r.json())
      .then((serverSession) => {
        if (serverSession?.guestToken) {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(serverSession));
        }
      })
      .catch(() => {});
  }

  return session;
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out from Supabase:", err);
    }
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }
};

// Fetch user profile by ID (calls server profile route)
export const fetchUserById = async (userId: string) => {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/user/profile?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          return { user: data.user };
        }
      }
    } catch {
      // fallback to client-side cache
    }
  }

  // Check if it's the current user or guest in localStorage
  if (typeof window !== "undefined") {
    const current = localStorage.getItem(GUEST_STORAGE_KEY);
    if (current) {
      try {
        const parsed = JSON.parse(current);
        if (parsed.user.id === userId) {
          return { user: parsed.user };
        }
      } catch {
        // ignore
      }
    }

    // Check cached user colors/names
    const registryKey = `collabboard_user_${userId}`;
    const cached = localStorage.getItem(registryKey);
    if (cached) {
      try {
        return { user: JSON.parse(cached) };
      } catch {
        // ignore
      }
    }
  }

  return {
    user: {
      id: userId,
      user_metadata: {
        userName: `User_${userId.slice(0, 4)}`,
        userColor: "#3b82f6",
      },
    },
  };
};

// Register user profile info in local cache for cursor rendering
export const registerUserInRegistry = (userId: string, userName: string, userColor: string) => {
  if (typeof window !== "undefined") {
    const registryKey = `collabboard_user_${userId}`;
    localStorage.setItem(
      registryKey,
      JSON.stringify({
        id: userId,
        user_metadata: { userName, userColor },
      })
    );
  }
};

// Generate Stream video token via backend route with room authorization & access ticket
export const generateUserVideoToken = async (
  userId: string,
  roomId?: string,
  accessTicket?: string | null
) => {
  try {
    const guestToken = getGuestToken();
    const res = await fetch("/api/generate-user-video-instance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(guestToken ? { "x-guest-token": guestToken } : {}),
      },
      body: JSON.stringify({ userId, roomId, accessTicket, guestToken }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn("Video token API responded with error:", errorText);
      return { token: null, username: userId };
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to generate user video token:", error);
    return { token: null, username: userId };
  }
};
