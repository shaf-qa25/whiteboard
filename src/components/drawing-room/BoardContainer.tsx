"use client";

import React, { useState } from "react";
import WhiteBoard from "./WhiteBoard";
import VideoWrapper from "../videos/VideoWrapper";
import VideoLayout from "../videos/VideoLayout";
import { DrawingRoom } from "@/services/drawing-room.service";
import { AppUserSession } from "@/services/user.service";
import { Video, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

export type ToolType =
  | "select"
  | "pen"
  | "highlighter"
  | "eraser"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text";

export interface DrawingPen {
  tool: ToolType;
  color: string;
  size: number;
}

interface BoardContainerProps {
  room: DrawingRoom;
  session: AppUserSession | null;
  setParticipantCount?: (count: number) => void;
  accessTicket?: string | null;
}

export default function BoardContainer({
  room,
  session,
  setParticipantCount,
  accessTicket,
}: BoardContainerProps) {
  const [drawingPen, setDrawingPen] = useState<DrawingPen>({
    tool: "pen",
    color: "#171717",
    size: 4,
  });

  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(true);

  return (
    <div className="relative flex h-[calc(100vh-3.75rem)] w-full overflow-hidden bg-[#fffefb]">
      {/* Main Interactive Canvas Area */}
      <div className="relative flex-1 h-full w-full overflow-hidden">
        <WhiteBoard
          room={room}
          drawingPen={drawingPen}
          setDrawingPen={setDrawingPen}
          session={session}
          accessTicket={accessTicket}
        />
      </div>

      {/* Floating Toggle for Video Panel */}
      <button
        type="button"
        onClick={() => setIsVideoPanelOpen(!isVideoPanelOpen)}
        className="absolute top-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#171717] shadow-paper border border-[#e8e5df] hover:bg-[#faf8f3] transition-all cursor-pointer"
        title={isVideoPanelOpen ? "Collapse Video Dock" : "Expand Video Call"}
      >
        {isVideoPanelOpen ? (
          <ChevronRight className="h-4 w-4 text-[#77736d]" />
        ) : (
          <Video className="h-4 w-4 text-[#d95b35]" />
        )}
      </button>

      {/* Collapsible Video Sidebar Studio */}
      {isVideoPanelOpen && (
        <aside className="relative z-30 w-80 shrink-0 border-l border-[#e8e5df] bg-[#ffffff] p-4 shadow-paper flex flex-col justify-between overflow-y-auto transition-all animate-in slide-in-from-right duration-150">
          <div className="w-full">
            <VideoWrapper userData={session?.user || null} callId={room.id} accessTicket={accessTicket}>
              <VideoLayout setParticipantCount={setParticipantCount} />
            </VideoWrapper>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e8e5df] text-center">
            <p className="text-[11px] text-[#77736d] leading-relaxed">
              Live strokes and cursors synchronize across all connected participants.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
