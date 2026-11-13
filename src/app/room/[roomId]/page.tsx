"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchDrawingRoomById, verifyRoomPasswordOnServer, DrawingRoom } from "@/services/drawing-room.service";
import { fetchUserById, getUserSession, AppUserSession } from "@/services/user.service";
import Navbar from "@/components/Navbar";
import BoardContainer from "@/components/drawing-room/BoardContainer";
import Spinner from "@/components/videos/Spinner";
import { Lock, ArrowLeft, KeyRound, AlertCircle, ShieldAlert, PenTool } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

function RoomLoadingFallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-dotted-grid text-[#171717] gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#171717] text-[#fffefb] shadow-paper">
        <PenTool className="h-6 w-6 text-[#d95b35]" />
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#171717]">
        <Spinner className="h-4 w-4 text-[#d95b35]" />
        <span>Connecting to collaborative studio...</span>
      </div>
      <span className="text-[11px] text-[#77736d]">Loading canvas strokes & live presence</span>
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

  // Private room authorization state
  const [isPrivateForbidden, setIsPrivateForbidden] = useState(false);
  const [accessTicket, setAccessTicket] = useState<string | null>(null);

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

        const { room: currentRoom, isPrivateForbidden: forbidden } = await fetchDrawingRoomById(
          roomId,
          userSession.user.id
        );

        if (forbidden) {
          if (!isCancelled) {
            setIsPrivateForbidden(true);
            setIsLoading(false);
          }
          return;
        }

        if (!currentRoom) {
          if (!isCancelled) {
            setIsLoading(false);
          }
          return;
        }

        const isOwner = currentRoom.owner === userSession.user.id;

        // Check if room is password-protected
        if (currentRoom.isPasswordProtected && !isOwner) {
          setIsLocked(true);
          // Withhold drawing payload from state until authenticated
          setRoom({ ...currentRoom, drawing: null });
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
        if (res.accessTicket) {
          setAccessTicket(res.accessTicket);
        }
        if (res.drawing && room) {
          setRoom({ ...room, drawing: res.drawing });
        }
        setIsLocked(false);
      } else {
        setPasswordError(true);
        setPasswordErrorMessage(res.message || "Incorrect passcode. Please try again.");
      }
    } catch {
      setPasswordError(true);
      setPasswordErrorMessage("Failed to verify passcode. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <RoomLoadingFallback />;
  }

  // 403 Forbidden Private Room Gate
  if (isPrivateForbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dotted-grid p-4 selection:bg-[#fdf0e7] selection:text-[#d95b35]">
        <div className="w-full max-w-md rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-8 text-[#171717] shadow-paper text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdf0e7] text-[#d95b35] mb-4 border border-[#fbd7c3]">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold tracking-tight">Private Board — Access Restricted</h2>
          <p className="mt-2 text-xs text-[#77736d] leading-relaxed">
            This collaborative whiteboard is set to private. You must be the room owner or hold an authorized cryptographic invite token to enter.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-semibold text-[#fffefb] hover:bg-[#2b2b2b] transition-all shadow-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#d95b35]" />
              <span>Back to Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Server-Verified Password Unlock Gate
  if (isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dotted-grid p-4 selection:bg-[#fdf0e7] selection:text-[#d95b35]">
        <div className="w-full max-w-md rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-7 text-[#171717] shadow-paper-modal">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#d95b35] mb-3 border border-[#e8e5df]">
            <KeyRound className="h-6 w-6" />
          </div>

          <h2 className="text-center text-lg font-bold">Passcode Protected Board</h2>
          <p className="mt-1 text-center text-xs text-[#77736d]">
            Enter the whiteboard passcode provided by the host to unlock the canvas and join live video.
          </p>

          {passwordError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fdf0e7] p-3 text-xs text-[#9c3e1e] border border-[#fbd7c3]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#d95b35]" />
              <span>{passwordErrorMessage || "Incorrect passcode. Please try again."}</span>
            </div>
          )}

          <form onSubmit={handleUnlockRoom} className="mt-5 space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-[#77736d]" />
              <input
                type="password"
                placeholder="Enter room passcode..."
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                autoFocus
                disabled={isVerifying}
                className="w-full rounded-xl border border-[#e8e5df] bg-white pl-10 pr-3.5 py-2.5 text-xs text-[#171717] placeholder:text-[#9c978f] focus:border-[#171717] focus:outline-hidden disabled:opacity-50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e8e5df] bg-[#ffffff] px-4 py-2.5 text-xs font-semibold text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Workspace</span>
              </Link>

              <button
                type="submit"
                disabled={isVerifying}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold text-[#fffefb] shadow-xs hover:bg-[#2b2b2b] transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Spinner className="h-3.5 w-3.5 text-[#d95b35]" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Unlock Canvas</span>
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-dotted-grid p-4 text-center">
        <h2 className="text-xl font-bold text-[#171717]">Whiteboard Not Found</h2>
        <p className="mt-1 text-xs text-[#77736d]">The board you are trying to access does not exist or was deleted.</p>
        <Link
          href="/dashboard"
          className="mt-4 rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-semibold text-[#fffefb] hover:bg-[#2b2b2b]"
        >
          Return to Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fffefb]">
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
        accessTicket={accessTicket}
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
