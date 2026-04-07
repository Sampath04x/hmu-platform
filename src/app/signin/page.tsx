"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SigninPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.email) {
      setError("Please enter your email.");
      setLoading(false);
      return;
    }

    try {
      if (authMode === "password") {
        if (!formData.password) throw new Error("Please enter your password.");
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (authError) throw authError;

        if (data?.session) {
          router.push("/");
        }
      } else {
        // OTP Mode
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: formData.email,
        });
        if (authError) throw authError;
        router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err: any) {
      setError(err.message || "Invalid login credentials.");
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
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Sign in to continue to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={authMode === "password" ? "default" : "outline"}
              className={`flex-1 ${authMode === "password" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-zinc-800 text-zinc-300"}`}
              onClick={() => { setError(null); setAuthMode("password"); }}
            >
              Password
            </Button>
            <Button
              variant={authMode === "otp" ? "default" : "outline"}
              className={`flex-1 ${authMode === "otp" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-zinc-800 text-zinc-300"}`}
              onClick={() => { setError(null); setAuthMode("otp"); }}
            >
              <Mail className="w-4 h-4 mr-2" /> OTP
            </Button>
          </div>

          <form onSubmit={handleSignin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm text-center">
                {error}
              </div>
            )}

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

            {authMode === "password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">Password</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-indigo-500"
                  required={authMode === "password"}
                />
              </div>
            )}

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium mt-4"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {authMode === "password" ? "Sign In" : "Send OTP"} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-zinc-800/50 pt-4">
          <p className="text-sm text-zinc-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
