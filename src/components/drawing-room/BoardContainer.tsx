"use client";

import React, { useState } from "react";
import WhiteBoard from "./WhiteBoard";
import VideoWrapper from "../videos/VideoWrapper";
import VideoLayout from "../videos/VideoLayout";
import { DrawingRoom } from "@/services/drawing-room.service";
import { AppUserSession } from "@/services/user.service";
import { Video, ChevronRight, ChevronLeft } from "lucide-react";

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
    color: "#0f172a",
    size: 4,
  });

  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(true);

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-100">
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
        className="absolute top-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-lg border border-slate-200 backdrop-blur-md hover:bg-slate-100 transition-all cursor-pointer"
        title={isVideoPanelOpen ? "Hide Video Sidebar" : "Show Video Sidebar"}
      >
        {isVideoPanelOpen ? <ChevronRight className="h-4 w-4" /> : <Video className="h-4 w-4 text-blue-600" />}
      </button>

      {/* Collapsible Video Sidebar */}
      {isVideoPanelOpen && (
        <aside className="relative z-30 w-80 shrink-0 border-l border-slate-200 bg-slate-900/95 p-4 backdrop-blur-md shadow-2xl flex flex-col justify-between overflow-y-auto transition-all">
          <div className="w-full">
            <VideoWrapper userData={session?.user || null} callId={room.id} accessTicket={accessTicket}>
              <VideoLayout setParticipantCount={setParticipantCount} />
            </VideoWrapper>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Drawings and pointer cursors sync live across all participants in this room.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
