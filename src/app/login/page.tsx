"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/initSupabase";
import { createGuestSession } from "@/services/user.service";
import { 
  Sparkles, 
  PenTool, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  CheckCircle2, 
  Palette,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import Spinner from "@/components/videos/Spinner";

const AVATAR_COLORS = [
  "#d95b35", // Terracotta
  "#2563eb", // Blue
  "#059669", // Emerald
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#db2777", // Pink
  "#171717", // Carbon
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";

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
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin + redirectTarget : undefined,
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

  // Instant Guest Access (Zero setup, server-signed cryptographic token)
  const handleInstantGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    createGuestSession(guestName || undefined, selectedColor);
    router.push(redirectTarget);
  };

  return (
    <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
      {/* Back to Home Link */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#77736d] hover:text-[#171717] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to CollabBoard</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#171717] text-[#fffefb] shadow-xs">
          <PenTool className="h-5 w-5 text-[#d95b35]" />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#171717]">
          Welcome to CollabBoard
        </h1>
        <p className="mt-1 text-xs text-[#77736d] max-w-xs">
          Join the collaborative digital canvas. Use instant guest mode or sign in with your email.
        </p>
      </div>

      {/* Paper Card */}
      <div className="mt-6 rounded-2xl border border-[#e8e5df] bg-[#ffffff] p-6 sm:p-7 shadow-paper">
        {errorMsg && (
          <div className="mb-4 rounded-xl bg-[#fdf0e7] p-3 text-xs text-[#9c3e1e] border border-[#fbd7c3]">
            {errorMsg}
          </div>
        )}

        {isTokenSent ? (
          <div className="rounded-xl bg-[#e4f4e8] p-5 text-center border border-[#bce3c5]">
            <CheckCircle2 className="mx-auto h-9 w-9 text-[#1e6b36] mb-2" />
            <h3 className="text-sm font-bold text-[#1e6b36]">Magic Link Dispatched!</h3>
            <p className="mt-1 text-xs text-[#1e6b36]/90">
              Check <span className="font-semibold">{emailAddress}</span> for your one-click sign-in link.
            </p>
            <button
              type="button"
              onClick={() => setIsTokenSent(false)}
              className="mt-4 text-xs font-semibold text-[#1e6b36] underline hover:text-[#171717]"
            >
              Use another email or guest mode
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Instant Guest / Demo Mode (Recommended for quick testing) */}
            <form onSubmit={handleInstantGuestLogin} className="space-y-3 rounded-xl bg-[#faf8f3] p-4 border border-[#e8e5df]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717]">
                  <UserCheck className="h-4 w-4 text-[#d95b35]" />
                  <span>Instant Guest Mode</span>
                </div>
                <span className="rounded-full bg-[#fdf0e7] text-[#d95b35] border border-[#fbd7c3] px-2 py-0.5 text-[10px] font-semibold">
                  Zero Setup
                </span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Enter your display name (e.g. Alex, Maya)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-xs text-[#171717] placeholder:text-[#9c978f] focus:border-[#171717] focus:outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#77736d] mb-1.5 flex items-center gap-1">
                  <Palette className="h-3 w-3 text-[#d95b35]" />
                  <span>Pick your live cursor color</span>
                </label>
                <div className="flex items-center gap-2 pt-0.5">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-5 w-5 rounded-full border border-black/10 transition-transform ${
                        selectedColor === c ? "scale-125 ring-2 ring-[#171717] ring-offset-1" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#171717] px-4 py-2.5 text-xs font-semibold text-[#fffefb] hover:bg-[#2b2b2b] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#d95b35]" />
                <span>Launch Workspace Now</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[#e8e5df]" />
              <span className="relative bg-white px-3 text-[10px] font-mono text-[#77736d] uppercase tracking-wider">
                OR SIGN IN WITH EMAIL
              </span>
            </div>

            {/* Magic Link Form */}
            <form onSubmit={authenticateUser} className="space-y-3">
              <label className="block text-xs font-semibold text-[#171717]">
                Passwordless Magic Link
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#77736d]" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full rounded-lg border border-[#e8e5df] pl-9 pr-3 py-2 text-xs text-[#171717] placeholder:text-[#9c978f] focus:border-[#171717] focus:outline-hidden transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg border border-[#e8e5df] bg-[#ffffff] px-4 py-2 text-xs font-semibold text-[#171717] hover:bg-[#faf8f3] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? "Sending link..." : "Send Magic Link"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#d95b35]" />
              </button>
            </form>
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#77736d]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#d95b35]" />
          <span>Real-time collaborative whiteboard studio</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-dotted-grid px-4 py-12 sm:px-6 lg:px-8 selection:bg-[#fdf0e7] selection:text-[#d95b35]">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-6 w-6 text-[#d95b35]" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
