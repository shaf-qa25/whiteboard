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
  PenTool,
  KeyRound,
  ArrowRight,
  Sparkles
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

  const userColor = session?.user?.user_metadata?.userColor || "#d95b35";
  const userName = session?.user?.user_metadata?.userName || "Creator";
  const isGuest = session?.user?.user_metadata?.isGuest ?? true;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e8e5df] bg-[#fffefb]/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-15 w-full items-center justify-between px-4 sm:px-6 max-w-7xl">
        {/* Left: Brand and Room Details */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-bold tracking-tight text-[#171717] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-[#fffefb] shadow-xs group-hover:bg-[#d95b35] transition-colors">
              <PenTool className="h-4 w-4 text-[#fffefb]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-[#171717]">
                CollabBoard
              </span>
              <span className="hidden sm:inline-block text-[11px] font-handwriting text-[#d95b35] font-semibold text-base leading-none">
                studio
              </span>
            </div>
          </Link>

          {shouldShowRoomName && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#e8e5df]">
              <span className="text-xs text-[#77736d] font-mono">/</span>
              <h2 className="text-xs sm:text-sm font-semibold text-[#171717] max-w-[200px] truncate" title={room?.name}>
                {room?.name}
              </h2>
            </div>
          )}

          {shouldShowRoomVisibilityBadge && (
            <div className="hidden md:flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  room?.isPublic
                    ? "bg-[#e4f4e8] text-[#1e6b36] border border-[#bce3c5]"
                    : "bg-[#fdf0e7] text-[#9c3e1e] border border-[#fbd7c3]"
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

              {room?.isPasswordProtected && (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-[#fef8db] text-[#8a6b08] border border-[#f5e6a3]">
                  <KeyRound className="h-3 w-3" /> Protected
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center: When in Room, quick Live Sync / Participants Pill */}
        {isRoom && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#faf8f3] border border-[#e8e5df] text-[11px] text-[#77736d]">
              <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
              <span className="font-medium text-[#171717]">{participantCount}</span>
              <span>collaborating</span>
            </div>
          </div>
        )}

        {/* Right: Actions and User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Room Action: Copy Link / Share */}
          {isRoom && (
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                copied
                  ? "bg-[#e4f4e8] text-[#1e6b36] border-[#bce3c5]"
                  : "bg-[#ffffff] text-[#171717] border-[#e8e5df] hover:bg-[#faf8f3]"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#1e6b36]" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-[#77736d]" />
                  <span className="hidden sm:inline">Invite & Share</span>
                  <span className="sm:hidden">Share</span>
                </>
              )}
            </button>
          )}

          {/* Quick link to Dashboard when in Room or Landing */}
          {isRoom ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e5df] bg-[#ffffff] px-3 py-1.5 text-xs font-medium text-[#77736d] hover:text-[#171717] hover:bg-[#faf8f3] transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Boards</span>
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#171717] px-3.5 py-1.5 text-xs font-semibold text-[#fffefb] hover:bg-[#2b2b2b] transition-colors shadow-xs"
            >
              <span>Workspace</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#d95b35]" />
            </Link>
          )}

          {/* User Menu / Avatar */}
          {session?.user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg border border-[#e8e5df] bg-[#ffffff] p-1.5 pr-2.5 hover:bg-[#faf8f3] transition-colors focus:outline-hidden"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: userColor }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-[#171717] max-w-[85px] truncate hidden sm:inline">
                  {userName}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-[#e8e5df] bg-[#ffffff] p-2 shadow-paper-modal animate-in fade-in zoom-in-95 duration-100">
                    <div className="border-b border-[#e8e5df] px-2.5 py-2">
                      <p className="text-xs font-semibold text-[#171717] truncate">
                        {userName}
                      </p>
                      <p className="text-[11px] text-[#77736d] truncate">
                        {session.user.email || (isGuest ? "Instant Guest Mode" : "User")}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#171717] hover:bg-[#faf8f3] transition-colors"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-[#77736d]" />
                        <span>All Boards</span>
                      </Link>

                      <Link
                        href="/login"
                        onClick={() => setShowUserMenu(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#171717] hover:bg-[#faf8f3] transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#d95b35]" />
                        <span>Customize Identity</span>
                      </Link>
                    </div>

                    <div className="border-t border-[#e8e5df] pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out / Switch</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
