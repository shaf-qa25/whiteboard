# 🎨 CollabBoard — Real-Time Collaborative Whiteboard with Supabase & Stream Video

A modern, production-grade Collaborative Whiteboard Web Application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase Real-Time & Auth**, and **Stream Video React SDK**.

---

## ✨ Features

- **Infinite Interactive Canvas**:
  - Smooth pan and zoom (40% to 300% with mouse wheel and reset shortcut).
  - Tools: **Freehand Pen**, **Highlighter** (alpha blended), **Eraser**, **Rectangle**, **Circle / Ellipse**, **Straight Line**, **Arrow**, **Text notes & Sticky notes**.
  - Multi-level **Undo & Redo** stack (`Ctrl+Z` / `Ctrl+Y`).
  - Stroke width selector (2px to 18px) and rich color palette + custom color picker.
  - Export canvas as crisp PNG image.
  - Clear whiteboard with confirmation.
- **Real-Time Live Presence & Multi-Cursor Sync**:
  - Real-time cursor tracking displaying each user's unique avatar color and username badge.
  - Live stroke broadcasting with debounced auto-save to cloud storage / database.
  - Multi-tab offline sync fallback via native `BroadcastChannel` (test 2 browser tabs side-by-side immediately with zero setup).
- **Stream Video & Audio Calling**:
  - Integrated live WebRTC video calling powered by `@stream-io/video-react-sdk`.
  - Self-camera preview + remote participant video grid.
  - Microphone mute/unmute toggle, camera toggle, and screen sharing.
  - Collapsible video sidebar for distraction-free full-canvas drawing.
- **Room Management & Dashboard**:
  - Create public or private rooms with optional password protection.
  - Discover public rooms, manage your created rooms, copy one-click invite links.
  - Real-time participant counter on the navbar.
- **Authentication**:
  - Supabase Magic Link OTP passwordless authentication.
  - Instant zero-friction **Guest Mode** (customizable username and cursor color).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` or `.env` file in the project root (reference [.env.example](file:///.env.example)):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_API_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_SECRET=your-supabase-service-role-secret

# Stream Video & Chat Configuration
NEXT_PUBLIC_STREAM_CHAT_API_KEY=your-stream-api-key
STREAM_CHAT_SECRET_KEY=your-stream-secret-key
NEXT_PUBLIC_STREAM_CHAT_SECRET_KEY=your-stream-secret-key
```

> **Note**: Even if you haven't filled in your Supabase or Stream keys yet, the application gracefully activates **Instant Guest Mode** and local preview channels so you can test multi-window drawing immediately!

### 3. Supabase Database Schema (Optional for Cloud Persistence)
In your Supabase SQL Editor, run:

```sql
create table if not exists public."drawing-rooms" (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  drawing text,
  name text not null,
  password text,
  "isPasswordProtected" boolean default false,
  "isPublic" boolean default true,
  owner text not null,
  updated_at timestamptz default now()
);

-- Enable Realtime
alter publication supabase_realtime add table "drawing-rooms";
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select / Pan Mode |
| `P` | Freehand Pen |
| `H` | Highlighter |
| `E` | Eraser |
| `R` | Rectangle Shape |
| `O` | Circle / Ellipse Shape |
| `A` | Arrow |
| `L` | Straight Line |
| `T` | Text Note |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` or `Ctrl + Shift + Z` | Redo |
| `Spacebar + Drag` | Pan canvas |
| `Ctrl + Mouse Wheel` | Zoom in / out |
