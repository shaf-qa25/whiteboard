"use client";

import React from "react";
import { Plus, Sparkles, Video, Users, Palette } from "lucide-react";
import { AppUserSession } from "@/services/user.service";

interface HeaderProps {
  session: AppUserSession | null;
  setShowCreateRoomModal: (show: boolean) => void;
  totalRoomsCount?: number;
}

export default function Header({
  session,
  setShowCreateRoomModal,
  totalRoomsCount = 0,
}: HeaderProps) {
  const userName = session?.user?.user_metadata?.userName || "Creator";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Real-Time Canvas + Stream Video Calling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">@{userName}</span>
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Create or join an interactive whiteboard room to sketch diagrams, brainstorm ideas, and communicate over live video with your team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateRoomModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Room</span>
          </button>
        </div>
      </div>

      {/* Feature highlights bar */}
      <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 pt-5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-blue-400" />
          <span>Infinite Canvas, Shapes & Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-400" />
          <span>Real-time Multi-Cursor Sync</span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-emerald-400" />
          <span>Integrated Stream Video Calling</span>
        </div>
      </div>
    </div>
  );
}
