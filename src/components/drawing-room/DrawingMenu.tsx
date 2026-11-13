"use client";

import React, { useState } from "react";
import { DrawingPen, ToolType } from "./BoardContainer";
import {
  MousePointer,
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Type,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
} from "lucide-react";

interface DrawingMenuProps {
  drawingPen: DrawingPen;
  setDrawingPen: React.Dispatch<React.SetStateAction<DrawingPen>>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearCanvas: () => void;
  onExportImage: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const PRESET_COLORS = [
  "#171717", // Carbon
  "#d95b35", // Terracotta
  "#2563eb", // Blue
  "#059669", // Emerald
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#db2777", // Rose
  "#ffffff", // White
];

const STROKE_SIZES = [
  { label: "Fine", size: 2 },
  { label: "Med", size: 4 },
  { label: "Bold", size: 8 },
  { label: "Heavy", size: 16 },
];

export default function DrawingMenu({
  drawingPen,
  setDrawingPen,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearCanvas,
  onExportImage,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: DrawingMenuProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  const setTool = (tool: ToolType) => {
    setDrawingPen((prev) => ({
      ...prev,
      tool,
    }));
  };

  const setColor = (color: string) => {
    setDrawingPen((prev) => ({
      ...prev,
      color,
    }));
  };

  const setSize = (size: number) => {
    setDrawingPen((prev) => ({
      ...prev,
      size,
    }));
    setShowSizePicker(false);
  };

  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-[#e8e5df] bg-[#ffffff]/98 p-1.5 shadow-paper-modal backdrop-blur-md">
      {/* Selection / Pan */}
      <button
        type="button"
        onClick={() => setTool("select")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "select"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Select & Pan Tool (V or Space + Drag)"
      >
        <MousePointer className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-[#e8e5df] mx-0.5" />

      {/* Freehand Pen */}
      <button
        type="button"
        onClick={() => setTool("pen")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "pen"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Freehand Pen (P)"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* Highlighter */}
      <button
        type="button"
        onClick={() => setTool("highlighter")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "highlighter"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Highlighter (H)"
      >
        <Highlighter className="h-4 w-4" />
      </button>

      {/* Eraser */}
      <button
        type="button"
        onClick={() => setTool("eraser")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "eraser"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Eraser (E)"
      >
        <Eraser className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-[#e8e5df] mx-0.5" />

      {/* Shapes: Rectangle */}
      <button
        type="button"
        onClick={() => setTool("rectangle")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "rectangle"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Rectangle (R)"
      >
        <Square className="h-4 w-4" />
      </button>

      {/* Shapes: Circle */}
      <button
        type="button"
        onClick={() => setTool("circle")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "circle"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Circle / Ellipse (O)"
      >
        <Circle className="h-4 w-4" />
      </button>

      {/* Shapes: Arrow */}
      <button
        type="button"
        onClick={() => setTool("arrow")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "arrow"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Arrow Connector (A)"
      >
        <ArrowUpRight className="h-4 w-4" />
      </button>

      {/* Shapes: Straight Line */}
      <button
        type="button"
        onClick={() => setTool("line")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "line"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Straight Line (L)"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Text Label */}
      <button
        type="button"
        onClick={() => setTool("text")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "text"
            ? "bg-[#171717] text-[#fffefb] shadow-xs"
            : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
        }`}
        title="Text Label (T)"
      >
        <Type className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-[#e8e5df] mx-0.5" />

      {/* Color Picker Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl hover:bg-[#faf8f3] transition-colors"
          title="Stroke Color"
        >
          <div
            className="h-4 w-4 rounded-full border border-black/15 shadow-2xs"
            style={{ backgroundColor: drawingPen.color }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-xl border border-[#e8e5df] bg-white p-2 shadow-paper-modal animate-in fade-in zoom-in-95 duration-100">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setShowColorPicker(false);
                }}
                className={`h-5 w-5 rounded-full border border-[#e8e5df] transition-transform hover:scale-120 ${
                  drawingPen.color === c ? "ring-2 ring-[#171717] ring-offset-1" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label
              className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-[#e8e5df] cursor-pointer overflow-hidden text-[9px] font-bold text-[#77736d] hover:bg-[#faf8f3]"
              title="Custom Color"
            >
              +
              <input
                type="color"
                value={drawingPen.color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
        )}
      </div>

      {/* Size Picker Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowSizePicker(!showSizePicker)}
          className="flex h-8 sm:h-9 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-[#171717] hover:bg-[#faf8f3] transition-colors"
          title="Stroke Width"
        >
          <span className="flex h-3 w-3 items-center justify-center">
            <span
              className="rounded-full bg-[#171717]"
              style={{
                width: Math.min(Math.max(drawingPen.size, 2), 12),
                height: Math.min(Math.max(drawingPen.size, 2), 12),
              }}
            />
          </span>
          <span className="text-[11px] font-mono">{drawingPen.size}px</span>
        </button>

        {showSizePicker && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-xl border border-[#e8e5df] bg-white p-1.5 shadow-paper-modal animate-in fade-in zoom-in-95 duration-100">
            {STROKE_SIZES.map(({ label, size }) => (
              <button
                key={size}
                type="button"
                onClick={() => setSize(size)}
                className={`flex h-7 px-2 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                  drawingPen.size === size
                    ? "bg-[#171717] text-[#fffefb]"
                    : "text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717]"
                }`}
              >
                {label} ({size}px)
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-[#e8e5df] mx-0.5" />

      {/* Undo & Redo */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] disabled:opacity-25 disabled:pointer-events-none transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] disabled:opacity-25 disabled:pointer-events-none transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-[#e8e5df] mx-0.5" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="px-1.5 py-0.5 text-[11px] font-mono font-medium text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] rounded-md transition-colors"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-3 w-3" />
        </button>
      </div>

      <div className="h-4 w-px bg-[#e8e5df] mx-0.5" />

      {/* Clear Canvas */}
      <button
        type="button"
        onClick={onClearCanvas}
        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[#9c978f] hover:bg-[#fdf0e7] hover:text-[#d95b35] transition-colors"
        title="Clear Entire Canvas"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Export as Image */}
      <button
        type="button"
        onClick={onExportImage}
        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[#77736d] hover:bg-[#faf8f3] hover:text-[#171717] transition-colors"
        title="Export as PNG Image"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
