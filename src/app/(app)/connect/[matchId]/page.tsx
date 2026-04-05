"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, MoreVerticalIcon, SparkleIcon, MicIcon, TypeIcon, ChevronDownIcon, ShieldIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";

// ─── Waveform bubble ────────────────────────────────────────────────────────
const messages = [
  { id: 1, own: false, duration: "0:47", timestamp: "Yesterday", waveHeights: [3,6,8,5,9,4,7,10,6,3,8,5,4,9,7,6,4,8,5,3] },
  { id: 2, own: true,  duration: "1:23", timestamp: "Yesterday", heard: true, waveHeights: [5,9,6,4,10,7,3,8,5,9,4,6,8,3,7,5,9,4,6,8] },
  { id: 3, own: false, duration: "0:52", timestamp: "2h ago",    waveHeights: [4,7,5,9,3,8,6,4,10,5,7,3,9,6,4,8,5,7,3,6] },
  { id: 4, own: true,  duration: "1:04", timestamp: "2h ago",    heard: true, waveHeights: [8,4,6,9,5,3,7,10,4,6,8,3,5,9,7,4,6,8,3,5] },
  { id: 5, own: false, duration: "0:38", timestamp: "Just now",  waveHeights: [3,5,8,6,9,4,7,5,10,3,6,8,4,7,5,9,3,6,8,4] },
];

function GeometricAvatar({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-9 h-9", md: "w-12 h-12", lg: "w-20 h-20" };
  const innerMap = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-12 h-12" };
  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.4)]`}>
      <svg viewBox="0 0 40 40" className={`${innerMap[size]} fill-white/30`}>
        <polygon points="20,3 37,34 3,34" />
        <circle cx="20" cy="20" r="7" className="fill-white/15" />
      </svg>
    </div>
  );
}

function Waveform({ heights, own }: { heights: number[]; own: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full ${own ? "bg-indigo-200/80" : "bg-muted-foreground/60"}`}
          style={{ height: `${h * 2.8}px` }}
        />
      ))}
    </div>
  );
}

export default function MatchPage() {
  const { name } = useUser();
  const [isRecording, setIsRecording] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const exchangeCount = messages.length;

  return (
    <div className="min-h-screen bg-[#05050E] flex flex-col relative overflow-hidden">
      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#05050E] to-transparent pointer-events-none z-10" />

      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06] relative z-20 bg-[#05050E]/90 backdrop-blur-md shrink-0 md:ml-[80px] lg:ml-[240px]">
        <Link href="/connect">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
            <ChevronLeftIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </Link>

        {/* Anonymous identity — no real name, only codename */}
        <div className="flex flex-col items-center gap-1">
          <GeometricAvatar size="md" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-dmserif font-semibold text-white">Ember</span>
            <div className="flex items-center gap-1 bg-brand/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
              <ShieldIcon className="w-2.5 h-2.5 text-brand" />
              <span className="text-[10px] text-brand font-semibold">Anonymous</span>
            </div>
          </div>
        </div>

        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-muted-foreground">
          <MoreVerticalIcon className="w-5 h-5" />
        </button>
      </header>

      {/* Shared interest + anonymity disclaimer */}
      <div className="flex flex-col items-center gap-2 pt-3 pb-1 relative z-20 shrink-0 md:ml-[80px] lg:ml-[240px]">
        <span className="text-xs bg-brand/10 text-brand border border-indigo-500/20 px-3 py-1 rounded-full font-medium">
          📷 Both into Photography
        </span>
        <span className="text-[11px] text-muted-foreground/50">
          No names · No photos · No pressure
        </span>
      </div>

      {/* ─── Voice Message Thread ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 relative z-20 pb-[220px] md:ml-[80px] lg:ml-[240px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.own ? "justify-end" : "justify-start"} items-end gap-2.5`}>
            {!msg.own && <GeometricAvatar size="sm" />}

            <div className={`max-w-[270px] flex flex-col gap-1 ${msg.own ? "items-end" : "items-start"}`}>
              <div
                className={`px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg ${
                  msg.own
                    ? "bg-brand rounded-tr-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    : "bg-white/[0.06] border border-white/[0.08] rounded-tl-sm"
                }`}
              >
                {/* Play button */}
                <button
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                    msg.own ? "bg-indigo-400/40 hover:bg-indigo-400/60" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current ml-0.5">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </button>

                <div className="flex flex-col gap-1.5">
                  <Waveform heights={msg.waveHeights} own={msg.own} />
                  <span className={`text-xs font-mono ${msg.own ? "text-indigo-200/70" : "text-muted-foreground"}`}>
                    {msg.duration}
                  </span>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-1 ${msg.own ? "flex-row-reverse" : "flex-row"}`}>
                <span className="text-[11px] text-muted-foreground/50">{msg.timestamp}</span>
                {msg.own && msg.heard && (
                  <span className="text-[11px] text-brand font-medium">Heard ✓</span>
                )}
              </div>
            </div>

            {/* Self side: show a blurred circle (no real photo) */}
            {msg.own && (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand/30 to-rose-500/20 flex items-center justify-center shrink-0 border border-white/10 text-white/50 text-xs font-bold">
                {name?.[0] || 'U'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#05050E]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 pt-3 pb-8 md:pl-[calc(80px+1rem)] lg:pl-[calc(240px+1rem)]">
        {/* Reveal button if ≥5 exchanges */}
        {exchangeCount >= 5 && (
          <Link href="/connect/reveal/match-ember">
            <button className="w-full mb-3 py-3 rounded-2xl bg-gradient-to-r from-brand to-accent text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all">
              <SparkleIcon className="w-4 h-4" />
              Ready to reveal? · 5 exchanges done
            </button>
          </Link>
        )}

        {/* Weekly Prompt */}
        <button
          onClick={() => setPromptExpanded(!promptExpanded)}
          className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 mb-3 hover:bg-white/[0.07] transition-colors"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <SparkleIcon className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-xs text-muted-foreground font-medium truncate">
              {promptExpanded
                ? "What's something you're genuinely good at that nobody knows about?"
                : "This week's prompt — tap to expand"
              }
            </span>
          </div>
          <ChevronDownIcon className={`w-4 h-4 text-muted-foreground/50 shrink-0 ml-2 transition-transform ${promptExpanded ? "rotate-180" : ""}`} />
        </button>

        {/* Recording controls */}
        <div className="flex items-center gap-3">
          <button className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <MicIcon className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="relative">
              <button
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                onTouchStart={() => setIsRecording(true)}
                onTouchEnd={() => setIsRecording(false)}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 select-none ${
                  isRecording
                    ? "bg-rose-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                    : "bg-brand shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-400 active:scale-95"
                }`}
              >
                <MicIcon className="w-7 h-7 text-white" />
              </button>
              {isRecording && (
                <span className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ping pointer-events-none" />
              )}
            </div>
            <span className="text-[11px] text-muted-foreground/50">
              {isRecording ? "Recording… release to send" : "Hold to record"}
            </span>
          </div>

          <button className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <TypeIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
