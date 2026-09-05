"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";
import SignupView, { SignupFormData } from "@/components/auth/SignupView";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (formData: SignupFormData) => {
    setLoading(true);
    setError(null);

    if (!formData.name || !formData.displayName || !formData.email || !formData.password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      // ---------------------------------------------------------------
      // STEP 1: Check admin_whitelist FIRST — before any domain check.
      // If the email is present and active in public.admin_whitelist,
      // it is allowed regardless of its domain (@gmail.com, etc.).
      // ---------------------------------------------------------------
      const normalizedEmail = formData.email.trim().toLowerCase();

      let isAdmin = false;
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admin_whitelist")
          .select("email, full_name, designation, campus")
          .eq("email", normalizedEmail)
          .eq("is_active", true)
          .maybeSingle();

        if (adminError) {
          console.error("Error checking admin whitelist:", adminError);
        }

        if (adminData) {
          isAdmin = true;
          console.log("Admin email detected — bypassing GITAM restriction");
        } else {
          console.log("Student email detected — applying GITAM validation");
        }
      } catch (whitelistErr) {
        console.error("Failed to check admin whitelist:", whitelistErr);
        // If the whitelist check itself fails, fall through to GITAM validation
        // to preserve student sign-up safety.
      }

      // ---------------------------------------------------------------
      // STEP 2: If NOT an admin, enforce the GITAM domain restriction.
      // ---------------------------------------------------------------
      if (!isAdmin) {
        const domain = normalizedEmail.split("@")[1] ?? "";
        const isGitamEmail =
          domain === "gitam.in" ||
          domain.endsWith(".gitam.in") ||
          domain === "gitam.edu" ||
          domain.endsWith(".gitam.edu");

        if (!isGitamEmail) {
          setError("Only GITAM email addresses are allowed.");
          setLoading(false);
          return;
        }
      }

      // ---------------------------------------------------------------
      // STEP 3: Check username availability (both flows).
      // ---------------------------------------------------------------
      try {
        const usernameCheck = await apiFetch(`/auth/check-username/${formData.displayName}`, {
          requireAuth: false,
        });
        if (!usernameCheck.available) {
          throw new Error("Username is already taken.");
        }
      } catch (checkErr: any) {
        console.error("Username check failed:", checkErr);
        if (checkErr.message === "Username is already taken.") throw checkErr;
      }

      // ---------------------------------------------------------------
      // STEP 4: Create Supabase Auth account (sends OTP email).
      // ---------------------------------------------------------------
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;

      // ---------------------------------------------------------------
      // STEP 5: Store pending profile data in sessionStorage so the
      // OTP verify page can read it and initialize the profile.
      // For admins we store an extra flag so verify/routeAfterAuth can
      // direct them to /auth/admin/setup instead of /onboarding.
      // ---------------------------------------------------------------
      if (isAdmin) {
        sessionStorage.setItem("admin_pending_profile", JSON.stringify({
          name: formData.name,
          displayName: formData.displayName,
          email: formData.email,
          timestamp: new Date().getTime(),
        }));
      } else {
        sessionStorage.setItem("intrst_pending_profile", JSON.stringify({
          name: formData.name,
          username: formData.displayName,
          email: formData.email,
          timestamp: new Date().getTime(),
        }));
      }

      // ---------------------------------------------------------------
      // STEP 6: Redirect to OTP verify.
      // The verify page uses routeAfterAuth, which reads the role from
      // the profile; for admins who have no profile yet it falls back to
      // /onboarding — but admin_pending_profile is stored above so the
      // admin setup page pre-fills the form.
      // We pass isAdmin=true in the query string so verify can redirect
      // to /auth/admin/setup for new admins before their profile exists.
      // ---------------------------------------------------------------
      router.push(
        `/verify?email=${encodeURIComponent(formData.email)}&type=signup${isAdmin ? "&isAdmin=true" : ""}`
      );
    } catch (err: any) {
      console.error("Signup process failed:", err);
      const msg =
        typeof err === "object" && err !== null
          ? err.message || JSON.stringify(err)
          : String(err);
      setError(msg || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
    <SignupView
      title={<>Create <span className="font-serif italic font-normal text-[#505f78]">Account</span></>}
      subtitle="Join your campus network and start connecting."
      buttonText={<>Sign Up <ArrowUpRight size={14} className="ml-1.5" /></>}
      loading={loading}
      error={error}
      onSubmit={handleSignup}
      showGoogleLogin={true}
      onGoogleLogin={handleGoogleSignUp}
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerLinkHref="/signin"
      secondaryFooterText="Are you a Club / Organization?"
      secondaryFooterLinkText="Request Access"
      secondaryFooterLinkHref="/auth/club-request"
    />
  );
}