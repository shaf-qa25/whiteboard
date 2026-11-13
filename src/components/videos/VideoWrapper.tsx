"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
} from "@stream-io/video-react-sdk";
import { generateUserVideoToken } from "@/services/user.service";
import Spinner from "./Spinner";
import { Video, Mic, MicOff, VideoOff, Info } from "lucide-react";

interface VideoWrapperProps {
  children: React.ReactNode;
  userData: {
    id: string;
    email?: string;
    user_metadata?: {
      userName?: string;
      userColor?: string;
    };
  } | null;
  callId: string;
  accessTicket?: string | null;
}

export default function VideoWrapper({
  children,
  userData,
  callId,
  accessTicket,
}: VideoWrapperProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFallbackMode, setUseFallbackMode] = useState(false);

  // Fallback state for local media preview when Stream credentials are not yet configured
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [fallbackCamActive, setFallbackCamActive] = useState(false);
  const [fallbackMicActive, setFallbackMicActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY ||
    process.env.STREAM_CHAT_API_KEY;

  // Ensure local media tracks are stopped when component unmounts (Step 6 - FUNC-02)
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let activeClient: StreamVideoClient | null = null;
    let isCancelled = false;

    const initVideoCall = async () => {
      if (!userData?.id || !callId) {
        setLoading(false);
        return;
      }

      // Check if Stream keys are provided
      if (!apiKey || apiKey.includes("placeholder")) {
        setUseFallbackMode(true);
        setLoading(false);
        return;
      }

      try {
        const { token, isConfigured } = await generateUserVideoToken(userData.id, callId, accessTicket);

        if (!isConfigured || !token) {
          if (!isCancelled) {
            setUseFallbackMode(true);
            setLoading(false);
          }
          return;
        }

        const userName = userData.user_metadata?.userName || "Participant";
        const user: User = {
          id: userData.id,
          name: userName,
          image: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
            userName
          )}`,
        };

        const videoClient = new StreamVideoClient({
          apiKey,
          user,
          token,
        });

        activeClient = videoClient;

        if (!isCancelled) {
          setClient(videoClient);
          const callInstance = videoClient.call("default", callId);
          callRef.current = callInstance;
          await callInstance.join({ create: true });
          setCall(callInstance);
          setLoading(false);
        }
      } catch (error) {
        console.warn("Could not connect to Stream Video SDK, using fallback preview mode:", error);
        if (!isCancelled) {
          setUseFallbackMode(true);
          setLoading(false);
        }
      }
    };

    initVideoCall();

    return () => {
      isCancelled = true;
      // Step 6 (FUNC-02): Cleanly leave the Stream call to release remote session and local camera/mic
      if (callRef.current) {
        try {
          callRef.current.leave().catch((err: unknown) => {
            console.warn("Failed to leave Stream call cleanly:", err);
          });
          callRef.current = null;
        } catch (err) {
          console.warn("Exception leaving call:", err);
        }
      }

      if (activeClient) {
        try {
          activeClient.disconnectUser().catch((err: unknown) => {
            console.warn("Failed to disconnect Stream video client:", err);
          });
        } catch {
          // ignore
        }
      }
    };
  }, [userData?.id, userData?.user_metadata?.userName, callId, apiKey, accessTicket]);

  // Handle local camera preview in fallback mode
  const toggleFallbackCamera = async () => {
    if (fallbackCamActive) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);
      setFallbackCamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: fallbackMicActive,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setFallbackCamActive(true);
      } catch (err) {
        console.warn("Camera access denied or unavailable:", err);
      }
    }
  };

  const toggleFallbackMic = () => {
    setFallbackMicActive(!fallbackMicActive);
  };

  if (loading) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center rounded-2xl bg-[#faf8f3] border border-[#e8e5df] p-4 text-[#77736d]">
        <Spinner className="h-5 w-5 text-[#d95b35] mb-2" />
        <span className="text-xs font-semibold text-[#171717]">Connecting to video call...</span>
      </div>
    );
  }

  // Live Stream SDK connected
  if (client && call) {
    return (
      <StreamVideo client={client}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <StreamCall call={call as any}>{children}</StreamCall>
      </StreamVideo>
    );
  }

  // Graceful Fallback / Demo Mode UI when Stream keys are not yet configured in .env
  const userName = userData?.user_metadata?.userName || "You";
  const userColor = userData?.user_metadata?.userColor || "#d95b35";

  return (
    <div className="flex flex-col gap-3 w-full rounded-2xl bg-white p-3.5 border border-[#e8e5df] text-[#171717] shadow-paper">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#171717]">
          <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
          <span>Local Video Preview</span>
        </div>
        <span className="text-[10px] font-medium text-[#d95b35] bg-[#fdf0e7] px-2 py-0.5 rounded-full border border-[#fbd7c3]">
          Camera Test
        </span>
      </div>

      {/* Video Tile */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#171717] border border-[#e8e5df] flex items-center justify-center">
        {fallbackCamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-center">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ring-2 ring-white/20 mb-2"
              style={{ backgroundColor: userColor }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-white">{userName}</span>
            <span className="text-[10px] text-slate-400">Camera preview off</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 z-10 rounded-md bg-[#171717]/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center gap-1 border border-white/10">
          <span>{userName} (You)</span>
          {fallbackMicActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleFallbackMic}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
            !fallbackMicActive
              ? "bg-[#fdf0e7] text-[#d95b35] border border-[#fbd7c3]"
              : "bg-white text-[#171717] border border-[#e8e5df]"
          }`}
          title={fallbackMicActive ? "Mute microphone" : "Unmute microphone"}
        >
          {fallbackMicActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={toggleFallbackCamera}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
            !fallbackCamActive
              ? "bg-white text-[#77736d] border border-[#e8e5df] hover:text-[#171717]"
              : "bg-[#171717] text-[#fffefb]"
          }`}
          title={fallbackCamActive ? "Turn camera off" : "Turn camera on"}
        >
          {fallbackCamActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-start gap-1.5 rounded-lg bg-[#faf8f3] p-2 text-[10px] text-[#77736d] border border-[#e8e5df]">
        <Info className="h-3.5 w-3.5 text-[#d95b35] shrink-0 mt-0.5" />
        <span>
          Local hardware preview active. Full WebRTC live video syncs automatically when Stream credentials are connected.
        </span>
      </div>
    </div>
  );
}
