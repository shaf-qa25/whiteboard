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
  Brush
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
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
            <Brush className="h-5 w-5" />
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              room.isPublic
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
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
        </div>

        <div className="mt-4 space-y-1">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {room.name}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {formattedDate}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Invite Link"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          {isOwner && onDeleteRoom && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete Room"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <Link
          href={`/room/${room.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-600 group-hover:bg-blue-600 active:scale-95"
        >
          <span>Join Board</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="animate-pulse flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-lg bg-slate-200" />
          <div className="h-5 w-16 rounded-full bg-slate-200" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-5 w-3/4 rounded-md bg-slate-200" />
          <div className="h-3.5 w-1/3 rounded-md bg-slate-100" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="h-8 w-16 rounded-md bg-slate-100" />
        <div className="h-8 w-24 rounded-md bg-slate-200" />
      </div>
    </div>
  );
}
