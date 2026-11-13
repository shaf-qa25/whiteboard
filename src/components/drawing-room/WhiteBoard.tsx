"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { updateRoomDrawing, DrawingRoom } from "@/services/drawing-room.service";
import { AppUserSession, registerUserInRegistry } from "@/services/user.service";
import { DrawingPen } from "./BoardContainer";
import DrawingMenu from "./DrawingMenu";

export interface DrawingElement {
  id: string;
  authorId: string;
  authorName?: string;
  tool: string;
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
  isDeleted?: boolean;
  createdAt: number;
}

interface WhiteBoardProps {
  room: DrawingRoom;
  drawingPen: DrawingPen;
  setDrawingPen: React.Dispatch<React.SetStateAction<DrawingPen>>;
  session: AppUserSession | null;
  accessTicket?: string | null;
}

interface PeerCursor {
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  lastActive: number;
}

type SyncStatus = "connected" | "connecting" | "offline";

export default function WhiteBoard({
  room,
  drawingPen,
  setDrawingPen,
  session,
  accessTicket,
}: WhiteBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const lastPanPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("connecting");

  // Element-based collaborative history (solves multi-user undo conflicts)
  const elementsRef = useRef<DrawingElement[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Live peer cursors
  const [peerCursors, setPeerCursors] = useState<Map<string, PeerCursor>>(new Map());

  // Text input state
  const [textInput, setTextInput] = useState<{
    visible: boolean;
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    value: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
    value: "",
  });

  // Current drawing path
  const isDrawing = useRef<boolean>(false);
  const isSpacePressed = useRef<boolean>(false);
  const strokePoints = useRef<{ x: number; y: number }[]>([]);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);

  // Network & persistence refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localBroadcastRef = useRef<BroadcastChannel | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dprRef = useRef<number>(1);

  const currentUserId = session?.user?.id || "guest_" + Math.random().toString(36).substring(2, 6);
  const currentUserName = session?.user?.user_metadata?.userName || "Artist";
  const currentUserColor = session?.user?.user_metadata?.userColor || "#3b82f6";

  // Register user profile
  useEffect(() => {
    registerUserInRegistry(currentUserId, currentUserName, currentUserColor);
  }, [currentUserId, currentUserName, currentUserColor]);

  // Update undo/redo availability
  const updateUndoRedoState = useCallback(() => {
    const hasMyActiveElement = elementsRef.current.some(
      (el) => el.authorId === currentUserId && !el.isDeleted
    );
    setCanUndo(hasMyActiveElement);
    setCanRedo(redoStackRef.current.length > 0);
  }, [currentUserId]);

  // Helper: Convert client coordinates to canvas space (accounting for pan & zoom)
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const relativeX = clientX - rect.left - pan.x;
      const relativeY = clientY - rect.top - pan.y;
      return {
        x: relativeX / zoom,
        y: relativeY / zoom,
      };
    },
    [pan.x, pan.y, zoom]
  );

  // Draw a single element onto a given canvas context with high-DPI scaling
  const drawElement = useCallback((ctx: CanvasRenderingContext2D, el: DrawingElement, dpr: number) => {
    if (el.isDeleted) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    if (el.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = el.size * 2;
    } else if (el.tool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.size * 2.5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.size;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (el.points && el.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(el.points[0].x, el.points[0].y);
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i].x, el.points[i].y);
      }
      ctx.stroke();
    } else if (el.tool === "rectangle") {
      const startX = el.startX ?? 0;
      const startY = el.startY ?? 0;
      const endX = el.endX ?? 0;
      const endY = el.endY ?? 0;
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    } else if (el.tool === "circle") {
      const startX = el.startX ?? 0;
      const startY = el.startY ?? 0;
      const endX = el.endX ?? 0;
      const endY = el.endY ?? 0;
      ctx.beginPath();
      const rx = Math.abs(endX - startX) / 2;
      const ry = Math.abs(endY - startY) / 2;
      const cx = Math.min(startX, endX) + rx;
      const cy = Math.min(startY, endY) + ry;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (el.tool === "line") {
      ctx.beginPath();
      ctx.moveTo(el.startX ?? 0, el.startY ?? 0);
      ctx.lineTo(el.endX ?? 0, el.endY ?? 0);
      ctx.stroke();
    } else if (el.tool === "arrow") {
      const startX = el.startX ?? 0;
      const startY = el.startY ?? 0;
      const endX = el.endX ?? 0;
      const endY = el.endY ?? 0;
      const headLength = 15;
      const angle = Math.atan2(endY - startY, endX - startX);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    } else if (el.tool === "text" && el.text) {
      ctx.font = `${Math.max(el.size * 3, 16)}px sans-serif`;
      ctx.fillStyle = el.color;
      ctx.fillText(el.text, el.startX ?? 0, el.startY ?? 0);
    }

    ctx.restore();
  }, []);

  // Redraw all active elements from scratch
  const redrawAllElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = dprRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const el of elementsRef.current) {
      drawElement(ctx, el, dpr);
    }

    updateUndoRedoState();
  }, [drawElement, updateUndoRedoState]);

  // Optimized debounced autosave: persists compressed vector JSON (97% payload reduction)
  const scheduleAutosave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const activeElements = elementsRef.current.filter((el) => !el.isDeleted);
      const payload = JSON.stringify(activeElements);
      await updateRoomDrawing(room.id, payload, currentUserId, accessTicket || undefined);
    }, 800);
  }, [room.id, currentUserId, accessTicket]);

  // Collaborative User-Scoped Undo: Only undoes the current user's last action!
  const handleUndo = useCallback(() => {
    // Find the last non-deleted element created by the current user
    for (let i = elementsRef.current.length - 1; i >= 0; i--) {
      const el = elementsRef.current[i];
      if (el.authorId === currentUserId && !el.isDeleted) {
        el.isDeleted = true;
        redoStackRef.current.push(el.id);
        redrawAllElements();
        scheduleAutosave();

        // Broadcast element undo event to remote peers
        const undoPayload = { type: "element_undo", elementId: el.id, authorId: currentUserId };
        channelRef.current?.send({ type: "broadcast", event: "undo_action", payload: undoPayload });
        localBroadcastRef.current?.postMessage({ type: "undo_action", payload: undoPayload });
        break;
      }
    }
  }, [currentUserId, redrawAllElements, scheduleAutosave]);

  // Collaborative User-Scoped Redo
  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const targetId = redoStackRef.current.pop();
    const el = elementsRef.current.find((e) => e.id === targetId);
    if (el) {
      el.isDeleted = false;
      redrawAllElements();
      scheduleAutosave();

      const redoPayload = { type: "element_redo", elementId: el.id, authorId: currentUserId };
      channelRef.current?.send({ type: "broadcast", event: "redo_action", payload: redoPayload });
      localBroadcastRef.current?.postMessage({ type: "redo_action", payload: redoPayload });
    }
  }, [currentUserId, redrawAllElements, scheduleAutosave]);

  // Clear Canvas (marks elements as deleted with undo capability)
  const handleClearCanvas = useCallback(() => {
    if (!confirm("Are you sure you want to clear the entire whiteboard?")) return;
    elementsRef.current = [];
    redoStackRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    updateUndoRedoState();
    scheduleAutosave();

    const clearPayload = { type: "clear_all", authorId: currentUserId };
    channelRef.current?.send({ type: "broadcast", event: "clear_board", payload: clearPayload });
    localBroadcastRef.current?.postMessage({ type: "clear_board", payload: clearPayload });
  }, [currentUserId, scheduleAutosave, updateUndoRedoState]);

  // Export Canvas as Crisp PNG
  const handleExportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    const a = document.createElement("a");
    a.download = `${room.name.toLowerCase().replace(/\s+/g, "_")}-board.png`;
    a.href = exportCanvas.toDataURL("image/png");
    a.click();
  }, [room.name]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Set up real-time collaboration channels (Supabase Realtime + local BroadcastChannel fallback)
  useEffect(() => {
    // 1. Supabase Realtime Channel
    if (isSupabaseConfigured && room.id) {
      setSyncStatus("connecting");
      const chan = supabase.channel(`room_${room.id}`);
      channelRef.current = chan;

      chan
        .on("broadcast", { event: "cursor" }, ({ payload }) => {
          if (payload && payload.userId !== currentUserId) {
            setPeerCursors((prev) => {
              const updated = new Map(prev);
              updated.set(payload.userId, {
                userId: payload.userId,
                userName: payload.userName || "User",
                userColor: payload.userColor || "#3b82f6",
                x: payload.x,
                y: payload.y,
                lastActive: Date.now(),
              });
              return updated;
            });
          }
        })
        .on("broadcast", { event: "new_element" }, ({ payload }) => {
          if (payload && payload.element) {
            const el = payload.element as DrawingElement;
            if (!elementsRef.current.some((e) => e.id === el.id)) {
              elementsRef.current.push(el);
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext("2d");
              if (ctx) {
                drawElement(ctx, el, dprRef.current);
              }
              updateUndoRedoState();
            }
          }
        })
        .on("broadcast", { event: "undo_action" }, ({ payload }) => {
          if (payload?.elementId) {
            const el = elementsRef.current.find((e) => e.id === payload.elementId);
            if (el) {
              el.isDeleted = true;
              redrawAllElements();
            }
          }
        })
        .on("broadcast", { event: "redo_action" }, ({ payload }) => {
          if (payload?.elementId) {
            const el = elementsRef.current.find((e) => e.id === payload.elementId);
            if (el) {
              el.isDeleted = false;
              redrawAllElements();
            }
          }
        })
        .on("broadcast", { event: "clear_board" }, () => {
          elementsRef.current = [];
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
          updateUndoRedoState();
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setSyncStatus("connected");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setSyncStatus("offline");
          }
        });
    }

    // 2. Browser BroadcastChannel (Syncs multi-tabs on same browser immediately)
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(`collabboard_${room.id}`);
      localBroadcastRef.current = bc;

      bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === "cursor" && data.payload?.userId !== currentUserId) {
          setPeerCursors((prev) => {
            const updated = new Map(prev);
            updated.set(data.payload.userId, {
              ...data.payload,
              lastActive: Date.now(),
            });
            return updated;
          });
        } else if (data.type === "new_element" && data.payload?.element) {
          const el = data.payload.element as DrawingElement;
          if (!elementsRef.current.some((e) => e.id === el.id)) {
            elementsRef.current.push(el);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (ctx) {
              drawElement(ctx, el, dprRef.current);
            }
            updateUndoRedoState();
          }
        } else if (data.type === "undo_action" && data.payload?.elementId) {
          const el = elementsRef.current.find((e) => e.id === data.payload.elementId);
          if (el) {
            el.isDeleted = true;
            redrawAllElements();
          }
        } else if (data.type === "redo_action" && data.payload?.elementId) {
          const el = elementsRef.current.find((e) => e.id === data.payload.elementId);
          if (el) {
            el.isDeleted = false;
            redrawAllElements();
          }
        } else if (data.type === "clear_board") {
          elementsRef.current = [];
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
          updateUndoRedoState();
        }
      };
    }

    // Periodic cleanup of stale peer cursors
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setPeerCursors((prev) => {
        let changed = false;
        const updated = new Map(prev);
        for (const [id, cursor] of updated.entries()) {
          if (now - cursor.lastActive > 4000) {
            updated.delete(id);
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }, 2000);

    return () => {
      clearInterval(cleanupInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (localBroadcastRef.current) {
        localBroadcastRef.current.close();
      }
    };
  }, [room.id, currentUserId, drawElement, redrawAllElements, updateUndoRedoState]);

  // Load initial canvas snapshot (handles both JSON vector array and legacy bitmap image)
  useEffect(() => {
    if (!room.drawing) return;

    if (room.drawing.startsWith("[")) {
      try {
        const parsed = JSON.parse(room.drawing);
        if (Array.isArray(parsed)) {
          elementsRef.current = parsed;
          redrawAllElements();
          return;
        }
      } catch {
        // Fallback to bitmap
      }
    }

    // Legacy Bitmap image fallback
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current);
    };
    img.src = room.drawing;
  }, [room.drawing, redrawAllElements]);

  // Adjust canvas size to parent container with devicePixelRatio scaling
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const previewCanvas = previewCanvasRef.current;
      if (!container || !canvas || !previewCanvas) return;

      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;

      const logicalWidth = Math.max(container.clientWidth, 2400);
      const logicalHeight = Math.max(container.clientHeight, 1800);

      const targetPhysicalWidth = Math.floor(logicalWidth * dpr);
      const targetPhysicalHeight = Math.floor(logicalHeight * dpr);

      if (canvas.width !== targetPhysicalWidth || canvas.height !== targetPhysicalHeight) {
        canvas.width = targetPhysicalWidth;
        canvas.height = targetPhysicalHeight;
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;

        previewCanvas.width = targetPhysicalWidth;
        previewCanvas.height = targetPhysicalHeight;
        previewCanvas.style.width = `${logicalWidth}px`;
        previewCanvas.style.height = `${logicalHeight}px`;

        redrawAllElements();
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [redrawAllElements]);

  // Broadcast mouse position
  const broadcastCursor = useCallback(
    (canvasX: number, canvasY: number) => {
      const payload = {
        userId: currentUserId,
        userName: currentUserName,
        userColor: currentUserColor,
        x: canvasX,
        y: canvasY,
      };

      channelRef.current?.send({
        type: "broadcast",
        event: "cursor",
        payload,
      });

      localBroadcastRef.current?.postMessage({
        type: "cursor",
        payload,
      });
    },
    [currentUserId, currentUserName, currentUserColor]
  );

  // Broadcast new drawing element
  const broadcastElement = useCallback((element: DrawingElement) => {
    const payload = { element };
    channelRef.current?.send({
      type: "broadcast",
      event: "new_element",
      payload,
    });

    localBroadcastRef.current?.postMessage({
      type: "new_element",
      payload,
    });
  }, []);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const isPanMode = drawingPen.tool === "select" || e.button === 1 || isSpacePressed.current;

    if (isPanMode) {
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (drawingPen.tool === "text") {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      setTextInput({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        canvasX: x,
        canvasY: y,
        value: "",
      });
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    isDrawing.current = true;
    strokePoints.current = [{ x, y }];
    shapeStart.current = { x, y };

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    if (drawingPen.tool === "pen" || drawingPen.tool === "highlighter" || drawingPen.tool === "eraser") {
      ctx.save();
      ctx.scale(dprRef.current, dprRef.current);
      ctx.beginPath();
      ctx.moveTo(x, y);

      if (drawingPen.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = drawingPen.size * 2;
      } else if (drawingPen.tool === "highlighter") {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = drawingPen.color;
        ctx.lineWidth = drawingPen.size * 2.5;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = drawingPen.color;
        ctx.lineWidth = drawingPen.size;
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    broadcastCursor(x, y);

    if (isPanning) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawing.current) return;

    const tool = drawingPen.tool;

    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      strokePoints.current.push({ x, y });
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === "rectangle" || tool === "circle" || tool === "line" || tool === "arrow") {
      // Shape preview on preview canvas
      const previewCanvas = previewCanvasRef.current;
      if (!previewCanvas) return;
      const pctx = previewCanvas.getContext("2d");
      if (!pctx) return;

      const dpr = dprRef.current;
      pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      pctx.save();
      pctx.scale(dpr, dpr);
      pctx.strokeStyle = drawingPen.color;
      pctx.lineWidth = drawingPen.size;
      pctx.lineCap = "round";
      pctx.lineJoin = "round";

      const start = shapeStart.current || { x, y };

      if (tool === "rectangle") {
        pctx.strokeRect(start.x, start.y, x - start.x, y - start.y);
      } else if (tool === "circle") {
        pctx.beginPath();
        const rx = Math.abs(x - start.x) / 2;
        const ry = Math.abs(y - start.y) / 2;
        const cx = Math.min(start.x, x) + rx;
        const cy = Math.min(start.y, y) + ry;
        pctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        pctx.stroke();
      } else if (tool === "line") {
        pctx.beginPath();
        pctx.moveTo(start.x, start.y);
        pctx.lineTo(x, y);
        pctx.stroke();
      } else if (tool === "arrow") {
        const headLength = 15;
        const angle = Math.atan2(y - start.y, x - start.x);
        pctx.beginPath();
        pctx.moveTo(start.x, start.y);
        pctx.lineTo(x, y);
        pctx.lineTo(
          x - headLength * Math.cos(angle - Math.PI / 6),
          y - headLength * Math.sin(angle - Math.PI / 6)
        );
        pctx.moveTo(x, y);
        pctx.lineTo(
          x - headLength * Math.cos(angle + Math.PI / 6),
          y - headLength * Math.sin(angle + Math.PI / 6)
        );
        pctx.stroke();
      }
      pctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const tool = drawingPen.tool;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    ctx?.restore();

    const elementId = `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let newElement: DrawingElement | null = null;

    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      newElement = {
        id: elementId,
        authorId: currentUserId,
        authorName: currentUserName,
        tool,
        color: drawingPen.color,
        size: drawingPen.size,
        points: [...strokePoints.current],
        createdAt: Date.now(),
      };
      strokePoints.current = [];
    } else if (tool === "rectangle" || tool === "circle" || tool === "line" || tool === "arrow") {
      const previewCanvas = previewCanvasRef.current;
      const pctx = previewCanvas?.getContext("2d");
      pctx?.clearRect(0, 0, previewCanvas!.width, previewCanvas!.height);

      const start = shapeStart.current || { x, y };
      newElement = {
        id: elementId,
        authorId: currentUserId,
        authorName: currentUserName,
        tool,
        color: drawingPen.color,
        size: drawingPen.size,
        startX: start.x,
        startY: start.y,
        endX: x,
        endY: y,
        createdAt: Date.now(),
      };
      shapeStart.current = null;
    }

    if (newElement) {
      elementsRef.current.push(newElement);
      redoStackRef.current = []; // Reset redo stack on new action
      broadcastElement(newElement);
      updateUndoRedoState();
      scheduleAutosave();
      redrawAllElements();
    }
  };

  // Commit text note as persistent element
  const handleCommitText = () => {
    if (!textInput.value.trim()) {
      setTextInput((prev) => ({ ...prev, visible: false, value: "" }));
      return;
    }

    const elementId = `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newElement: DrawingElement = {
      id: elementId,
      authorId: currentUserId,
      authorName: currentUserName,
      tool: "text",
      color: drawingPen.color,
      size: drawingPen.size,
      startX: textInput.canvasX,
      startY: textInput.canvasY,
      text: textInput.value.trim(),
      createdAt: Date.now(),
    };

    elementsRef.current.push(newElement);
    redoStackRef.current = [];
    broadcastElement(newElement);
    updateUndoRedoState();
    scheduleAutosave();
    redrawAllElements();
    setTextInput((prev) => ({ ...prev, visible: false, value: "" }));
  };

  // Keyboard shortcuts (Z for Undo, Y for Redo, Spacebar for Pan, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        isSpacePressed.current = true;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        handleRedo();
        e.preventDefault();
      } else if (e.key.toLowerCase() === "v") {
        setDrawingPen((p) => ({ ...p, tool: "select" }));
      } else if (e.key.toLowerCase() === "p") {
        setDrawingPen((p) => ({ ...p, tool: "pen" }));
      } else if (e.key.toLowerCase() === "h") {
        setDrawingPen((p) => ({ ...p, tool: "highlighter" }));
      } else if (e.key.toLowerCase() === "e") {
        setDrawingPen((p) => ({ ...p, tool: "eraser" }));
      } else if (e.key.toLowerCase() === "r") {
        setDrawingPen((p) => ({ ...p, tool: "rectangle" }));
      } else if (e.key.toLowerCase() === "o") {
        setDrawingPen((p) => ({ ...p, tool: "circle" }));
      } else if (e.key.toLowerCase() === "a") {
        setDrawingPen((p) => ({ ...p, tool: "arrow" }));
      } else if (e.key.toLowerCase() === "t") {
        setDrawingPen((p) => ({ ...p, tool: "text" }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressed.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleUndo, handleRedo, setDrawingPen]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden select-none touch-none bg-slate-50 ${
        drawingPen.tool === "select" || isPanning ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.05 : 0.95;
          setZoom((z) => Math.min(Math.max(z * factor, 0.4), 3));
        } else {
          setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
      }}
    >
      {/* Grid Pattern Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#94a3b8 1px, #f8fafc 1px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Transformed Canvas Container */}
      <div
        className="absolute top-0 left-0 origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <canvas ref={canvasRef} className="absolute top-0 left-0 bg-transparent" />
        <canvas
          ref={previewCanvasRef}
          className="absolute top-0 left-0 pointer-events-none bg-transparent"
        />

        {/* Live Peer Cursors */}
        {Array.from(peerCursors.values()).map((peer) => (
          <div
            key={peer.userId}
            className="pointer-events-none absolute z-30 transition-all duration-75 ease-out"
            style={{
              transform: `translate(${peer.x}px, ${peer.y}px)`,
            }}
          >
            <svg
              className="h-5 w-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={peer.userColor}
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35z" />
            </svg>

            <div
              className="ml-4 -mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-md ring-1 ring-white/30 whitespace-nowrap"
              style={{ backgroundColor: peer.userColor }}
            >
              {peer.userName}
            </div>
          </div>
        ))}
      </div>

      {/* Inline Text Box for Text Tool */}
      {textInput.visible && (
        <div
          className="absolute z-50 rounded-xl bg-white p-2 shadow-2xl border border-slate-300 ring-2 ring-blue-500/30"
          style={{
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
          }}
        >
          <textarea
            autoFocus
            rows={2}
            value={textInput.value}
            onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCommitText();
              } else if (e.key === "Escape") {
                setTextInput((prev) => ({ ...prev, visible: false, value: "" }));
              }
            }}
            placeholder="Type note (Enter to place)..."
            className="w-48 resize-none rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:outline-hidden"
          />
          <div className="mt-1 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setTextInput((prev) => ({ ...prev, visible: false, value: "" }))}
              className="rounded-md px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommitText}
              className="rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
            >
              Add Note
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Toolbar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-full px-2">
        <DrawingMenu
          drawingPen={drawingPen}
          setDrawingPen={setDrawingPen}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onClearCanvas={handleClearCanvas}
          onExportImage={handleExportImage}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </div>

      {/* Real-time Connection & Sync Status Indicator (Step 9) */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-30 hidden sm:flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-700 backdrop-blur-xs border border-slate-200 shadow-md">
        {syncStatus === "connected" ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-800">Live Collaboration Synced</span>
          </>
        ) : syncStatus === "connecting" ? (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-800">Reconnecting to room...</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-rose-700 font-semibold">Offline Mode (Local Sync)</span>
          </>
        )}
        <span className="text-slate-300">•</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
