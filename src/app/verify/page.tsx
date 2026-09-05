"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";
import { motion } from "framer-motion";
import { routeAfterAuth } from "@/lib/authRouting";

const buttonClickInteraction = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98, y: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 15 }
};

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyType, setVerifyType] = useState<any>("signup");
  const [countdown, setCountdown] = useState(60);
  // Set by signup/page.tsx when the email was found in admin_whitelist
  const [isAdminSignup, setIsAdminSignup] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      const stored = sessionStorage.getItem("intrst_pending_profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.email) setEmail(parsed.email);
        } catch (e) {
          // ignore
        }
      }
    }

    const typeParam = searchParams.get("type");
    if (typeParam) {
      setVerifyType(typeParam);
    }

    // isAdmin=true is appended by signup/page.tsx when the email
    // was found active in public.admin_whitelist.
    if (searchParams.get("isAdmin") === "true") {
      setIsAdminSignup(true);
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: verifyType,
      });
      if (verifyError) {
        console.error("Supabase verification error details:", {
          message: verifyError.message,
          status: verifyError.status,
          name: verifyError.name
        });
        throw verifyError;
      }

      console.log("✅ OTP verified, session:", data.session);
      console.log("✅ verifyType:", verifyType);
      console.log("✅ accessToken:", data.session?.access_token);

      const session = data.session;
      const accessToken = session?.access_token;

      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      // Only initialize the student profile for non-admin signups.
      // Admin profiles are created during the /auth/admin/setup step.
      const pendingProfileStr = sessionStorage.getItem("intrst_pending_profile");

      if (verifyType === 'signup' && pendingProfileStr && !isAdminSignup) {
        try {
          const profileInfo = JSON.parse(pendingProfileStr);
          await apiFetch("/auth/initialize-profile", {
            method: "POST",
            token: accessToken,
            body: JSON.stringify({
              user_id: data.user?.id,
              email: data.user?.email,
              name: profileInfo.name,
              username: profileInfo.username,
            }),
          });
        } catch (initError) {
          console.error("Failed to initialize profile:", initError);
        }
      }

      sessionStorage.removeItem("intrst_pending_profile");
      await new Promise(resolve => setTimeout(resolve, 300));

      // New admin signups have no DB profile yet — send to setup.
      // Existing admins and students are handled by routeAfterAuth.
      if (isAdminSignup && verifyType === 'signup') {
        router.replace("/auth/admin/setup");
        return;
      }

      // Route based on role from the user's profile.
      // routeAfterAuth handles: admin → /admin, user → /home,
      // no profile yet → /onboarding.
      await routeAfterAuth(router, accessToken);

    } catch (err: any) {
      console.error("Verification flow failed:", err);
      setError(err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError(null);
    try {
      let resendError;

      if (verifyType === "email" || verifyType === "magiclink") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        resendError = error;
      } else {
        const { error } = await supabase.auth.resend({
          type: verifyType,
          email,
        });
        resendError = error;
      }

      if (resendError) throw resendError;
      setCountdown(60);
      alert("A new code has been sent!");
    } catch (err: any) {
      console.error("Resend failed:", err);
      setError(err.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[390px] bg-white border border-neutral-200/60 shadow-[0_24px_48px_rgba(0,0,0,0.03)] rounded-[32px] p-6 md:p-8 relative z-10">
      {/* Centered Emblem Logo */}
      <div className="text-center mb-5">
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm mx-auto mb-1.5">i</div>
        <span className="text-xs font-bold tracking-tight text-neutral-400">intrst</span>
      </div>

      <CardHeader className="space-y-1 pb-6 p-0 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-[#0f0f10] mb-1">
          Verify Email
        </CardTitle>
        <CardDescription className="text-neutral-400 text-xs font-semibold leading-relaxed">
          Enter the 6-digit OTP sent to {email || "your email"}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Input
              id="otp"
              name="otp"
              placeholder="123456"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-white border border-[#c5c6cd] focus-visible:border-black focus-visible:ring-black text-center tracking-widest text-2xl h-14 rounded-xl text-black placeholder:text-neutral-300 font-bold outline-none transition-all"
              required
            />
          </div>

          <motion.div {...buttonClickInteraction} className="pt-2">
            <Button
              className="text-white rounded-full h-11 text-xs font-bold bg-black hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 w-full shadow-sm"
              type="submit"
              disabled={loading || !otp}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  Verify OTP <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-neutral-100 bg-transparent shadow-none pt-5 mt-6 p-0">
        <div className="text-xs text-neutral-500 font-medium bg-transparent">
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || countdown > 0 || !email}
            className={`font-bold transition-all bg-transparent ${countdown > 0
              ? "text-neutral-300 cursor-not-allowed no-underline"
              : "text-black underline hover:text-neutral-600"
              }`}
          >
            {resendLoading ? "Resending..." : "Resend"}
          </button>
          {countdown > 0 && (
            <span className="ml-1 text-neutral-400">
              in {countdown}s
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-6" style={{ backgroundColor: "#faf9f6" }}>
      {/* Background Glow Decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-[-20%] top-[10%] w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35"></div>
        <div className="absolute right-[-20%] bottom-[10%] w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-black" />}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}