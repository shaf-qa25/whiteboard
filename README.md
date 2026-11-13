# 🎨 CollabBoard — Real-Time Collaborative Whiteboard

A high-performance, real-time collaborative digital whiteboard built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Supabase Real-Time & PostgreSQL**, and **Stream Video SDK**.

Designed for seamless remote teamwork, sprint planning, system design interviews, and visual brainstorming with zero setup friction.

---

## 🌟 Key Highlights & Features

### 🖌️ High-Precision Infinite Canvas
- **Crisp Vector Rendering**: Physical canvas buffer scaled via `window.devicePixelRatio` for razor-sharp rendering on Retina and 4K displays.
- **Rich Creative Toolset**: Freehand Pen, Highlighter (alpha-blended), Eraser, Geometric Shapes (Rectangle, Circle / Ellipse, Straight Line, Arrow), and inline Text labels.
- **Collaborative Element-Based Undo/Redo**: Stroke history is tracked per-author (`authorId`), ensuring user-scoped undo (`Ctrl+Z`) never deletes or conflicts with simultaneous strokes drawn by peers.
- **Pan & Zoom Engine**: Smooth viewport panning (via mouse drag or `Space + Drag`) and zooming (40% to 300% with mouse wheel and reset shortcut).
- **Crisp PNG Export**: One-click high-resolution white-background PNG snapshot generation.
- **Compact Vector Autosave**: Real-time canvas states are persisted as lightweight JSON vector streams (~5–15 KB) rather than heavy Base64 raster snapshots (~2.5 MB).

### 👥 Real-Time Presence & Collaboration
- **Live Multi-Cursor Broadcast**: Ephemeral cursor tracking displaying each user's customized avatar color and username badge across peers.
- **Supabase Realtime Engine**: Low-latency WebSocket pub/sub broadcasting drawing elements, stroke deletions, and live presence.
- **Multi-Tab Local Broadcast**: Native `BroadcastChannel` fallback allows testing multi-user collaboration across two tabs on the same machine with zero network latency.
- **Live Sync Indicator**: Visual indicator badge on the canvas header showing real-time connectivity status (*Live Collaboration Synced* / *Reconnecting* / *Offline*).

### 📹 Stream Video Calling & Screen Sharing
- **Built-in WebRTC Audio/Video**: Powered by `@stream-io/video-react-sdk` with grid layout for local and remote participant feeds.
- **Screen Sharing**: One-click screen sharing support directly alongside the collaborative drawing surface.
- **Microphone & Camera Controls**: Quick toggles for audio mute and camera video feed with live participant counter.
- **Automatic Track Cleanup**: Automatically disposes of camera and microphone media tracks on room leave or tab close.
- **Graceful Native Fallback**: Seamlessly falls back to local media preview if external Stream credentials are unconfigured.

### 🔐 Security & Access Control
- **Instant Guest Mode**: Frictionless onboarding using server-issued, cryptographically signed HMAC guest tokens—no mandatory registration required to test or collaborate.
- **Supabase Passwordless Auth**: Optional Magic Link OTP login for verified user accounts.
- **Bcrypt Password-Protected Rooms**: Secure room-level passcodes hashed with salt rounds on the server; clients never receive raw passwords or hashes.
- **HMAC-SHA256 Access Tickets**: Short-lived cryptographic access tickets gate canvas drawings and video calls for protected rooms.
- **Server Secret Isolation**: Zero privileged server keys (`SUPABASE_SERVICE_ROLE_KEY`, `STREAM_CHAT_SECRET_KEY`) leaked to client bundles.
- **Rate-Limited Video Tokens**: Stream video JWT tokens have strict 12-hour expiration and IP-based rate limiting to prevent token abuse.

---

## 📸 Screenshots & Demo

> **Tip**: Place demo screenshots or GIFs in `public/screenshots/` and update the paths below.

| Collaborative Canvas | Video Calling & Screen Share |
|:---:|:---:|
| ![Canvas Demo](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80) | ![Video Demo](https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=800&q=80) |

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19 Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Database & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL & Realtime WebSocket channels)
- **Video & Audio**: [GetStream Video SDK](https://getstream.io/video/) (`@stream-io/video-react-sdk`)
- **Security**: Server-side `bcryptjs` + Node.js `crypto` HMAC-SHA256

---

## 🚀 Quick Start & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/shaf-qa25/whiteboard.git
cd whiteboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_API_KEY=your-supabase-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key

# Stream Video Configuration
NEXT_PUBLIC_STREAM_CHAT_API_KEY=your-stream-api-key
STREAM_CHAT_SECRET_KEY=your-stream-api-secret
```

> **Note**: Even without Supabase or Stream credentials, the application will boot into **Instant Guest Mode** with native local storage and local media previews so you can explore the canvas immediately.

### 4. Database Setup (Supabase)
Run the following SQL snippet in the **Supabase SQL Editor**:

```sql
create table if not exists public."drawing-rooms" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner text not null,
  "isPublic" boolean default true,
  "isPasswordProtected" boolean default false,
  password text,
  drawing text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Supabase Realtime for instant synchronization
alter publication supabase_realtime add table "drawing-rooms";
```

*(Optional Security Migration)*: To lock down row-level and column-level security for production or public demonstrations, apply [supabase/migrations/20261113_enable_rls.sql](file:///supabase/migrations/20261113_enable_rls.sql).

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/), click **New Project** and import your repository.
3. In the **Environment Variables** section, add the 5 variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_STREAM_CHAT_API_KEY`
   - `STREAM_CHAT_SECRET_KEY`
4. Click **Deploy**. Vercel will build and deploy the Next.js 16 application automatically.

---

## ⌨️ Canvas Keyboard Shortcuts

| Shortcut | Tool / Action |
|:---|:---|
| `V` | Select / Move / Pan Mode |
| `P` | Freehand Pen |
| `H` | Highlighter (35% alpha) |
| `E` | Eraser |
| `R` | Rectangle |
| `O` | Circle / Ellipse |
| `A` | Arrow |
| `L` | Straight Line |
| `T` | Text Label |
| `Ctrl + Z` | Undo your last stroke |
| `Ctrl + Y` or `Ctrl + Shift + Z` | Redo your stroke |
| `Space + Drag` | Pan canvas viewport |
| `Ctrl + Scroll` | Zoom in / out |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
