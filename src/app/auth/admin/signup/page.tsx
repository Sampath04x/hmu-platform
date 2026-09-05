"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import SignupView, { SignupFormData } from "@/components/auth/SignupView";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";

export default function AdminSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (formData: SignupFormData) => {
    setLoading(true);
    setError(null);

    // Basic local validation
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
      const normalizedEmail = formData.email.trim().toLowerCase();

      // 1. Validate entered email against admin_whitelist table in Supabase.
      const { data: adminData, error: adminError } = await supabase
        .from("admin_whitelist")
        .select("email")
        .eq("email", normalizedEmail)
        .eq("is_active", true)
        .maybeSingle();

      if (adminError || !adminData) {
        throw new Error("This email is not authorized for an Admin account.");
      }

      // 2. Check username availability
      try {
        const usernameCheck = await apiFetch(`/auth/check-username/${formData.displayName}`, {
          requireAuth: false,
        });
        if (!usernameCheck.available) {
          throw new Error("Username is already taken.");
        }
      } catch (checkErr: any) {
        if (checkErr.message === "Username is already taken.") throw checkErr;
      }

      // 3. Proceed with Supabase Signup
      const { error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
      });

      if (authError) throw authError;

      // 4. Set pending profile so verify page routes to admin setup
      sessionStorage.setItem("admin_pending_profile", JSON.stringify({
        name: formData.name,
        displayName: formData.displayName,
        email: normalizedEmail,
        timestamp: new Date().getTime(),
      }));
      
      // Navigate to verify page with isAdmin flag
      router.push(`/verify?email=${encodeURIComponent(normalizedEmail)}&type=signup&isAdmin=true`);
    } catch (err: any) {
      console.error("Admin signup process failed:", err);
      setError(err.message || "An error occurred during admin signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupView
      title={<>Create <span className="font-serif italic font-normal text-[#855300]">Admin</span> Account</>}
      subtitle="Create your administrator account to manage Intrst."
      buttonText={<>Create Admin Account <ArrowUpRight size={14} className="ml-1.5" /></>}
      loading={loading}
      error={error}
      onSubmit={handleSignup}
      showGoogleLogin={false}
      footerText="Already have an admin account?"
      footerLinkText="Sign In"
      footerLinkHref="/signin"
      rightColumnHeader={
        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-[#0f0f10] leading-[1.1] mb-4 w-full max-w-none">
          <span>Manage your</span>
          <br />
          <span className="bg-gradient-to-r from-[#855300] to-[#505f78] bg-clip-text text-transparent font-serif italic font-normal pr-4 inline-block">
            platform.
          </span>
          <br />
          <span>Empower students.</span>
        </h1>
      }
    />
  );
}
