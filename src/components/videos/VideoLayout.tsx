"use client";

import React, { useEffect, useState } from "react";
import {
  CallingState,
  StreamTheme,
  useCallStateHooks,
  useCall,
} from "@stream-io/video-react-sdk";
import Spinner from "./Spinner";
import LocalParticipantVideo from "./LocalParticipantVideo";
import RemoteParticipantVideoList from "./RemoteParticipantVideoList";
import { Mic, MicOff, Video, VideoOff, ScreenShare, Users } from "lucide-react";

interface VideoLayoutProps {
  setParticipantCount?: (count: number) => void;
}

export default function VideoLayout({ setParticipantCount }: VideoLayoutProps) {
  const call = useCall();
  const {
    useCallCallingState,
    useParticipantCount,
    useLocalParticipant,
    useRemoteParticipants,
    useCameraState,
    useMicrophoneState,
  } = useCallStateHooks();

  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const participantCount = useParticipantCount();

  const { camera, isMute: isCameraMuted } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  useEffect(() => {
    if (setParticipantCount && typeof participantCount === "number") {
      setParticipantCount(participantCount);
    }
  }, [participantCount, setParticipantCount]);

  const toggleMic = async () => {
    if (microphone) {
      await microphone.toggle();
    }
  };

  const toggleCamera = async () => {
    if (camera) {
      await camera.toggle();
    }
  };

  const toggleScreenShare = async () => {
    if (call) {
      try {
        if (!isSharingScreen) {
          await call.screenShare.enable();
          setIsSharingScreen(true);
        } else {
          await call.screenShare.disable();
          setIsSharingScreen(false);
        }
      } catch (err) {
        console.warn("Screen share toggling error:", err);
      }
    }
  };

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-300">
        <Spinner className="h-6 w-6 text-blue-400 mb-2" />
        <span className="text-xs font-medium">Connecting to live call...</span>
        <span className="text-[10px] text-slate-400 mt-1 capitalize">State: {callingState}</span>
      </div>
    );
  }

  return (
    <StreamTheme>
      <div className="flex flex-col gap-3 w-full">
        {/* Header with Call Status */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Live Call</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Users className="h-3 w-3" />
            <span>{participantCount} in call</span>
          </div>
        </div>

        {/* Video Feeds */}
        <div className="flex flex-col gap-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
          <LocalParticipantVideo participant={localParticipant} />
          <RemoteParticipantVideoList participants={remoteParticipants} />
        </div>

        {/* Media Controls Bar */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 p-2 backdrop-blur-xs border border-slate-700/50 mt-1">
          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isMicMuted
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            }`}
            title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isCameraMuted
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            }`}
            title={isCameraMuted ? "Turn camera on" : "Turn camera off"}
          >
            {isCameraMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleScreenShare}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isSharingScreen
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            }`}
            title={isSharingScreen ? "Stop screen sharing" : "Share screen"}
          >
            <ScreenShare className="h-4 w-4" />
          </button>
        </div>
      </div>
    </StreamTheme>
  );
}
