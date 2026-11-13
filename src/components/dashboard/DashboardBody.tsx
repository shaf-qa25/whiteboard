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
import { Search, Plus, Layers, Globe, User } from "lucide-react";

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
      {/* Hero Header */}
      <Header
        session={session}
        setShowCreateRoomModal={setShowCreateRoomModal}
        totalRoomsCount={rooms.length}
      />

      {/* Control Bar: Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Discover Boards</span>
            <span className="ml-1 rounded-full bg-slate-700/20 px-1.5 py-0.2 text-[10px]">
              {rooms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "my"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>My Boards</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 shadow-2xs"
          />
        </div>
      </div>

      {/* Grid of Drawing Rooms */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? "No matching boards found" : "No whiteboard rooms yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `We couldn't find any boards matching "${searchQuery}". Try a different search keyword.`
              : "Create your first collaborative drawing room to sketch in real-time with live video."}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateRoomModal(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Board</span>
          </button>
        </div>
      )}

      {/* Modal */}
      <NewRoomModal
        show={showCreateRoomModal}
        setShow={setShowCreateRoomModal}
        loadUserDrawingRooms={loadRooms}
        session={session}
      />
    </div>
  );
}
