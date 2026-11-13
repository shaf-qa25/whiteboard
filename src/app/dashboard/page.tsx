"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DashboardBody from "@/components/dashboard/DashboardBody";
import { getUserSession, AppUserSession } from "@/services/user.service";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import Spinner from "@/components/videos/Spinner";
import { Layers } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<AppUserSession | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const generateUserColor = () => {
    const colors = [
      "#d95b35", // terracotta
      "#2563eb", // blue
      "#059669", // emerald
      "#d97706", // amber
      "#7c3aed", // violet
      "#db2777", // pink
      "#0891b2", // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createUsernameFromEmail = (email: string) => {
    try {
      return email?.split("@")[0] || `Creator_${Math.floor(Math.random() * 1000)}`;
    } catch {
      return `Creator_${Math.floor(Math.random() * 1000)}`;
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
          router.push("/login?redirect=/dashboard");
        }
      })
      .catch((err) => {
        console.error("Session verification error:", err);
        router.push("/login?redirect=/dashboard");
      });
  }, [router]);

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffefb] gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#171717] text-[#fffefb] shadow-sm">
          <Layers className="h-6 w-6 text-[#d95b35]" />
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-[#77736d]">
          <Spinner className="h-4 w-4 text-[#d95b35]" />
          <span>Opening your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffefb] flex flex-col">
      <Navbar session={session} />
      <DashboardBody session={session} />
    </main>
  );
}
