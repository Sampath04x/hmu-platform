"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";
import {
  SparkleIcon, ArrowRightIcon, ArrowLeftIcon,
  BrainIcon, HeartIcon, ZapIcon
} from "lucide-react";

// ─── Interest palette ─────────────────────────────────────────────────────────
const INTEREST_GROUPS = [
  {
    label: "Arts & Expression", emoji: "🎨",
    items: ["Photography", "Music", "Poetry", "Design", "Film", "Art", "Open Mic", "Writing", "Fashion", "Tattoos", "Sculpture"]
  },
  {
    label: "Tech & Mind", emoji: "💡",
    items: ["Coding", "AI / ML", "Startups", "Finance", "Psychology", "Philosophy", "Robotics", "Chess", "Cybersecurity", "UX/UI", "Web3"]
  },
  {
    label: "Social & Culture", emoji: "🌐",
    items: ["Debate", "Memes", "Anime", "Gaming", "Esports", "Books", "Cafe Hopping", "Night Owls", "K-Drama", "Stand-up", "Volunteering"]
  },
  {
    label: "Body & Movement", emoji: "⚡",
    items: ["Fitness", "Football", "Cricket", "Hiking", "Yoga", "Dance", "Cycling", "Badminton", "Swimming", "Basketball", "Skating"]
  },
  {
    label: "Lifestyle & Energy", emoji: "✨",
    items: ["Cooking", "Travel", "Journaling", "Sustainability", "Thrifting", "Plant Parent", "Astrology", "Spirituality", "Minimalism", "Early Bird", "Coffee Enthusiast"]
  },
];

// ─── Personality teaser descriptions ─────────────────────────────────────────
function TeaserSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-brand/10 rounded-full w-2/3 mx-auto" />
      <div className="h-4 bg-white/5 rounded-full w-full" />
      <div className="h-4 bg-white/5 rounded-full w-4/5 mx-auto" />
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const [step, setStep] = useState<"interests" | "questions" | "reveal">("interests");
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [loading, setLoading] = useState(false);
  const [aiProfile, setAiProfile] = useState<null | {
    personalityType: string;
    vibe: string;
    matchStyle: string;
    compatibleWith: string[];
    matchCodename: string;
    icebreaker: string;
    strengths: string[];
    peopleLookingFor: string;
  }>(null);
  const [isFallback, setIsFallback] = useState(false);

  const { setInterests: setGlobalInterests, setAiProfile: setGlobalAiProfile } = useUser();

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const runAI = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selected, answers }),
      });
      const data = await res.json();
      setAiProfile(data.profile);
      setIsFallback(!!data.fallback);
    } catch {
      setAiProfile({
        personalityType: "The Curious Explorer",
        vibe: "Someone who finds meaning in small details and deep conversations.",
        matchStyle: "You connect slowly but deeply, preferring real over small talk.",
        compatibleWith: ["Creative pursuits", "Intellectual curiosity", "Late-night adventures"],
        matchCodename: "Ember",
        icebreaker: "What's a hobby you picked up that completely changed how you see the world?",
        strengths: ["Deep listener", "Creative thinker", "Genuine connector"],
        peopleLookingFor: "Someone who stays curious and doesn't mind a bit of chaos.",
      });
      setIsFallback(true);
    }
    setLoading(false);
    setStep("reveal");
  };

  const handleNext = () => {
    if (step === "interests" && selected.length >= 3) {
      setStep("questions");
    } else if (step === "questions") {
      runAI();
    }
  };

  const proceed = () => {
    setGlobalInterests(selected);
    if (aiProfile) setGlobalAiProfile(aiProfile);
    router.push("/signup");
  };

  return (
    <div className="min-h-screen bg-[#0F0C0A] flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(194,105,42,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(232,168,124,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* Nav */}
      <header className="flex justify-between items-center px-6 py-5 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-dmserif font-bold text-white text-xs tracking-widest group-hover:scale-105 transition-transform">
            intrst
          </div>
          <span className="font-dmserif font-semibold text-white">intrst</span>
        </Link>
        <Link href="/signup" className="text-sm text-muted-foreground hover:text-white transition-colors">
          Skip →
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start z-10 px-4 pb-16 pt-4">
        <div className="w-full max-w-2xl">

          {/* ─── Step 1: Interests ─────────────────────────────────────────── */}
          {step === "interests" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 px-4 py-2 rounded-full text-brand text-xs font-semibold tracking-wider mb-2">
                  <SparkleIcon className="w-3.5 h-3.5" />
                  DISCOVER YOUR PEOPLE
                </div>
                <h1 className="text-4xl sm:text-5xl font-dmserif font-bold text-white leading-tight">
                  What makes you, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">you?</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Pick everything that resonates. Our AI uses this to build your match profile — before you even sign up.
                </p>
              </div>

              <div className="space-y-5">
                {INTEREST_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{group.emoji}</span>
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{group.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const isSelected = selected.includes(item);
                        return (
                          <button
                            key={item}
                            onClick={() => toggle(item)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                              isSelected
                                ? "bg-brand/20 text-accent border-brand/60 shadow-[0_0_12px_rgba(194,105,42,0.25)]"
                                : "bg-white/[0.03] border-white/[0.08] text-muted-foreground hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-6 pt-6">
                <div className="flex items-center justify-between bg-[#0d0d1a]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-5 py-4">
                  <div>
                    <span className="text-white font-semibold">{selected.length} selected</span>
                    {selected.length < 3 && (
                      <span className="text-muted-foreground text-sm ml-2">(pick at least 3)</span>
                    )}
                  </div>
                  <Button
                    onClick={handleNext}
                    disabled={selected.length < 3}
                    className="bg-brand hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-xl px-6 gap-2 shadow-[0_0_20px_rgba(194,105,42,0.3)]"
                  >
                    Continue <ArrowRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Personal Questions ──────────────────────────────── */}
          {step === "questions" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full text-accent text-xs font-semibold tracking-wider mb-2">
                  <BrainIcon className="w-3.5 h-3.5" />
                  3 QUICK ONES
                </div>
                <h1 className="text-4xl font-dmserif font-bold text-white">
                  Tell us a little more.
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Optional, but the AI gets <span className="text-white font-medium">much better</span> with these. Never shown publicly.
                </p>
              </div>

              <div className="space-y-5">
                {[
                  {
                    key: "q1" as const,
                    q: "What's something most people don't know about you?",
                    hint: "The thing that changes how people see you once they know..."
                  },
                  {
                    key: "q2" as const,
                    q: "What are you actually trying to figure out right now?",
                    hint: "Career, identity, relationships, purpose — any of it works"
                  },
                  {
                    key: "q3" as const,
                    q: "What kind of person do you naturally click with?",
                    hint: "Energy, interests, communication style — describe the vibe"
                  },
                ].map(({ key, q, hint }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-semibold text-accent/90">{q}</label>
                    <button className="hidden" /> {/* wrapper */}
                    <Textarea
                      placeholder={hint}
                      value={answers[key]}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                      maxLength={200}
                      className="min-h-[90px] bg-white/[0.04] border-white/[0.08] focus-visible:border-brand/50 focus-visible:ring-brand/20 text-white placeholder:text-muted-foreground/50 resize-none rounded-xl text-sm"
                    />
                    <p className="text-xs text-right text-muted-foreground/50">{answers[key].length}/200</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("interests")}
                  className="h-12 px-5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 transition-colors rounded-xl gap-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 h-12 bg-gradient-to-r from-brand to-accent hover:opacity-90 text-white font-semibold rounded-xl gap-2 shadow-[0_0_25px_rgba(194,105,42,0.35)]"
                >
                  <ZapIcon className="w-4 h-4" />
                  Analyse My Vibe
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 3: AI Reveal ───────────────────────────────────────── */}
          {(step === "reveal" || loading) && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400 text-xs font-semibold tracking-wider mb-2">
                  <SparkleIcon className="w-3.5 h-3.5" />
                  {loading ? "AI IS THINKING..." : "YOUR VIBE PROFILE"}
                </div>
                <h1 className="text-4xl font-dmserif font-bold text-white">
                  {loading ? "Crunching your personality..." : "Here's what the AI sees."}
                </h1>
                {!loading && (
                  <p className="text-muted-foreground text-lg">
                    This is how our algorithm will find your people.
                  </p>
                )}
              </div>

              {loading && <TeaserSkeleton />}

              {!loading && aiProfile && (
                <div className="space-y-5">
                  {isFallback && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm text-center">
                      ⚠️ Add your Gemini API key in <code className="bg-black/20 px-1.5 py-0.5 rounded">.env.local</code> for live AI analysis. Showing sample profile.
                    </div>
                  )}

                  {/* Personality Type + Codename */}
                  <Card className="bg-gradient-to-br from-brand/20 via-[#120F0D] to-accent/10 border border-brand/25 rounded-3xl overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
                    <div className="p-7 text-center space-y-4">
                      {/* Anonymous avatar */}
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center shadow-[0_0_30px_rgba(194,105,42,0.4)]">
                        <svg viewBox="0 0 50 50" className="w-12 h-12 fill-white/30">
                          <polygon points="25,4 48,43 2,43" />
                          <circle cx="25" cy="25" r="9" className="fill-white/20" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-brand font-semibold uppercase tracking-widest mb-1">
                          Your Match Codename
                        </div>
                        <div className="text-4xl font-dmserif font-bold text-white">{aiProfile.matchCodename}</div>
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-5 py-4">
                        <div className="text-xl font-dmserif font-semibold text-accent mb-1">{aiProfile.personalityType}</div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{aiProfile.vibe}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Match style + Strengths */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <HeartIcon className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">How you connect</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{aiProfile.matchStyle}</p>
                    </Card>
                    <Card className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <ZapIcon className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your strengths</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiProfile.strengths.map((s, i) => (
                          <span key={i} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">{s}</span>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Compatible with */}
                  <Card className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <SparkleIcon className="w-4 h-4 text-brand" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">You&apos;ll click over</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiProfile.compatibleWith.map((c, i) => (
                        <span key={i} className="text-sm bg-brand/10 text-brand border border-brand/20 px-3 py-1.5 rounded-full font-medium">{c}</span>
                      ))}
                    </div>
                  </Card>
 
                  {/* Icebreaker */}
                  <Card className="bg-gradient-to-r from-brand/10 to-accent/5 border border-brand/20 rounded-2xl p-5 space-y-2">
                    <div className="text-xs font-bold text-brand uppercase tracking-widest">Your AI Icebreaker</div>
                    <p className="text-white text-base italic leading-relaxed">&ldquo;{aiProfile.icebreaker}&rdquo;</p>
                    <p className="text-xs text-muted-foreground">This is how your anonymous match will open the conversation.</p>
                  </Card>

                  {/* People looking for */}
                  <Card className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">You&apos;re looking for</div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{aiProfile.peopleLookingFor}</p>
                  </Card>

                  {/* Selected interests summary */}
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                      Your interests ({selected.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.map(tag => (
                        <span key={tag} className="text-xs bg-brand/10 text-brand/80 border border-brand/15 px-3 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={proceed}
                      className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-brand to-accent hover:opacity-90 text-white shadow-[0_0_30px_rgba(194,105,42,0.4)] transition-all"
                    >
                      Claim My Spot on intrst →
                    </Button>
                    <p className="text-xs text-center text-muted-foreground/60">
                      Your profile will be pre-filled with these interests. Verified students only.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
