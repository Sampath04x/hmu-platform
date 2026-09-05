"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Inter } from "next/font/google";
import { routeAfterAuth } from "@/lib/authRouting";

const inter = Inter({
  subsets: ["latin"],
});
// Standard micro-interactions for links & buttons matching the landing page
const buttonClickInteraction = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98, y: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 15 }
};

export default function SignInPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [otp, setOtp] = useState("");
  // const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) throw error;

      // setIsOtpSent(true);

      router.push(
        `/verify?email=${encodeURIComponent(email)}&type=email`
      );
    } catch (err: any) {
      console.error("OTP send failed:", err);
      const msg = typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err);
      setError(msg || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      if (loginMethod === "password") {
        if (!password) {
          throw new Error("Please enter your password.");
        }

        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;

        if (data?.session) {
          await routeAfterAuth(router, data.session.access_token);
        }
      } else {
        await handleSendOtp();
        return;
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const msg = typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err);
      setError(msg || "Login failed.");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
      // No need to router.push — Supabase redirects automatically
    } catch (err: any) {
      setError(err.message || "Google sign in failed.");
      setLoading(false);
    }
  };
  return (
    <main
      className={`${inter.className} min-h-screen w-full flex items-center justify-center relative overflow-hidden p-6`}
      style={{ backgroundColor: "#faf9f6" }}>

      {/* Background Glow Decorations (Consistent with Landing Page) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-[-20%] top-[10%] w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30"></div>
        <div className="absolute right-[-20%] bottom-[10%] w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30"></div>
      </div>

      {/* Grid wrapper for visual split balance (Max width scaled back down for 100% zoom screens) */}
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center relative z-10">

        {/* Left Side Content & Integrated Background Illustration */}
        <div className="lg:col-span-6 xl:col-span-7 hidden lg:block relative min-h-[480px] flex flex-col justify-center">

          {/* Text Content Layer */}
          <div className="relative z-20 max-w-md select-none">
            {/* Header/Logo */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm">i</div>
              <span className="text-lg font-bold tracking-tight text-[#0f0f10]">intrst</span>
            </div>

            {/* Subtitle */}
            <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-6">
              Connect. Collaborate. Belong.
            </p>

            {/* Headline - Proportioned cleanly for standard device views */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-[#0f0f10] leading-[1.1] mb-4 w-full max-w-none">              <span>Connect across</span>
              <br />
              <span className="bg-gradient-to-r from-[#505f78] to-[#855300] bg-clip-text text-transparent font-serif italic font-normal pr-4 inline-block">
                campus.
              </span>
              <br />
              <span>Build together.</span>
            </h1>
          </div>


        </div>

        {/* Right Side: Sign-In Card Container */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center lg:items-end w-full">

          {/* Card UI (Tighter padding & dimensions matching landing layouts) */}
          <div className="w-full max-w-[390px] bg-white border border-neutral-200/60 shadow-[0_24px_48px_rgba(0,0,0,0.03)] rounded-[32px] p-6 md:p-8 relative z-10">

            {/* Logo Emblem centered inside Card */}
            <div className="text-center mb-5">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm mx-auto mb-1.5">i</div>
              <span className="text-xs font-bold tracking-tight text-neutral-400">intrst</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold tracking-tight text-[#0f0f10] text-center mb-1">
              Welcome <span className="font-serif italic font-normal text-[#505f78]">Back!</span>
            </h2>
            <p className="text-neutral-400 text-xs text-center mb-6 font-medium leading-relaxed">Sign in to continue connecting with your campus.</p>

            {/* Toggle Switch */}
            <div className="bg-[#f0edee] border border-neutral-200/20 rounded-full p-1 flex gap-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setLoginMethod("password");
                }}
                className={`w-1/2 text-[11px] font-bold py-2 rounded-full transition-all duration-300 ${loginMethod === "password"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-500 hover:text-black"
                  }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setLoginMethod("otp");
                }}
                className={`w-1/2 text-[11px] font-bold py-2 rounded-full transition-all duration-300 ${loginMethod === "otp"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-500 hover:text-black"
                  }`}
              >
                OTP
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center">
                  {error}
                </div>
              )}
              {/* Email / Username field */}
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">Email or Username</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 placeholder:text-neutral-300 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Conditional password / otp logic */}
              {loginMethod === "password" ? (
                <div key="password-field" className="space-y-4 animate-fade-in">
                  {/* Password field */}
                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 pr-10 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 placeholder:text-neutral-300 font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                      >
                        {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>

                    <div className="text-right mt-1.5">
                      <Link href="/forgot-password" className="text-[10px] font-bold text-[#505f78] hover:underline">Forgot Password?</Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div key="otp-field" className="animate-fade-in">
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    We&apos;ll send a one-time code to your email address. You&apos;ll be redirected to enter it.
                  </p>
                </div>
              )}

              {/* Sign In Action Button with Framer Motion Hooks */}
              <motion.div {...buttonClickInteraction} className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="text-white rounded-full h-11 text-xs font-bold bg-black hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 w-full shadow-sm disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      {loginMethod === "password" ? "Sign In" : "Send OTP"}
                      <ArrowUpRight size={14} />
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-[#f0edee]"></div>
              <span className="mx-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-300">or</span>
              <div className="flex-1 border-t border-[#f0edee]"></div>
            </div>

            {/* Social logins */}
            <div className="space-y-2.5">
              {/* Google Button */}
              <motion.div {...buttonClickInteraction}>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-white border border-[#E2E8F0] text-xs font-bold text-neutral-800 hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-2.5 shadow-sm"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.77z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z" />
                      <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 4.91 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.79 1.21 5.46l4.11-3.22z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.84l4.11 3.22c.94-2.85 3.57-4.96 6.68-4.96z" />
                    </svg>
                  </div>
                  Continue with Google
                </button>
              </motion.div>


            </div>

            {/* Signup Link */}
            <p className="text-center text-[11px] text-neutral-400 mt-5 font-medium">
              New here? <Link href="/signup" className="text-[#505f78] font-bold hover:underline">Create an account</Link>
            </p>

          </div>

        </div>
      </div>
    </main>
  );
}