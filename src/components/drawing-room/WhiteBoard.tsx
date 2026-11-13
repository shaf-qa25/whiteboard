"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { updateRoomDrawing, DrawingRoom } from "@/services/drawing-room.service";
import { AppUserSession, registerUserInRegistry } from "@/services/user.service";
import { DrawingPen } from "./BoardContainer";
import DrawingMenu from "./DrawingMenu";

interface WhiteBoardProps {
  room: DrawingRoom;
  drawingPen: DrawingPen;
  setDrawingPen: React.Dispatch<React.SetStateAction<DrawingPen>>;
  session: AppUserSession | null;
}

interface PeerCursor {
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  lastActive: number;
}

interface StrokePayload {
  type: "stroke" | "shape" | "clear";
  tool: string;
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
  base64?: string;
}

export default function WhiteBoard({
  room,
  drawingPen,
  setDrawingPen,
  session,
}: WhiteBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const lastPanPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Undo / Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

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

  const currentUserId = session?.user?.id || "guest_" + Math.random().toString(36).substring(2, 6);
  const currentUserName = session?.user?.user_metadata?.userName || "Artist";
  const currentUserColor = session?.user?.user_metadata?.userColor || "#3b82f6";

  // Register user profile
  useEffect(() => {
    registerUserInRegistry(currentUserId, currentUserName, currentUserColor);
  }, [currentUserId, currentUserName, currentUserColor]);

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

  // Save state to Undo history
  const pushToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, dataUrl];
    });
    setHistoryIndex((prev) => prev + 1);

    // Schedule debounced database update
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateRoomDrawing(room.id, dataUrl);
    }, 800);
  }, [historyIndex, room.id]);

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) {
      if (historyIndex === 0) {
        // Clear canvas if undoing first stroke
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        setHistoryIndex(-1);
      }
      return;
    }
    const targetUrl = history[historyIndex - 1];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(historyIndex - 1);
      updateRoomDrawing(room.id, targetUrl);
    };
    img.src = targetUrl;
  }, [history, historyIndex, room.id]);

  // Handle Redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const targetUrl = history[historyIndex + 1];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(historyIndex + 1);
      updateRoomDrawing(room.id, targetUrl);
    };
    img.src = targetUrl;
  }, [history, historyIndex, room.id]);

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    if (!confirm("Are you sure you want to clear the entire whiteboard?")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    pushToHistory();

    // Broadcast clear event
    const payload: StrokePayload = {
      type: "clear",
      tool: "clear",
      color: "",
      size: 0,
    };
    channelRef.current?.send({
      type: "broadcast",
      event: "draw_stroke",
      payload,
    });
    localBroadcastRef.current?.postMessage({
      type: "draw_stroke",
      payload,
    });
  }, [pushToHistory]);

  // Export Canvas as PNG
  const handleExportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create temporary export canvas with clean white background
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

  // Render a stroke received locally or from remote peer
  const renderRemoteStroke = useCallback((payload: StrokePayload) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    if (payload.type === "clear") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }

    if (payload.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = payload.size * 2;
    } else if (payload.tool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = payload.color;
      ctx.lineWidth = payload.size * 2.5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = payload.color;
      ctx.lineWidth = payload.size;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (payload.type === "stroke" && payload.points && payload.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(payload.points[0].x, payload.points[0].y);
      for (let i = 1; i < payload.points.length; i++) {
        ctx.lineTo(payload.points[i].x, payload.points[i].y);
      }
      ctx.stroke();
    } else if (payload.type === "shape") {
      const { startX = 0, startY = 0, endX = 0, endY = 0 } = payload;
      if (payload.tool === "rectangle") {
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
      } else if (payload.tool === "circle") {
        ctx.beginPath();
        const rx = Math.abs(endX - startX) / 2;
        const ry = Math.abs(endY - startY) / 2;
        const cx = Math.min(startX, endX) + rx;
        const cy = Math.min(startY, endY) + ry;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (payload.tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else if (payload.tool === "arrow") {
        // Draw line with arrowhead
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
      } else if (payload.tool === "text" && payload.text) {
        ctx.font = `${Math.max(payload.size * 3, 16)}px sans-serif`;
        ctx.fillStyle = payload.color;
        ctx.fillText(payload.text, startX, startY);
      }
    }

    ctx.restore();
  }, []);

  // Set up real-time collaboration channels (Supabase Realtime + local BroadcastChannel fallback)
  useEffect(() => {
    // 1. Supabase Realtime Channel
    if (isSupabaseConfigured && room.id) {
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
        .on("broadcast", { event: "draw_stroke" }, ({ payload }) => {
          if (payload) {
            renderRemoteStroke(payload);
          }
        })
        .subscribe();
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
        } else if (data.type === "draw_stroke" && data.payload) {
          renderRemoteStroke(data.payload);
        }
      };
    }

    // Periodic cleanup of stale peer cursors (older than 4 seconds)
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
  }, [room.id, currentUserId, renderRemoteStroke]);

  // Load initial canvas snapshot
  useEffect(() => {
    if (!room.drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      if (room.drawing) {
        setHistory([room.drawing]);
        setHistoryIndex(0);
      }
    };
    img.src = room.drawing;
  }, [room.drawing]);

  // Adjust canvas size to parent container
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const previewCanvas = previewCanvasRef.current;
      if (!container || !canvas || !previewCanvas) return;

      const width = Math.max(container.clientWidth, 2400);
      const height = Math.max(container.clientHeight, 1800);

      if (canvas.width !== width || canvas.height !== height) {
        // Preserve existing drawing before resizing
        const tempImage = canvas.toDataURL();
        canvas.width = width;
        canvas.height = height;
        previewCanvas.width = width;
        previewCanvas.height = height;

        if (tempImage && tempImage.length > 50) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
          };
          img.src = tempImage;
        }
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  // Broadcast drawing stroke
  const broadcastStroke = useCallback((payload: StrokePayload) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "draw_stroke",
      payload,
    });

    localBroadcastRef.current?.postMessage({
      type: "draw_stroke",
      payload,
    });
  }, []);

  // Mouse / Touch Interaction Handlers
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
      // Draw temporary shape preview on preview canvas
      const previewCanvas = previewCanvasRef.current;
      if (!previewCanvas) return;
      const pctx = previewCanvas.getContext("2d");
      if (!pctx) return;

      pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      pctx.save();
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

    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      ctx?.restore();

      // Broadcast complete stroke
      broadcastStroke({
        type: "stroke",
        tool,
        color: drawingPen.color,
        size: drawingPen.size,
        points: strokePoints.current,
      });
      strokePoints.current = [];
    } else if (tool === "rectangle" || tool === "circle" || tool === "line" || tool === "arrow") {
      // Clear preview canvas and commit permanent shape to main canvas
      const previewCanvas = previewCanvasRef.current;
      const pctx = previewCanvas?.getContext("2d");
      pctx?.clearRect(0, 0, previewCanvas!.width, previewCanvas!.height);

      const start = shapeStart.current || { x, y };
      const payload: StrokePayload = {
        type: "shape",
        tool,
        color: drawingPen.color,
        size: drawingPen.size,
        startX: start.x,
        startY: start.y,
        endX: x,
        endY: y,
      };

      renderRemoteStroke(payload);
      broadcastStroke(payload);
      shapeStart.current = null;
    }

    pushToHistory();
  };

  // Commit text note
  const handleCommitText = () => {
    if (!textInput.value.trim()) {
      setTextInput((prev) => ({ ...prev, visible: false, value: "" }));
      return;
    }

    const payload: StrokePayload = {
      type: "shape",
      tool: "text",
      color: drawingPen.color,
      size: drawingPen.size,
      startX: textInput.canvasX,
      startY: textInput.canvasY,
      text: textInput.value.trim(),
    };

    renderRemoteStroke(payload);
    broadcastStroke(payload);
    pushToHistory();
    setTextInput((prev) => ({ ...prev, visible: false, value: "" }));
  };

  // Keyboard shortcuts (Z for Undo, Y for Redo, Spacebar for Pan, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing inside an input
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
            {/* SVG Cursor Pointer */}
            <svg
              className="h-5 w-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={peer.userColor}
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35z" />
            </svg>

            {/* Username Badge */}
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
          canUndo={historyIndex >= 0}
          canRedo={historyIndex < history.length - 1}
          onClearCanvas={handleClearCanvas}
          onExportImage={handleExportImage}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </div>

      {/* Status Pill in Bottom Left */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-30 hidden sm:flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-xs border border-slate-200 shadow-2xs">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>Syncing Active</span>
        <span className="text-slate-300">•</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
