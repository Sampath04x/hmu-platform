"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { LockKeyholeIcon } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value !== "" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    let i = 0;
    for (const char of pastedData) {
      newOtp[i] = char;
      i++;
    }
    setOtp(newOtp);
    if (i < 6) {
      inputRefs.current[i]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join("").length === 6) {
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border glow-hover">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20">
            <LockKeyholeIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-3xl font-sora font-bold mb-2">Check Your Email</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              We sent a 6-digit code to <span className="text-white font-medium">priya@bits-pilani.ac.in</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-2 sm:gap-4">
              {otp.map((data, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={data}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-sora font-semibold bg-background border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              ))}
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-semibold bg-indigo-500 hover:bg-indigo-600 rounded-xl" disabled={otp.join("").length !== 6}>
              Verify Email
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pb-8">
          {timer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="text-indigo-400 font-mono">{timer}s</span>
            </p>
          ) : (
            <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10" onClick={() => setTimer(60)}>
              Resend code
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-4">Code expires in 10 minutes.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
