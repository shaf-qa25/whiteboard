"use client";

import React from "react";
import { ParticipantView, StreamVideoParticipant } from "@stream-io/video-react-sdk";
import Spinner from "./Spinner";

const RemoteVideoPlaceholder = ({
  participant,
}: {
  participant?: StreamVideoParticipant;
}) => (
  <div className="absolute inset-0 bg-slate-800 text-slate-300 flex flex-col items-center justify-center p-2 rounded-xl text-center">
    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white mb-1">
      {participant?.name?.charAt(0).toUpperCase() || "P"}
    </div>
    <span className="text-[11px] font-medium text-slate-300 capitalize">
      {participant?.name || "Participant"}
    </span>
    <span className="text-[9px] text-slate-400">Connecting stream...</span>
  </div>
);

export default function RemoteParticipantVideoList({
  participants,
}: {
  participants: StreamVideoParticipant[];
}) {
  if (!participants || participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/60 p-4 text-center text-slate-400 bg-slate-800/30">
        <span className="text-xs">No other peers connected to video yet</span>
        <span className="text-[10px] text-slate-500 mt-0.5">Share link to call together</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {participants.map((participant) => (
        <div
          key={participant.sessionId}
          className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-md"
        >
          <ParticipantView
            participant={participant}
            VideoPlaceholder={() => <RemoteVideoPlaceholder participant={participant} />}
          />
          <div className="absolute bottom-2 left-2 z-10 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center gap-1">
            <span className="capitalize">{participant.name || "Guest"}</span>
            {participant.isSpeaking && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
