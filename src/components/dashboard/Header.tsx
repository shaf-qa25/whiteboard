"use client";

import React from "react";
import { Plus, Sparkles, Video, Users, Palette, PenTool } from "lucide-react";
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
  const userColor = session?.user?.user_metadata?.userColor || "#d95b35";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-6 sm:p-8 shadow-paper">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e5df] bg-[#faf8f3] px-3 py-1 text-xs font-medium text-[#77736d]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: userColor }} />
            <span>Workspace • Real-Time Collaborative Canvas</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
            Welcome back, <span className="font-handwriting text-3xl sm:text-4xl text-[#d95b35] font-semibold">{userName}</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#77736d] max-w-xl leading-relaxed">
            Create or open a whiteboard room to sketch system architectures, brainstorm concepts, and communicate over live video with your team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateRoomModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-3 text-xs sm:text-sm font-semibold text-[#fffefb] hover:bg-[#2b2b2b] active:scale-98 transition-all shadow-paper cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#d95b35]" />
            <span>Create New Board</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights Specimen Bar */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#e8e5df] pt-5 text-xs text-[#77736d]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35]">
            <PenTool className="h-3.5 w-3.5" />
          </div>
          <span>Infinite Canvas, Shapes & Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#faf8f3] border border-[#e8e5df] text-[#059669]">
            <Users className="h-3.5 w-3.5" />
          </div>
          <span>Real-time Multi-Cursor Broadcast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#faf8f3] border border-[#e8e5df] text-[#2563eb]">
            <Video className="h-3.5 w-3.5" />
          </div>
          <span>Integrated Stream Video Calling</span>
        </div>
      </div>
    </div>
  );
}
