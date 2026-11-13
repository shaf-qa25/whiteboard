"use client";

import React from "react";
import { ParticipantView, StreamVideoParticipant } from "@stream-io/video-react-sdk";
import Spinner from "./Spinner";

const LocalVideoPlaceholder = () => (
  <div className="absolute inset-0 bg-slate-800 text-slate-300 flex flex-col items-center justify-center p-2 rounded-xl text-center">
    <Spinner className="h-4 w-4 text-blue-400 mb-1" />
    <span className="text-[11px] font-medium text-slate-400">Starting camera...</span>
  </div>
);

export default function LocalParticipantVideo({
  participant,
}: {
  participant?: StreamVideoParticipant;
}) {
  if (!participant) return null;

  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-md">
      <ParticipantView
        participant={participant}
        VideoPlaceholder={LocalVideoPlaceholder}
      />
      <div className="absolute bottom-2 left-2 z-10 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center gap-1">
        <span>You</span>
        {participant.isSpeaking && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}
