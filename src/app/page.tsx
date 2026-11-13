"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DashboardBody from "@/components/dashboard/DashboardBody";
import { getUserSession, AppUserSession } from "@/services/user.service";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import Spinner from "@/components/videos/Spinner";
import { Layers } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<AppUserSession | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const generateUserColor = () => {
    const colors = [
      "#2563eb",
      "#059669",
      "#d97706",
      "#dc2626",
      "#7c3aed",
      "#db2777",
      "#0891b2",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createUsernameFromEmail = (email: string) => {
    try {
      return email?.split("@")[0] || `User_${Math.floor(Math.random() * 1000)}`;
    } catch {
      return `User_${Math.floor(Math.random() * 1000)}`;
    }
  };

  useEffect(() => {
    getUserSession()
      .then((currentSession) => {
        if (currentSession?.user) {
          const meta = currentSession.user.user_metadata || {};
          const isNewUser = !meta.userName || !meta.userColor;

          if (isNewUser) {
            const userName = meta.userName || createUsernameFromEmail(currentSession.user.email || "");
            const userColor = meta.userColor || generateUserColor();

            if (isSupabaseConfigured) {
              supabase.auth.updateUser({
                data: { userName, userColor },
              });
            }

            const updatedSession: AppUserSession = {
              user: {
                ...currentSession.user,
                user_metadata: {
                  ...meta,
                  userName,
                  userColor,
                },
              },
            };
            setSession(updatedSession);
          } else {
            setSession(currentSession);
          }
          setIsAuthenticating(false);
        } else {
          router.push("/login");
        }
      })
      .catch((err) => {
        console.error("Session verification error:", err);
        router.push("/login");
      });
  }, [router]);

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 animate-pulse">
          <Layers className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Spinner className="h-4 w-4 text-blue-600" />
          <span>Validating your session...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar session={session} />
      <DashboardBody session={session} />
    </main>
  );
}
