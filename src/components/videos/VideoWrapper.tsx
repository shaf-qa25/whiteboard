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
}

export default function VideoWrapper({
  children,
  userData,
  callId,
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

  const apiKey =
    process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY ||
    process.env.STREAM_CHAT_API_KEY;

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
        const { token, isConfigured } = await generateUserVideoToken(userData.id, callId);

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
      if (activeClient) {
        try {
          activeClient.disconnectUser();
        } catch {
          // ignore
        }
      }
    };
  }, [userData?.id, userData?.user_metadata?.userName, callId, apiKey]);

  // Handle local camera preview in fallback mode
  const toggleFallbackCamera = async () => {
    if (fallbackCamActive) {
      if (localStream) {
        localStream.getVideoTracks().forEach((t) => t.stop());
      }
      setFallbackCamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: fallbackMicActive,
        });
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
      <div className="flex h-40 w-full flex-col items-center justify-center rounded-xl bg-slate-900/60 p-4 text-slate-300">
        <Spinner className="h-6 w-6 text-blue-400 mb-2" />
        <span className="text-xs font-medium">Initializing video call...</span>
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
  const userColor = userData?.user_metadata?.userColor || "#3b82f6";

  return (
    <div className="flex flex-col gap-3 w-full rounded-2xl bg-slate-900/90 p-3.5 border border-slate-700/60 text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Video Call (Room Mode)</span>
        </div>
        <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          Direct Mode
        </span>
      </div>

      {/* Video Tile */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
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
            <span className="text-xs font-semibold text-slate-200">{userName}</span>
            <span className="text-[10px] text-slate-400">Camera is paused</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 z-10 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center gap-1">
          <span>{userName} (You)</span>
          {fallbackMicActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
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
              ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          title={fallbackCamActive ? "Turn camera off" : "Turn camera on"}
        >
          {fallbackCamActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-start gap-1.5 rounded-lg bg-slate-800/60 p-2 text-[10px] text-slate-400 border border-slate-700/40">
        <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
        <span>
          Stream Video SDK ready. Add <code className="text-slate-200 font-mono">STREAM_CHAT_API_KEY</code> in .env to activate multi-peer WebRTC calls.
        </span>
      </div>
    </div>
  );
}
