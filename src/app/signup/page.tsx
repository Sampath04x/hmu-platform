"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/context/UserContext";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { setName, setEmail: setGlobalEmail } = useUser();
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setName(nameInput);
    setGlobalEmail(emailInput);
    router.push('/verify');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Link href="/" className="mb-8 flex flex-col items-center gap-2 group">
        <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center font-sora font-bold text-white tracking-widest text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform">
          HMU
        </div>
      </Link>

      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border glow-hover">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-sora font-bold">Join HMU</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Your college email only. <span className="text-indigo-400 font-medium">No exceptions.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Priya Sharma" 
                className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-indigo-500" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">College Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="priya@bits-pilani.ac.in" 
                className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-indigo-500" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required 
              />
              <p className="text-xs text-muted-foreground">Must be your institutional email (e.g., .edu or .ac.in)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-indigo-500 pr-10" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-indigo-500" required />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold bg-indigo-500 hover:bg-indigo-600 rounded-xl mt-6">
              Create Account
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-12 text-base border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl">
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-6 pb-8">
          <div className="text-center text-sm text-muted-foreground w-full">
            Already have an account?{" "}
            <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-background/50 py-3 px-4 rounded-xl border border-border/50">
            <LockIcon className="w-4 h-4 text-emerald-500" />
            Verified students only. Your identity stays private.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
