"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppUserSession, signOutUser } from "@/services/user.service";
import { DrawingRoom } from "@/services/drawing-room.service";
import { 
  Share2, 
  Check, 
  Users, 
  Globe, 
  Lock, 
  LayoutDashboard, 
  LogOut, 
  Sparkles,
  Layers
} from "lucide-react";

interface NavbarProps {
  session: AppUserSession | null;
  owner?: {
    id?: string;
    user_metadata?: {
      userName?: string;
      userColor?: string;
    };
  } | null;
  isRoom?: boolean;
  room?: DrawingRoom | null;
  isLoadingRoom?: boolean;
  participantCount?: number;
}

export default function Navbar({
  session,
  owner,
  isRoom,
  room,
  isLoadingRoom,
  participantCount = 1,
}: NavbarProps) {
  const [copied, setCopied] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const shouldShowRoomName = isRoom && room?.name;
  const shouldShowRoomVisibilityBadge = isRoom && !isLoadingRoom;
  const isRoomOwner = owner?.id === session?.user?.id;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    window.location.href = "/login";
  };

  const userColor = session?.user?.user_metadata?.userColor || "#3b82f6";
  const userName = session?.user?.user_metadata?.userName || "Anonymous";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* Left: Brand and Room Details */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-600"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg leading-tight font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                CollabBoard
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Real-Time Canvas
              </span>
            </div>
          </Link>

          {shouldShowRoomName && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800 max-w-[200px] truncate" title={room?.name}>
                {room?.name}
              </h2>
            </div>
          )}

          {shouldShowRoomVisibilityBadge && (
            <div className="hidden md:flex items-center">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  room?.isPublic
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                }`}
              >
                {room?.isPublic ? (
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
          )}

          {isRoom && owner && (
            <div className="hidden lg:flex items-center text-xs text-slate-500">
              <span className="text-slate-300 mx-1.5">•</span>
              <span>
                Host: <strong className="text-slate-700">{owner?.user_metadata?.userName || "Creator"}</strong>
                {isRoomOwner && <span className="ml-1 text-blue-600 font-medium">(You)</span>}
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions, Live Participants & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isRoom && (
            <>
              {/* Live participant badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>{participantCount} {participantCount === 1 ? "online" : "online"}</span>
              </div>

              {/* Share button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer active:scale-95"
                title="Copy Room Link to Invite Friends"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Invite</span>
                  </>
                )}
              </button>

              {/* Back to Dashboard */}
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-all active:scale-95"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </>
          )}

          {/* User profile dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full p-1 pl-2 text-left hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <span className="hidden sm:inline text-xs font-medium text-slate-700 max-w-[120px] truncate">
                {userName}
              </span>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs ring-2 ring-white"
                style={{ backgroundColor: userColor }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{userName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{session?.user?.email || "Guest Session"}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: userColor }} />
                    <span className="text-[11px] text-slate-600">Your cursor color</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out / Switch User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
