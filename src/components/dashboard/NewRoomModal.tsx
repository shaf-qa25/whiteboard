"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createDrawingRoom } from "@/services/drawing-room.service";
import { AppUserSession } from "@/services/user.service";
import { X, Sparkles, Globe, Lock, KeyRound, ArrowRight, PenTool } from "lucide-react";
import Spinner from "@/components/videos/Spinner";

interface NewRoomModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  loadUserDrawingRooms: () => Promise<void>;
  session: AppUserSession | null;
}

const TEMPLATES = [
  "🚀 Product Architecture & Flow",
  "💡 Sprint Brainstorming",
  "🎨 UX Wireframe & Journey",
  "📊 Weekly Team Retro",
];

export default function NewRoomModal({
  show,
  setShow,
  loadUserDrawingRooms,
  session,
}: NewRoomModalProps) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError("Please provide a room title.");
      return;
    }

    setIsCreatingRoom(true);
    setError(null);

    try {
      const userId = session?.user?.id || "guest_user";
      const newRoom = await createDrawingRoom(
        roomName.trim(),
        userId,
        isPublic,
        hasPassword ? password : undefined
      );

      if (newRoom && newRoom[0]?.id) {
        await loadUserDrawingRooms();
        setShow(false);
        router.push(`/room/${newRoom[0].id}`);
      } else {
        setError("Failed to create room. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating room";
      setError(msg);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs transition-opacity"
        onClick={() => !isCreatingRoom && setShow(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-6 sm:p-7 shadow-paper-modal animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={() => setShow(false)}
          disabled={isCreatingRoom}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#faf8f3] border border-[#e8e5df] px-2.5 py-0.5 text-[11px] font-semibold text-[#77736d]">
            <PenTool className="h-3 w-3 text-[#d95b35]" />
            <span>New Creative Workspace</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#171717]">
            Create a Whiteboard Room
          </h2>
          <p className="text-xs text-[#77736d]">
            Set up an interactive paper canvas to draw and talk with your teammates in real time.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-[#fdf0e7] p-3 text-xs text-[#9c3e1e] border border-[#fbd7c3]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1.5">
              Room Title
            </label>
            <input
              type="text"
              placeholder="e.g. System Design & Sprint Board"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full rounded-xl border border-[#e8e5df] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#171717] placeholder:text-[#9c978f] focus:border-[#171717] focus:outline-hidden transition-colors"
              autoFocus
            />

            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  type="button"
                  key={tmpl}
                  onClick={() => setRoomName(tmpl.replace(/^[^\s]+\s/, ""))}
                  className="rounded-md border border-[#e8e5df] bg-[#faf8f3] px-2 py-0.5 text-[11px] font-medium text-[#77736d] hover:bg-white hover:text-[#171717] hover:border-[#171717] transition-all"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Option */}
          <div className="rounded-xl border border-[#e8e5df] p-3 space-y-2 bg-[#faf8f3]">
            <label className="text-xs font-semibold text-[#171717] block">
              Room Permissions & Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  isPublic
                    ? "border-[#171717] bg-white text-[#171717] shadow-xs"
                    : "border-[#e8e5df] bg-white/60 text-[#77736d] hover:bg-white"
                }`}
              >
                <div className={`p-1.5 rounded-md ${isPublic ? "bg-[#e4f4e8] text-[#1e6b36]" : "bg-slate-100 text-slate-400"}`}>
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-bold text-[#171717]">Public Board</div>
                  <div className="text-[10px] text-[#77736d]">Anyone with link</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  !isPublic
                    ? "border-[#171717] bg-white text-[#171717] shadow-xs"
                    : "border-[#e8e5df] bg-white/60 text-[#77736d] hover:bg-white"
                }`}
              >
                <div className={`p-1.5 rounded-md ${!isPublic ? "bg-[#fdf0e7] text-[#9c3e1e]" : "bg-slate-100 text-slate-400"}`}>
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-bold text-[#171717]">Private Board</div>
                  <div className="text-[10px] text-[#77736d]">Host & invited only</div>
                </div>
              </button>
            </div>
          </div>

          {/* Optional password protection */}
          <div className="space-y-2 rounded-xl border border-[#e8e5df] p-3 bg-white">
            <div className="flex items-center justify-between">
              <label htmlFor="hasPassword" className="text-xs font-medium text-[#171717] cursor-pointer flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-[#d95b35]" />
                <span>Protect room with a passcode</span>
              </label>
              <input
                type="checkbox"
                id="hasPassword"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
                className="h-4 w-4 rounded-sm border-[#e8e5df] text-[#171717] accent-[#171717] cursor-pointer"
              />
            </div>

            {hasPassword && (
              <div className="pt-2">
                <input
                  type="password"
                  placeholder="Enter passcode (min 4 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#e8e5df] bg-[#faf8f3] px-3 py-2 text-xs text-[#171717] placeholder:text-[#9c978f] focus:border-[#171717] focus:bg-white focus:outline-hidden transition-colors"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e8e5df]">
            <button
              type="button"
              onClick={() => setShow(false)}
              disabled={isCreatingRoom}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingRoom}
              className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-5 py-2 text-xs font-semibold text-[#fffefb] hover:bg-[#2b2b2b] active:scale-98 transition-all disabled:opacity-50 shadow-xs"
            >
              {isCreatingRoom ? (
                <>
                  <Spinner className="h-3.5 w-3.5 text-[#d95b35]" />
                  <span>Creating Board...</span>
                </>
              ) : (
                <>
                  <span>Launch Canvas</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#d95b35]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
