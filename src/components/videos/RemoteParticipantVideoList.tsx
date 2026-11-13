"use client";

import React from "react";
import { ParticipantView, StreamVideoParticipant } from "@stream-io/video-react-sdk";
import Spinner from "./Spinner";

const RemoteVideoPlaceholder = ({
  participant,
}: {
  participant?: StreamVideoParticipant;
}) => (
  <div className="absolute inset-0 bg-[#171717] text-[#fffefb] flex flex-col items-center justify-center p-2 rounded-xl text-center">
    <div className="h-8 w-8 rounded-full bg-[#2b2b2b] flex items-center justify-center text-xs font-bold text-[#fffefb] mb-1">
      {participant?.name?.charAt(0).toUpperCase() || "P"}
    </div>
    <span className="text-[11px] font-medium text-[#faf8f3] capitalize">
      {participant?.name || "Participant"}
    </span>
    <span className="text-[9px] text-[#77736d]">Connecting stream...</span>
  </div>
);

export default function RemoteParticipantVideoList({
  participants,
}: {
  participants: StreamVideoParticipant[];
}) {
  if (!participants || participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e8e5df] p-4 text-center text-[#77736d] bg-[#faf8f3]">
        <span className="text-xs font-medium text-[#171717]">No peers in video yet</span>
        <span className="text-[10px] text-[#77736d] mt-0.5">Share board link to collaborate & talk</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {participants.map((participant) => (
        <div
          key={participant.sessionId}
          className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#e8e5df] bg-[#171717] shadow-xs"
        >
          <ParticipantView
            participant={participant}
            VideoPlaceholder={() => <RemoteVideoPlaceholder participant={participant} />}
          />
          <div className="absolute bottom-2 left-2 z-10 rounded-md bg-[#171717]/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center gap-1 border border-white/10">
            <span className="capitalize">{participant.name || "Guest"}</span>
            {participant.isSpeaking && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
