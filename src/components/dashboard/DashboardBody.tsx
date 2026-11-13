"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Header from "./Header";
import { RoomCard, RoomCardSkeleton } from "./RoomCard";
import NewRoomModal from "./NewRoomModal";
import { 
  fetchUserDrawingRooms, 
  fetchPublicDrawingRooms, 
  deleteDrawingRoom, 
  DrawingRoom 
} from "@/services/drawing-room.service";
import { AppUserSession } from "@/services/user.service";
import { Search, Plus, PenTool, Globe, User, Sparkles } from "lucide-react";

interface DashboardBodyProps {
  session: AppUserSession | null;
}

type TabFilter = "all" | "my";

export default function DashboardBody({ session }: DashboardBodyProps) {
  const [rooms, setRooms] = useState<DrawingRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const userId = session?.user?.id;

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "my" && userId) {
        const userRooms = await fetchUserDrawingRooms(userId);
        setRooms(userRooms);
      } else {
        // Fetch all accessible public rooms + user's rooms
        const publicRooms = await fetchPublicDrawingRooms();
        if (userId) {
          const myRooms = await fetchUserDrawingRooms(userId);
          // Deduplicate
          const map = new Map<string, DrawingRoom>();
          [...myRooms, ...publicRooms].forEach((r) => map.set(r.id, r));
          setRooms(Array.from(map.values()));
        } else {
          setRooms(publicRooms);
        }
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, userId]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleDeleteRoom = async (roomId: string) => {
    if (!userId) return;
    const ok = await deleteDrawingRoom(roomId, userId);
    if (ok) {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    }
  };

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter((r) => r.name.toLowerCase().includes(q));
  }, [rooms, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Workspace Header */}
      <Header
        session={session}
        setShowCreateRoomModal={setShowCreateRoomModal}
        totalRoomsCount={rooms.length}
      />

      {/* Control Bar: Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8e5df] pb-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-[#171717] text-[#fffefb] shadow-xs"
                : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Discover Boards</span>
            <span className={`ml-1 rounded-full px-2 py-0.2 text-[10px] ${activeTab === "all" ? "bg-white/20 text-white" : "bg-[#faf8f3] text-[#77736d] border border-[#e8e5df]"}`}>
              {rooms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "my"
                ? "bg-[#171717] text-[#fffefb] shadow-xs"
                : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>My Boards</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9c978f]" />
          <input
            type="text"
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#e8e5df] bg-white pl-9 pr-3 py-2 text-xs text-[#171717] placeholder:text-[#9c978f] focus:border-[#171717] focus:outline-hidden transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Grid of Drawing Rooms */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              currentUserId={userId}
              onDeleteRoom={handleDeleteRoom}
            />
          ))}
        </div>
      ) : (
        /* Empty State on Dotted Paper */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e8e5df] bg-dotted-grid p-12 text-center shadow-paper">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35] mb-4">
            <PenTool className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#171717]">
            {searchQuery ? "No matching boards found" : "Your canvas is clean"}
          </h3>
          <p className="mt-1 text-xs text-[#77736d] max-w-sm leading-relaxed">
            {searchQuery
              ? `We couldn't find any boards matching "${searchQuery}". Try a different search keyword.`
              : "Create your first collaborative drawing room to sketch in real time with live presence and video calling."}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateRoomModal(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-semibold text-[#fffefb] hover:bg-[#2b2b2b] shadow-paper transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#d95b35]" />
            <span>Create New Board</span>
          </button>
        </div>
      )}

      {/* New Room Modal */}
      <NewRoomModal
        show={showCreateRoomModal}
        setShow={setShowCreateRoomModal}
        loadUserDrawingRooms={loadRooms}
        session={session}
      />
    </div>
  );
}
