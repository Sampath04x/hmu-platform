"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2Icon, ChevronLeftIcon } from "lucide-react";

export default function RevealPage({ params }: { params: { matchId: string } }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="min-h-screen bg-[#04040C] flex flex-col items-center justify-center relative overflow-hidden p-6">
      {/* Radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Back */}
      <Link href={`/connect/${params.matchId}`} className="absolute top-6 left-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-muted-foreground transition-colors">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      </Link>

      {!revealed ? (
        /* --- Pre-reveal --- */
        <div className="flex flex-col items-center text-center gap-8 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Pulsing avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)]">
              <svg viewBox="0 0 60 60" className="w-20 h-20 fill-white/30">
                <polygon points="30,5 55,50 5,50" />
                <circle cx="30" cy="30" r="12" className="fill-white/20" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-[-8px] rounded-full border border-indigo-500/20 animate-ping" style={{ animationDuration: '3s' }} />
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-sora font-bold text-white">Ember</div>
            <p className="text-xl text-muted-foreground font-medium">wants to reveal.</p>
            <p className="text-sm text-muted-foreground/70 leading-relaxed mt-4">
              Once you both accept, you&apos;ll see each other.<br />This can&apos;t be undone.
            </p>
          </div>

          <div className="w-full space-y-3 mt-2">
            <Button
              onClick={() => setRevealed(true)}
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]"
            >
              Yes, reveal 🔥
            </Button>
            <Link href={`/connect/${params.matchId}`}>
              <Button
                variant="ghost"
                className="w-full h-12 text-base text-muted-foreground hover:text-white hover:bg-white/5 rounded-2xl transition-colors"
              >
                Not yet
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground/50 mt-4">
            You&apos;ve exchanged 5 voice messages over 12 days.
          </p>
        </div>
      ) : (
        /* --- Post-reveal --- */
        <div className="flex flex-col items-center text-center gap-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-700">
          {/* Confetti dots */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-ping"
                style={{
                  left: `${10 + (i * 4.2) % 80}%`,
                  top: `${5 + (i * 13) % 60}%`,
                  backgroundColor: ["#6366F1", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"][i % 5],
                  animationDuration: `${1 + (i % 3) * 0.5}s`,
                  animationDelay: `${(i * 0.1) % 1}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>

          {/* Revealed Profile Photo */}
          <div className="relative">
            <Avatar className="w-36 h-36 border-4 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.4)]">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-5xl font-sora font-bold">
                P
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-background shadow-lg">
              <CheckCircle2Icon className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-sora font-bold text-white">Priya Sharma</h2>
            <p className="text-muted-foreground font-medium">ECE &middot; 3rd Year</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-xs text-emerald-400 font-medium">Verified Student</span>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 space-y-1">
            <p className="text-xl font-sora font-semibold text-white">
              You matched with someone real.
            </p>
            <p className="text-sm text-muted-foreground">
              You&apos;ve been talking for 12 days.
            </p>
          </div>

          <Link href="/profile/arjun-k" className="w-full">
            <Button className="w-full h-14 text-lg font-semibold rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
              View Full Profile →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
