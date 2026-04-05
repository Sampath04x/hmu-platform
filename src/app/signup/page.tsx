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
import { apiFetch, setAuthToken } from "@/lib/apiClient";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { setName, setEmail: setGlobalEmail, interests, aiProfile } = useUser();
  const [nameInput, setNameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [authorizedPerson, setAuthorizedPerson] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isClubEmail = emailInput.toLowerCase().endsWith("_vsp@gitam.in");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    try {
      const payload: any = {
        name: nameInput,
        username: usernameInput.toLowerCase().trim(),
        email: emailInput,
        password: passwordInput,
        interests: interests,
        aiProfile: aiProfile,
        phone: phoneInput || null,
      };

      if (isClubEmail) {
        payload.club_details = {
          description: clubDescription,
          authorized_person: authorizedPerson,
          requested_at: new Date().toISOString(),
        };
      }

      await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setName(nameInput);
      setGlobalEmail(emailInput);
      // Show success briefly before redirecting
      const btn = document.getElementById("signup-btn");
      if (btn) {
        btn.textContent = isClubEmail ? "Application Sent! Redirecting..." : "Success! Redirecting...";
        btn.classList.add("bg-emerald-500", "hover:bg-emerald-600");
      }
      setTimeout(() => {
        router.push('/verify');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign up");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 rounded-full blur-[100px] pointer-events-none" />

      <Link href="/" className="mb-8 flex flex-col items-center gap-2 group">
        <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center font-dmserif font-bold text-white tracking-widest text-sm shadow-[0_0_20px_rgba(194,105,42,0.3)] group-hover:scale-105 transition-transform">
          intrst
        </div>
      </Link>

      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border glow-hover">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-playfair font-bold">
            {isClubEmail ? "Club Application" : "Join intrst"}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {isClubEmail 
              ? "Register your organization for official verification." 
              : "Your college email only. No exceptions."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-4">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{isClubEmail ? "Club/Organization Name" : "Full Name"}</Label>
              <Input 
                id="name" 
                placeholder={isClubEmail ? "Rotaract Club" : "Priya Sharma"} 
                className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-brand" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="priya_2024" 
                className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-brand" 
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required 
              />
              <p className="text-[10px] text-muted-foreground ml-1">Must be unique. This is how others will find you.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">College Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name_vsp@gitam.in (Clubs) or student@gitam.edu" 
                className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-brand" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required 
              />
              {!isClubEmail && (
                <div className="text-xs text-muted-foreground bg-accent/10 p-2 rounded-lg border border-accent/20">
                  <p>Only <span className="font-bold">@student.gitam.edu</span> or <span className="font-bold">@gitam.in</span> emails are allowed.</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Using another email?</span>
                    <a 
                      href="#"
                      className="text-brand font-semibold underline hover:opacity-80"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = "mailto:intrst2026@gmail.com?subject=Manual Verification Request";
                      }}
                    >
                      Manual Verification
                    </a>
                  </div>
                </div>
              )}
            </div>

            {isClubEmail && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 pt-2 pb-2">
                <div className="space-y-2">
                  <Label htmlFor="authorizedPerson">Authorized Representative Name</Label>
                  <Input 
                    id="authorizedPerson" 
                    placeholder="Club President / Secretary" 
                    className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-brand" 
                    value={authorizedPerson}
                    onChange={(e) => setAuthorizedPerson(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Number</Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 00000 00000" 
                    className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-brand" 
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Club Description / Bio</Label>
                  <textarea 
                    id="description" 
                    placeholder="Tell us about your club's mission and activities..." 
                    className="w-full bg-background/50 border border-border rounded-xl p-3 focus-visible:ring-brand min-h-[100px] outline-none text-sm text-white" 
                    value={clubDescription}
                    onChange={(e) => setClubDescription(e.target.value)}
                    required 
                  />
                </div>
                <div className="text-xs text-amber-400 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                  Note: Club accounts require manual review by founders. You will be notified via email once approved.
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-brand pr-10" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
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
              <Input 
                id="confirm-password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="bg-background/50 border-border h-12 rounded-xl focus-visible:ring-brand" 
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                required 
              />
            </div>

            <Button id="signup-btn" disabled={isLoading} type="submit" className="w-full h-12 text-base font-semibold bg-brand hover:opacity-90 rounded-xl mt-6">
              {isLoading ? "Creating Account..." : "Create Account"}
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

          <Button variant="outline" className="w-full h-12 text-base border-brand/30 text-brand hover:bg-brand/10 rounded-xl">
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
            <Link href="/signin" className="text-brand hover:text-accent font-medium transition-colors">
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
