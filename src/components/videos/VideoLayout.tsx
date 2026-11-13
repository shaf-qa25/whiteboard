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
      <div className="flex flex-col items-center justify-center p-6 text-[#77736d] bg-[#faf8f3] rounded-xl border border-[#e8e5df]">
        <Spinner className="h-5 w-5 text-[#d95b35] mb-2" />
        <span className="text-xs font-semibold text-[#171717]">Connecting to video call...</span>
        <span className="text-[10px] text-[#77736d] mt-1 capitalize">State: {callingState}</span>
      </div>
    );
  }

  return (
    <StreamTheme>
      <div className="flex flex-col gap-3 w-full">
        {/* Header with Call Status */}
        <div className="flex items-center justify-between px-1 text-xs text-[#77736d]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="font-semibold text-[#171717]">Live Call</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[#faf8f3] px-2 py-0.5 text-[10px] text-[#77736d] border border-[#e8e5df]">
            <Users className="h-3 w-3" />
            <span>{participantCount} in room</span>
          </div>
        </div>

        {/* Video Feeds */}
        <div className="flex flex-col gap-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
          <LocalParticipantVideo participant={localParticipant} />
          <RemoteParticipantVideoList participants={remoteParticipants} />
        </div>

        {/* Media Controls Bar */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#faf8f3] p-2 border border-[#e8e5df] shadow-xs mt-1">
          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isMicMuted
                ? "bg-[#fdf0e7] text-[#d95b35] border border-[#fbd7c3] hover:bg-[#fae3d5]"
                : "bg-white text-[#171717] border border-[#e8e5df] hover:bg-[#f6f4ee]"
            }`}
            title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isCameraMuted
                ? "bg-[#fdf0e7] text-[#d95b35] border border-[#fbd7c3] hover:bg-[#fae3d5]"
                : "bg-white text-[#171717] border border-[#e8e5df] hover:bg-[#f6f4ee]"
            }`}
            title={isCameraMuted ? "Turn camera on" : "Turn camera off"}
          >
            {isCameraMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleScreenShare}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isSharingScreen
                ? "bg-[#171717] text-[#fffefb]"
                : "bg-white text-[#77736d] border border-[#e8e5df] hover:text-[#171717] hover:bg-[#f6f4ee]"
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
