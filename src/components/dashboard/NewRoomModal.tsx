"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createDrawingRoom } from "@/services/drawing-room.service";
import { AppUserSession } from "@/services/user.service";
import { X, Sparkles, Globe, Lock, KeyRound, ArrowRight } from "lucide-react";

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
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isCreatingRoom && setShow(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-slate-900/10">
        <button
          type="button"
          onClick={() => setShow(false)}
          disabled={isCreatingRoom}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Collaboration Space</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Create a Drawing Room
          </h2>
          <p className="text-xs text-slate-500">
            Set up an interactive canvas to draw and talk with your teammates in real-time.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Room Title
            </label>
            <input
              type="text"
              placeholder="e.g. Design System Sprint Board"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
              autoFocus
            />

            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  type="button"
                  key={tmpl}
                  onClick={() => setRoomName(tmpl.replace(/^[^\s]+\s/, ""))}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Option */}
          <div className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
            <label className="text-xs font-semibold text-slate-700 block">
              Room Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  isPublic
                    ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Globe className={`h-4 w-4 ${isPublic ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <div className="font-bold">Public</div>
                  <div className="text-[10px] text-slate-500">Anyone with link</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  !isPublic
                    ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Lock className={`h-4 w-4 ${!isPublic ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <div className="font-bold">Private</div>
                  <div className="text-[10px] text-slate-500">Only invited/owner</div>
                </div>
              </button>
            </div>
          </div>

          {/* Optional password protection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasPassword"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasPassword" className="text-xs font-medium text-slate-700 cursor-pointer">
                Protect room with a password
              </label>
            </div>

            {hasPassword && (
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Enter room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShow(false)}
              disabled={isCreatingRoom}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingRoom}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-98 transition-all disabled:opacity-50"
            >
              <span>{isCreatingRoom ? "Creating Room..." : "Launch Board"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
