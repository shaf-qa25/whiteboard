"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DrawingRoom } from "@/services/drawing-room.service";
import { 
  ArrowRight, 
  Calendar, 
  Globe, 
  Lock, 
  Copy, 
  Check, 
  Trash2,
  PenTool,
  KeyRound,
  Sparkles
} from "lucide-react";

interface RoomCardProps {
  room: DrawingRoom;
  currentUserId?: string;
  onDeleteRoom?: (roomId: string) => void;
}

export function RoomCard({ room, currentUserId, onDeleteRoom }: RoomCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = new Date(room.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isOwner = currentUserId && (room.owner === currentUserId || room.owner === "system");

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/room/${room.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${room.name}"?`)) {
      setIsDeleting(true);
      if (onDeleteRoom) {
        onDeleteRoom(room.id);
      }
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-5 shadow-paper transition-all hover:-translate-y-1 hover:border-[#d95b35]/40 hover:shadow-paper-hover">
      <div>
        {/* Miniature Paper Canvas Preview Area */}
        <div className="relative h-28 w-full rounded-xl border border-[#e8e5df] bg-dotted-grid p-3 flex flex-col justify-between overflow-hidden mb-4">
          <div className="flex items-center justify-between z-10">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                room.isPublic
                  ? "bg-[#e4f4e8] text-[#1e6b36] border border-[#bce3c5]"
                  : "bg-[#fdf0e7] text-[#9c3e1e] border border-[#fbd7c3]"
              }`}
            >
              {room.isPublic ? (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Private
                </>
              )}
            </span>

            {room.isPasswordProtected && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#fef8db] text-[#8a6b08] border border-[#f5e6a3] px-2 py-0.5 text-[10px] font-semibold">
                <KeyRound className="h-3 w-3" /> Protected
              </span>
            )}
          </div>

          {/* Decorative Sketch Elements on Miniature Canvas */}
          <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none">
            <svg className="w-36 h-16" viewBox="0 0 140 60">
              <rect x="15" y="15" width="40" height="25" rx="4" fill="#efe8f9" stroke="#171717" strokeWidth="1.5" />
              <circle cx="95" cy="28" r="16" fill="#e0effa" stroke="#171717" strokeWidth="1.5" />
              <path d="M 55 28 L 78 28" stroke="#d95b35" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
          </div>

          <div className="z-10 flex items-center justify-between text-[10px] font-mono text-[#77736d]">
            <span>Canvas #{room.id.slice(0, 6)}</span>
            <span className="font-handwriting text-sm text-[#d95b35]">ready</span>
          </div>
        </div>

        {/* Title and Metadata */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#171717] group-hover:text-[#d95b35] transition-colors line-clamp-1" title={room.name}>
            {room.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#77736d]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#9c978f]" />
              <span>{formattedDate}</span>
            </span>
            <span>•</span>
            <span className="truncate max-w-[120px]">
              {room.owner === "system" ? "CollabBoard Team" : `By ${room.owner.slice(0, 10)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-[#e8e5df] pt-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Invite Link"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e5df] bg-[#ffffff] text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#1e6b36]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {isOwner && onDeleteRoom && room.owner !== "system" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete Room"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e5df] bg-[#ffffff] text-[#9c978f] hover:bg-[#fdf0e7] hover:text-[#d95b35] hover:border-[#fbd7c3] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Link
          href={`/room/${room.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#171717] px-3.5 py-1.5 text-xs font-semibold text-[#fffefb] hover:bg-[#2b2b2b] transition-all shadow-xs"
        >
          <span>Open Canvas</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#d95b35]" />
        </Link>
      </div>
    </div>
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="animate-pulse flex flex-col justify-between rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-5 shadow-paper">
      <div>
        <div className="h-28 w-full rounded-xl bg-[#faf8f3] border border-[#e8e5df] mb-4" />
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded-md bg-[#faf8f3]" />
          <div className="h-3.5 w-1/3 rounded-md bg-[#faf8f3]" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[#e8e5df] pt-4">
        <div className="h-8 w-16 rounded-lg bg-[#faf8f3]" />
        <div className="h-8 w-24 rounded-lg bg-[#faf8f3]" />
      </div>
    </div>
  );
}
