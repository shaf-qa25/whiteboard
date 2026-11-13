"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { createGuestSession } from "@/services/user.service";
import { 
  Sparkles, 
  Layers, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  CheckCircle2, 
  Palette,
  ShieldCheck
} from "lucide-react";

const AVATAR_COLORS = [
  "#2563eb", // Blue
  "#059669", // Emerald
  "#d97706", // Amber
  "#dc2626", // Red
  "#7c3aed", // Violet
  "#db2777", // Pink
  "#0891b2", // Cyan
];

export default function LoginPage() {
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenSent, setIsTokenSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Magic link sign-in (Supabase)
  const authenticateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress.trim()) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg("Supabase credentials not configured in .env. Use Instant Guest Access below to test right now!");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: emailAddress.trim(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data) {
        setIsTokenSent(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Guest Access (No email setup needed for instant testing)
  const handleInstantGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    createGuestSession(guestName || undefined, selectedColor);
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            CollabBoard
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Real-time collaborative whiteboard with live cursor sync & Stream video calling
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {errorMsg}
            </div>
          )}

          {isTokenSent ? (
            <div className="rounded-xl bg-emerald-50 p-5 text-center border border-emerald-200">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
              <h3 className="text-sm font-bold text-emerald-900">Magic Link Dispatched!</h3>
              <p className="mt-1 text-xs text-emerald-700">
                Check <span className="font-semibold">{emailAddress}</span> for your one-click sign-in link.
              </p>
              <button
                type="button"
                onClick={() => setIsTokenSent(false)}
                className="mt-4 text-xs font-semibold text-emerald-800 underline hover:text-emerald-900"
              >
                Use another email or guest mode
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Magic Link Form */}
              <form onSubmit={authenticateUser} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Sign in with Magic Link 🧙‍♂️
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isLoading ? "Sending token..." : "Send Magic Link"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="relative bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  OR INSTANT ACCESS
                </span>
              </div>

              {/* Instant Guest / Demo Mode */}
              <form onSubmit={handleInstantGuestLogin} className="space-y-3 rounded-xl bg-slate-50/80 p-4 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span>Instant Guest Join</span>
                  <span className="ml-auto rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-semibold">
                    Zero Setup
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Enter display name (e.g. Alex, Sam)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    <span>Choose your cursor color</span>
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`h-6 w-6 rounded-full border border-slate-300 transition-transform ${
                          selectedColor === c ? "scale-115 ring-2 ring-blue-600 ring-offset-1" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Launch Whiteboard Instantly</span>
                </button>
              </form>
            </div>
          )}

          {/* Security & Features Footer */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Supabase Real-Time Sync & Stream Video</span>
          </div>
        </div>
      </div>
    </div>
  );
}
