"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  PenTool, 
  ArrowRight, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  Video, 
  Maximize2, 
  RotateCcw, 
  Layers, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Cpu, 
  Share2,
  MousePointer2,
  Highlighter,
  Square,
  Circle,
  Type
} from "lucide-react";
import { getUserSession, AppUserSession } from "@/services/user.service";

export default function LandingPage() {
  const router = useRouter();
  const [session, setSession] = useState<AppUserSession | null>(null);

  useEffect(() => {
    getUserSession().then((s) => {
      if (s) setSession(s);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#fffefb] text-[#171717] flex flex-col selection:bg-[#fdf0e7] selection:text-[#d95b35]">
      {/* Top Editorial Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#e8e5df] bg-[#fffefb]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-[#fffefb] shadow-xs group-hover:bg-[#d95b35] transition-colors">
              <PenTool className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-[#171717]">
                CollabBoard
              </span>
              <span className="text-[12px] font-handwriting text-[#d95b35] font-semibold text-lg leading-none">
                studio
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#77736d]">
            <a href="#canvas-mockup" className="hover:text-[#171717] transition-colors">
              Live Canvas
            </a>
            <a href="#features" className="hover:text-[#171717] transition-colors">
              Architecture & Features
            </a>
            <a href="#shortcuts" className="hover:text-[#171717] transition-colors">
              Shortcuts
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#77736d] hover:text-[#171717] transition-colors px-2 py-1"
            >
              {session?.user ? session.user.user_metadata?.userName || "Account" : "Sign In"}
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fffefb] hover:bg-[#2b2b2b] transition-all shadow-xs"
            >
              <span>{session?.user ? "Go to Workspace" : "Open Studio"}</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#d95b35]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e5df] bg-[#faf8f3] px-3.5 py-1 text-xs font-medium text-[#77736d] mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d95b35]" />
          <span>Real-time collaborative whiteboard studio</span>
        </div>

        {/* Large Expressive Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#171717] leading-[1.15] sm:leading-[1.12]">
          Think together in real time,
          <br />
          <span className="drawn-underline">from sketch to architecture</span>.
        </h1>

        {/* Concise Supporting Copy */}
        <p className="mt-6 text-base sm:text-lg text-[#77736d] max-w-2xl mx-auto leading-relaxed">
          An open, paper-like digital canvas designed for engineering teams, product designers, and creative minds. Zero signup friction, multi-user undo isolation, and integrated video calls.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#171717] px-6 py-3.5 text-sm font-semibold text-[#fffefb] hover:bg-[#2b2b2b] transition-all shadow-paper"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="h-4 w-4 text-[#d95b35]" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e5df] bg-[#ffffff] px-6 py-3.5 text-sm font-semibold text-[#171717] hover:bg-[#faf8f3] transition-all shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-[#d95b35]" />
            <span>Try Instant Guest Mode</span>
          </Link>
        </div>

        {/* Metadata Micro-badge */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-[#77736d] font-mono">
          <span>✓ Instant Guest Mode</span>
          <span>•</span>
          <span>✓ High-DPI Retina Buffer</span>
          <span>•</span>
          <span>✓ WebRTC Video Calling</span>
        </div>
      </section>

      {/* Realistic Collaborative Product Mockup */}
      <section id="canvas-mockup" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full pb-24">
        <div className="rounded-2xl border border-[#e8e5df] bg-[#ffffff] shadow-paper overflow-hidden">
          {/* Mockup Top Window Bar */}
          <div className="flex items-center justify-between border-b border-[#e8e5df] bg-[#faf8f3] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ded9cf]" />
                <span className="h-3 w-3 rounded-full bg-[#ded9cf]" />
                <span className="h-3 w-3 rounded-full bg-[#ded9cf]" />
              </div>
              <div className="h-4 w-px bg-[#e8e5df]" />
              <div className="flex items-center gap-2">
                <PenTool className="h-3.5 w-3.5 text-[#d95b35]" />
                <span className="text-xs font-bold text-[#171717]">
                  Architecture & Sprint Ideation
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f4e8] px-2.5 py-0.5 text-[11px] font-semibold text-[#1e6b36] border border-[#bce3c5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                Live Collaboration Synced
              </span>

              {/* Collaborator Avatars */}
              <div className="hidden sm:flex items-center -space-x-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white border-2 border-white">
                  S
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#059669] text-[10px] font-bold text-white border-2 border-white">
                  A
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d95b35] text-[10px] font-bold text-white border-2 border-white">
                  Y
                </div>
              </div>

              <div className="inline-flex items-center gap-1 rounded-lg border border-[#e8e5df] bg-white px-2.5 py-1 text-xs font-medium text-[#171717]">
                <Share2 className="h-3 w-3 text-[#77736d]" />
                <span className="hidden sm:inline">Invite</span>
              </div>
            </div>
          </div>

          {/* Mockup Canvas Working Surface */}
          <div className="relative min-h-[460px] sm:min-h-[540px] w-full bg-dotted-grid p-6 sm:p-10 flex flex-col justify-between overflow-hidden">
            {/* Diagram Nodes Sketch */}
            <div className="relative max-w-3xl mx-auto w-full pt-4">
              {/* Architecture Node 1: Next.js 16 */}
              <div className="absolute left-2 sm:left-10 top-6 rounded-xl border-2 border-[#171717] bg-[#efe8f9] p-4 shadow-paper w-48 sm:w-56">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#6b46c1]">
                  Web Client
                </span>
                <h4 className="text-sm font-bold text-[#171717] mt-0.5">
                  Next.js 16 App Router
                </h4>
                <p className="text-[11px] text-[#77736d] mt-1">
                  Turbopack • High-DPI Canvas • Author-based undo
                </p>
              </div>

              {/* Connector Arrow 1 to 2 */}
              <svg className="hidden sm:block absolute left-68 top-16 w-32 h-16 pointer-events-none" viewBox="0 0 120 40">
                <path d="M 0 20 Q 60 5, 110 20" stroke="#d95b35" strokeWidth="2.5" strokeDasharray="4 4" fill="none" />
                <polygon points="112,20 102,15 102,25" fill="#d95b35" />
                <text x="35" y="14" fill="#d95b35" fontSize="10" fontFamily="Caveat" fontWeight="bold">WebSocket sync</text>
              </svg>

              {/* Architecture Node 2: Supabase Realtime */}
              <div className="absolute right-2 sm:right-16 top-4 rounded-xl border-2 border-[#171717] bg-[#e4f4e8] p-4 shadow-paper w-48 sm:w-56">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#059669]">
                  Realtime Engine
                </span>
                <h4 className="text-sm font-bold text-[#171717] mt-0.5">
                  Supabase Realtime
                </h4>
                <p className="text-[11px] text-[#77736d] mt-1">
                  Broadcast channels • PostgreSQL persistence
                </p>
              </div>

              {/* Sticky Note */}
              <div className="absolute left-1/3 top-44 transform -rotate-3 rounded-lg border border-[#e8d277] bg-[#fef8db] p-4 shadow-paper w-48 hidden sm:block">
                <div className="h-2 w-8 mx-auto -mt-5 mb-2 bg-[#d9c878]/60 rounded-xs" />
                <p className="font-handwriting text-lg text-[#665005] leading-snug">
                  Collaborative element-based undo works across all users without conflicts!
                </p>
                <span className="block text-right text-[10px] font-mono text-[#8a6b08] mt-2">
                  — Sarah K.
                </span>
              </div>

              {/* Architecture Node 3: Stream WebRTC */}
              <div className="absolute right-10 sm:right-28 top-56 rounded-xl border-2 border-[#171717] bg-[#e0effa] p-4 shadow-paper w-48 sm:w-56">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#2563eb]">
                  Media Layer
                </span>
                <h4 className="text-sm font-bold text-[#171717] mt-0.5">
                  Stream Video SDK
                </h4>
                <p className="text-[11px] text-[#77736d] mt-1">
                  WebRTC Audio/Video • Screen share • HMAC JWT
                </p>
              </div>

              {/* Live Peer Cursors overlay */}
              {/* Cursor 1: Sarah */}
              <div className="absolute left-1/4 top-12 flex items-start gap-1 pointer-events-none animate-pulse">
                <MousePointer2 className="h-4 w-4 text-[#2563eb] fill-[#2563eb]" />
                <div className="rounded-md bg-[#2563eb] px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                  Sarah K. (Senior Eng)
                </div>
              </div>

              {/* Cursor 2: Alex */}
              <div className="absolute right-1/4 top-48 flex items-start gap-1 pointer-events-none">
                <MousePointer2 className="h-4 w-4 text-[#059669] fill-[#059669]" />
                <div className="rounded-md bg-[#059669] px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                  Alex M. (Product)
                </div>
              </div>

              {/* Cursor 3: You */}
              <div className="absolute left-20 top-48 flex items-start gap-1 pointer-events-none">
                <MousePointer2 className="h-4 w-4 text-[#d95b35] fill-[#d95b35]" />
                <div className="rounded-md bg-[#d95b35] px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                  You (Drawing)
                </div>
              </div>
            </div>

            {/* Floating Video Drawer Mockup (Right side) */}
            <div className="hidden lg:flex flex-col gap-2 absolute right-6 bottom-20 w-44 rounded-xl border border-[#e8e5df] bg-[#ffffff]/90 p-2 shadow-paper backdrop-blur-xs">
              <div className="flex items-center justify-between text-[10px] font-semibold text-[#77736d] px-1">
                <span className="flex items-center gap-1 text-[#171717]">
                  <Video className="h-3 w-3 text-[#d95b35]" /> Video Call
                </span>
                <span>3 online</span>
              </div>
              <div className="h-20 rounded-lg bg-[#171717] flex items-center justify-center text-white text-xs font-semibold relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="text-[11px] text-slate-300">Live WebRTC</span>
                <span className="absolute bottom-1 left-2 text-[9px] font-mono text-emerald-400">● Mic active</span>
              </div>
            </div>

            {/* Bottom Floating Canvas Toolbar Dock */}
            <div className="mt-auto mx-auto inline-flex items-center gap-1 sm:gap-2 rounded-2xl border border-[#e8e5df] bg-[#ffffff] px-3 py-2 shadow-paper">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-[#fffefb] shadow-xs">
                <PenTool className="h-4 w-4 text-[#d95b35]" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#77736d] hover:bg-[#faf8f3]">
                <Highlighter className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#77736d] hover:bg-[#faf8f3]">
                <Square className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#77736d] hover:bg-[#faf8f3]">
                <Circle className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#77736d] hover:bg-[#faf8f3]">
                <Type className="h-4 w-4" />
              </button>

              <div className="h-4 w-px bg-[#e8e5df] mx-1" />

              {/* Stroke Swatches */}
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-[#171717] ring-1 ring-slate-400" />
                <span className="h-3.5 w-3.5 rounded-full bg-[#d95b35] ring-2 ring-[#d95b35]/40" />
                <span className="h-3.5 w-3.5 rounded-full bg-[#2563eb]" />
                <span className="h-3.5 w-3.5 rounded-full bg-[#059669]" />
              </div>

              <div className="h-4 w-px bg-[#e8e5df] mx-1" />

              <span className="text-[11px] font-mono text-[#77736d] px-1">100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section (2 / 3 / 2 Editorial Specimen Layout) */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full py-16 border-t border-[#e8e5df]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d95b35] font-bold">
            Specimen Sheets & Engineering
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171717] mt-2">
            Built for precision, engineered for scale.
          </h2>
          <p className="mt-3 text-sm text-[#77736d]">
            Seven architectural pillars that make CollabBoard feel light, secure, and reliable.
          </p>
        </div>

        {/* Row 1: 2 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-8 shadow-paper hover:border-[#d95b35]/40 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35] mb-5">
              <Maximize2 className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-mono text-[#77736d] uppercase tracking-wider">
              Specimen 01 • Rendering
            </span>
            <h3 className="text-lg font-bold text-[#171717] mt-1">
              Retina High-DPI Vector Buffer
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#77736d] leading-relaxed">
              Every stroke and shape renders directly to a device-pixel-ratio scaled HTML5 canvas. Viewers on 4K and Retina screens experience razor-sharp lines at 40% to 300% zoom with zero pixel blur.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-8 shadow-paper hover:border-[#d95b35]/40 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35] mb-5">
              <RotateCcw className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-mono text-[#77736d] uppercase tracking-wider">
              Specimen 02 • History
            </span>
            <h3 className="text-lg font-bold text-[#171717] mt-1">
              Author-Isolated Collaborative Undo
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#77736d] leading-relaxed">
              Strokes are tracked as discrete elements tagged with your author ID. Pressing Ctrl+Z undos only your own work, preserving concurrent drawings made by teammates across the room.
            </p>
          </div>
        </div>

        {/* Row 2: 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 3 */}
          <div className="rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-6 shadow-paper hover:border-[#d95b35]/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35] mb-4">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono text-[#77736d] uppercase">
              Specimen 03 • Presence
            </span>
            <h4 className="text-base font-bold text-[#171717] mt-1">
              Live Multi-Cursor Broadcast
            </h4>
            <p className="mt-2 text-xs text-[#77736d] leading-relaxed">
              Sub-10ms ephemeral cursor synchronization over Supabase WebSocket broadcast channels with unique avatar colors and name tags.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-6 shadow-paper hover:border-[#d95b35]/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35] mb-4">
              <Video className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono text-[#77736d] uppercase">
              Specimen 04 • WebRTC
            </span>
            <h4 className="text-base font-bold text-[#171717] mt-1">
              Integrated Stream Video
            </h4>
            <p className="mt-2 text-xs text-[#77736d] leading-relaxed">
              Crystal-clear video grid, audio mute controls, screen sharing, and automatic hardware track disposal on room exit.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-6 shadow-paper hover:border-[#d95b35]/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35] mb-4">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono text-[#77736d] uppercase">
              Specimen 05 • Security
            </span>
            <h4 className="text-base font-bold text-[#171717] mt-1">
              Bcrypt Passwords & HMAC Tickets
            </h4>
            <p className="mt-2 text-xs text-[#77736d] leading-relaxed">
              Private room gating with server-side bcrypt hashing and HMAC-SHA256 access tickets that protect drawing canvases from unauthorized access.
            </p>
          </div>
        </div>

        {/* Row 3: 2 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 6 */}
          <div className="rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-8 shadow-paper hover:border-[#d95b35]/40 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35] mb-5">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-mono text-[#77736d] uppercase tracking-wider">
              Specimen 06 • Frictionless
            </span>
            <h3 className="text-lg font-bold text-[#171717] mt-1">
              Cryptographic Instant Guest Sessions
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#77736d] leading-relaxed">
              Test or collaborate immediately without forced registration walls. Guests receive server-signed cryptographic identity tokens ensuring safe ownership verification.
            </p>
          </div>

          {/* Card 7 */}
          <div className="rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-8 shadow-paper hover:border-[#d95b35]/40 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] border border-[#e8e5df] text-[#d95b35] mb-5">
              <Cpu className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-mono text-[#77736d] uppercase tracking-wider">
              Specimen 07 • Efficiency
            </span>
            <h3 className="text-lg font-bold text-[#171717] mt-1">
              97% Smaller Compact Vector Payloads
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#77736d] leading-relaxed">
              Autosave operations serialize lightweight JSON vector paths (~5–15 KB) rather than massive Base64 raster snapshots (~2.5 MB), cutting bandwidth and cloud storage costs.
            </p>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Specimen Bar */}
      <section id="shortcuts" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full py-12">
        <div className="rounded-2xl border border-[#e8e5df] bg-[#faf8f3] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8e5df] pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-[#171717]">
                Natural Canvas Hotkeys
              </h3>
              <p className="text-xs text-[#77736d]">
                Designed for fluid sketching without hunting through toolbars.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#d95b35] font-semibold">
              Full Keyboard Map
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="rounded-lg border border-[#e8e5df] bg-white p-3 text-center">
              <kbd className="rounded-md bg-[#faf8f3] border border-[#e8e5df] px-2 py-0.5 text-xs font-mono font-bold text-[#171717]">P</kbd>
              <span className="block text-[11px] text-[#77736d] mt-1.5">Pen</span>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-white p-3 text-center">
              <kbd className="rounded-md bg-[#faf8f3] border border-[#e8e5df] px-2 py-0.5 text-xs font-mono font-bold text-[#171717]">H</kbd>
              <span className="block text-[11px] text-[#77736d] mt-1.5">Highlighter</span>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-white p-3 text-center">
              <kbd className="rounded-md bg-[#faf8f3] border border-[#e8e5df] px-2 py-0.5 text-xs font-mono font-bold text-[#171717]">E</kbd>
              <span className="block text-[11px] text-[#77736d] mt-1.5">Eraser</span>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-white p-3 text-center">
              <kbd className="rounded-md bg-[#faf8f3] border border-[#e8e5df] px-2 py-0.5 text-xs font-mono font-bold text-[#171717]">R / O</kbd>
              <span className="block text-[11px] text-[#77736d] mt-1.5">Shapes</span>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-white p-3 text-center">
              <kbd className="rounded-md bg-[#faf8f3] border border-[#e8e5df] px-2 py-0.5 text-xs font-mono font-bold text-[#171717]">Ctrl+Z</kbd>
              <span className="block text-[11px] text-[#77736d] mt-1.5">User Undo</span>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-white p-3 text-center">
              <kbd className="rounded-md bg-[#faf8f3] border border-[#e8e5df] px-2 py-0.5 text-xs font-mono font-bold text-[#171717]">Space</kbd>
              <span className="block text-[11px] text-[#77736d] mt-1.5">Pan View</span>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA on Dotted Paper */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full py-16">
        <div className="relative rounded-3xl border border-[#e8e5df] bg-dotted-grid p-10 sm:p-16 text-center shadow-paper overflow-hidden">
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf0e7] px-3 py-1 text-xs font-bold text-[#d95b35] border border-[#fbd7c3] mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ready in 2 seconds</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
              Start drawing together now.
            </h2>
            <p className="mt-3 text-sm text-[#77736d]">
              No installation, no onboarding wizards, no credit card. Create an instant whiteboard or discover public community boards.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#171717] px-6 py-3.5 text-sm font-semibold text-[#fffefb] hover:bg-[#2b2b2b] transition-all shadow-paper"
              >
                <span>Launch CollabBoard</span>
                <ArrowRight className="h-4 w-4 text-[#d95b35]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Editorial Footer */}
      <footer className="mt-auto border-t border-[#e8e5df] bg-[#fffefb] py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#77736d]">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#171717] text-[#fffefb]">
              <PenTool className="h-3 w-3 text-[#d95b35]" />
            </div>
            <span className="font-bold text-[#171717]">CollabBoard</span>
            <span>—</span>
            <span>Digital Whiteboard Studio</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-[#171717] transition-colors">
              Workspace
            </Link>
            <Link href="/login" className="hover:text-[#171717] transition-colors">
              Guest Identity
            </Link>
            <a
              href="https://github.com/shaf-qa25/whiteboard"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#171717] transition-colors font-mono"
            >
              GitHub Source
            </a>
          </div>

          <div className="font-mono text-[11px]">
            MIT License • Designed with Next.js 16
          </div>
        </div>
      </footer>
    </div>
  );
}
