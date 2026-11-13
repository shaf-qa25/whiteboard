"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchDrawingRoomById, verifyRoomPasswordOnServer, DrawingRoom } from "@/services/drawing-room.service";
import { fetchUserById, getUserSession, AppUserSession } from "@/services/user.service";
import Navbar from "@/components/Navbar";
import BoardContainer from "@/components/drawing-room/BoardContainer";
import Spinner from "@/components/videos/Spinner";
import { Lock, ArrowLeft, KeyRound, AlertCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

function RoomLoadingFallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-900 text-white gap-3">
      <Spinner className="h-8 w-8 text-blue-500" />
      <span className="text-sm font-semibold tracking-wide">
        Connecting to drawing room...
      </span>
      <span className="text-xs text-slate-400">Loading canvas objects & live presence</span>
    </div>
  );
}

function DrawingRoomContent(props: PageProps) {
  const router = useRouter();
  const rawParams = useParams();
  const resolvedParams = props.params ? use(props.params) : null;
  const roomId = (resolvedParams?.roomId || (rawParams?.roomId as string)) || "";

  const [session, setSession] = useState<AppUserSession | null>(null);
  const [room, setRoom] = useState<DrawingRoom | null>(null);
  const [owner, setOwner] = useState<{
    id?: string;
    user_metadata?: { userName?: string; userColor?: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);

  // Password-protected private room state
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const initRoom = async () => {
      if (!roomId) return;

      try {
        const userSession = await getUserSession();
        if (!userSession) {
          router.push(`/login?redirect=/room/${roomId}`);
          return;
        }

        if (isCancelled) return;
        setSession(userSession);

        const roomData = await fetchDrawingRoomById(roomId);
        if (!roomData || roomData.length === 0) {
          router.push("/");
          return;
        }

        const currentRoom = roomData[0];
        const isOwner = currentRoom.owner === userSession.user.id;

        // Check if room is password-protected or private
        if (currentRoom.isPasswordProtected && !isOwner) {
          setIsLocked(true);
          // Withhold drawing from state until password is authenticated
          setRoom({ ...currentRoom, drawing: null });
        } else if (!currentRoom.isPublic && !isOwner) {
          alert("This is a private whiteboard room accessible only to the host.");
          router.push("/");
          return;
        } else {
          setRoom(currentRoom);
        }

        // Fetch owner details
        if (currentRoom.owner) {
          const ownerProfile = await fetchUserById(currentRoom.owner);
          if (!isCancelled && ownerProfile?.user) {
            setOwner(ownerProfile.user);
          }
        }
      } catch (err) {
        console.error("Error loading room:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    initRoom();

    return () => {
      isCancelled = true;
    };
  }, [roomId, router]);

  const handleUnlockRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPassword.trim()) return;

    setIsVerifying(true);
    setPasswordError(false);
    setPasswordErrorMessage("");

    try {
      const res = await verifyRoomPasswordOnServer(
        roomId,
        enteredPassword.trim(),
        session?.user?.id || "guest_user"
      );

      if (res.success) {
        if (res.drawing && room) {
          setRoom({ ...room, drawing: res.drawing });
        }
        setIsLocked(false);
      } else {
        setPasswordError(true);
        setPasswordErrorMessage(res.message || "Incorrect password. Please try again.");
      }
    } catch {
      setPasswordError(true);
      setPasswordErrorMessage("Failed to verify password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <RoomLoadingFallback />;
  }

  // Server-Verified Password Unlock Gate
  if (isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-4 ring-1 ring-amber-500/20">
            <Lock className="h-6 w-6" />
          </div>

          <h2 className="text-center text-lg font-bold">This Whiteboard is Password Protected</h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            Enter the room password provided by the host to join and collaborate.
          </p>

          {passwordError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordErrorMessage || "Incorrect password. Please try again."}</span>
            </div>
          )}

          <form onSubmit={handleUnlockRoom} className="mt-5 space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="Enter password..."
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                autoFocus
                disabled={isVerifying}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>

              <button
                type="submit"
                disabled={isVerifying}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Spinner className="h-3.5 w-3.5 text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Unlock & Join</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Drawing Room Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">The room you are trying to access does not exist or was deleted.</p>
        <Link
          href="/"
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <Navbar
        session={session}
        owner={owner}
        isRoom
        room={room}
        isLoadingRoom={isLoading}
        participantCount={participantCount}
      />

      <BoardContainer
        room={room}
        session={session}
        setParticipantCount={setParticipantCount}
      />
    </div>
  );
}

export default function DrawingRoomPage(props: PageProps) {
  return (
    <Suspense fallback={<RoomLoadingFallback />}>
      <DrawingRoomContent {...props} />
    </Suspense>
  );
}
