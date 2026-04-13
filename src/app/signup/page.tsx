"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      // 1. Check if username is available (via backend)
      try {
        const usernameCheck = await apiFetch(`/auth/check-username/${formData.username}`, { 
          requireAuth: false 
        });
        if (!usernameCheck.available) {
          throw new Error("Username is already taken.");
        }
      } catch (checkErr: any) {
        console.error("Username check failed:", checkErr);
        if (checkErr.message === "Username is already taken.") throw checkErr;
        // If it's a network error, we might want to proceed or warn. For now, we proceed.
      }

      // 2. Sign up with Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error("Supabase Auth Error:", authError);
        throw authError;
      }

      // 3. Store initial profile data in sessionStorage for the /verify step
      // The verify step will use this to hit /auth/initialize-profile
      sessionStorage.setItem("intrst_pending_profile", JSON.stringify({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        timestamp: new Date().getTime()
      }));

      // 4. Redirect to verification or onboarding
      if (data?.session) {
        try {
          await apiFetch("/auth/initialize-profile", {
            method: "POST",
            body: JSON.stringify({
              user_id: data.user?.id,
              email: formData.email,
              name: formData.name,
              username: formData.username,
            }),
          });
        } catch (initErr) {
          console.error("Auto-initialization failed:", initErr);
        }
        router.push("/onboarding");
      } else {
        // Email confirmation is enabled, redirect to verify
        router.push(`/verify?email=${encodeURIComponent(formData.email)}&type=signup`);
      }
    } catch (err: any) {
      console.error("Signup process failed:", err);
      setError(err.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <Card className="w-full max-w-md z-10 border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            Join Platform
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Create an account to start connecting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="johndoe123"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
              <Input
                id="email"
                name="email"
                placeholder="name@university.edu"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-indigo-500"
                required
                minLength={6}
              />
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>


        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-zinc-800/50 pt-4 px-6">
          <p className="text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
          <div className="pt-2 border-t border-zinc-800/30 w-full text-center">
            <p className="text-xs text-zinc-500">
              Are you a Club / Organization?{" "}
              <Link href="/auth/club-request" className="text-zinc-400 hover:text-white font-semibold transition-colors">
                Request Access
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
