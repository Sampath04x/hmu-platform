"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyType, setVerifyType] = useState<any>("signup");

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
      
      const session = data.session;
      const accessToken = session?.access_token;

      // 4. Initialize profile in backend if explicitly signing up
      const pendingProfileStr = sessionStorage.getItem("intrst_pending_profile");
      
      // We only initialize if it's a signup flow AND we have pending data
      if (verifyType === 'signup' && pendingProfileStr) {
        try {
          const profileInfo = JSON.parse(pendingProfileStr);
          await apiFetch("/auth/initialize-profile", {
            method: "POST",
            token: accessToken, // Use fresh token
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

      // Always clear the pending profile once verification is attempted
      sessionStorage.removeItem("intrst_pending_profile");

      // Small delay to ensure Supabase auth state has propagated if needed 
      // though we are passing the token explicitly now.
      await new Promise(resolve => setTimeout(resolve, 300));

      // 5. Check profile status to determine redirection
      try {
        const meData = await apiFetch("/auth/me", { token: accessToken });

        // Determine if onboarding is truly needed
        const hasCompletedOnboarding = !!(meData?.profile?.department || meData?.profile?.year_of_study);
        
        // If it's a sign-in flow (verifyType is email/magiclink), try to go home by default
        // unless they are missing a profile entirely.
        const isSigninFlow = verifyType === "email" || verifyType === "magiclink";

        if (hasCompletedOnboarding || isSigninFlow) {
          router.replace("/home");
        } else {
          router.replace("/onboarding");
        }
      } catch (meError) {
        console.error("Failed to fetch profile info during verification:", meError);
        // Fallback to home if it's a sign-in, onboarding otherwise
        if (verifyType === "email" || verifyType === "magiclink") {
          router.replace("/home");
        } else {
          router.replace("/onboarding");
        }
      }

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
        // For login OTP or magiclink, we call signInWithOtp again
        const { error } = await supabase.auth.signInWithOtp({ email });
        resendError = error;
      } else {
        // For signup, we use resend
        const { error } = await supabase.auth.resend({
          type: verifyType,
          email,
        });
        resendError = error;
      }

      if (resendError) throw resendError;
      alert("A new code has been sent!");
    } catch (err: any) {
      console.error("Resend failed:", err);
      setError(err.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md z-10 border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
          Verify Email
        </CardTitle>
        <CardDescription className="text-center text-zinc-400">
          Enter the 6-digit OTP sent to {email || "your email"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm text-center">
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
              className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-indigo-500 text-center tracking-widest text-2xl h-14"
              required
            />
          </div>

          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-12"
            type="submit"
            disabled={loading || !otp}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Verify OTP <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-zinc-800/50 pt-4">
        <Button 
          variant="link" 
          onClick={handleResend}
          disabled={resendLoading || !email}
          className="text-zinc-400 hover:text-indigo-400 transition-colors"
        >
          {resendLoading ? "Resending..." : "Didn't receive a code? Resend"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-indigo-500" />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
