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
  RotateCcw,
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
  "#0f172a", // Slate 900
  "#2563eb", // Blue 600
  "#059669", // Emerald 600
  "#d97706", // Amber 600
  "#dc2626", // Red 600
  "#7c3aed", // Violet 600
  "#db2777", // Pink 600
  "#ffffff", // White
];

const STROKE_SIZES = [
  { label: "S", size: 2 },
  { label: "M", size: 5 },
  { label: "L", size: 10 },
  { label: "XL", size: 18 },
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
    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
      {/* Selection / Pan */}
      <button
        type="button"
        onClick={() => setTool("select")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "select"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Select & Pan Tool (V or Spacebar + Drag)"
      >
        <MousePointer className="h-4 w-4" />
      </button>

      <div className="h-5 w-px bg-slate-200 mx-0.5" />

      {/* Drawing Tools */}
      <button
        type="button"
        onClick={() => setTool("pen")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "pen"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Pen Tool (P)"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setTool("highlighter")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "highlighter"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Highlighter (H)"
      >
        <Highlighter className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setTool("eraser")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "eraser"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Eraser (E)"
      >
        <Eraser className="h-4 w-4" />
      </button>

      <div className="h-5 w-px bg-slate-200 mx-0.5" />

      {/* Shapes */}
      <button
        type="button"
        onClick={() => setTool("rectangle")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "rectangle"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Rectangle (R)"
      >
        <Square className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setTool("circle")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "circle"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Circle / Ellipse (O)"
      >
        <Circle className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setTool("arrow")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "arrow"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Arrow (A)"
      >
        <ArrowUpRight className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setTool("line")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "line"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Straight Line (L)"
      >
        <Minus className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setTool("text")}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
          drawingPen.tool === "text"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        title="Text & Sticky Note (T)"
      >
        <Type className="h-4 w-4" />
      </button>

      <div className="h-5 w-px bg-slate-200 mx-0.5" />

      {/* Color Picker Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
          title="Stroke Color"
        >
          <div
            className="h-5 w-5 rounded-full border border-slate-300 shadow-2xs"
            style={{ backgroundColor: drawingPen.color }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setShowColorPicker(false);
                }}
                className={`h-6 w-6 rounded-full border border-slate-300 transition-transform hover:scale-110 ${
                  drawingPen.color === c ? "ring-2 ring-blue-600 ring-offset-1" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label
              className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-400 cursor-pointer overflow-hidden text-[9px] font-bold text-slate-500 hover:bg-slate-100"
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
          className="flex h-9 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          title="Stroke Width"
        >
          <span className="flex h-3 w-3 items-center justify-center">
            <span
              className="rounded-full bg-slate-800"
              style={{
                width: Math.min(Math.max(drawingPen.size, 3), 14),
                height: Math.min(Math.max(drawingPen.size, 3), 14),
              }}
            />
          </span>
          <span>{drawingPen.size}px</span>
        </button>

        {showSizePicker && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            {STROKE_SIZES.map(({ label, size }) => (
              <button
                key={size}
                type="button"
                onClick={() => setSize(size)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  drawingPen.size === size
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-slate-200 mx-0.5" />

      {/* Undo & Redo */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </button>

      <div className="h-5 w-px bg-slate-200 mx-0.5" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="px-1.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-200 mx-0.5" />

      {/* Clear Canvas */}
      <button
        type="button"
        onClick={onClearCanvas}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        title="Clear Entire Canvas"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Export as Image */}
      <button
        type="button"
        onClick={onExportImage}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        title="Export as PNG Image"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
