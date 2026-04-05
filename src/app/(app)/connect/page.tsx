"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EyeIcon, SparkleIcon, MicIcon, HeartHandshakeIcon } from "lucide-react";

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-[#07070D] pb-28 relative overflow-hidden">
      {/* Vignette / intimate background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(194,105,42,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-6 relative z-10">
        {/* Header */}
        <div className="mb-10 mt-2">
          <h1 className="text-4xl font-dmserif font-bold text-white">Connect</h1>
          <p className="text-muted-foreground mt-1">Talk before you see. Reveal when you&apos;re ready.</p>
        </div>

        {/* Active Match Card */}
        <div className="relative mb-8">
          {/* Glow ring behind card */}
          <div className="absolute inset-0 bg-brand/15 rounded-3xl blur-xl pointer-events-none" />
          
          <Card className="relative bg-gradient-to-br from-brand/20 via-card to-background border border-brand/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(194,105,42,0.15)]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
            
            <div className="p-6 sm:p-8 space-y-6">
              {/* Codename + Avatar */}
              <div className="flex items-center gap-5">
                {/* Geometric anonymous avatar */}
                <div className="relative w-20 h-20 shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center shadow-[0_0_25px_rgba(194,105,42,0.5)]">
                    <svg viewBox="0 0 60 60" className="w-12 h-12 fill-white/30">
                      <polygon points="30,5 55,50 5,50" />
                      <circle cx="30" cy="30" r="12" className="fill-white/20" />
                    </svg>
                  </div>
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-brand/30 animate-ping" style={{ animationDuration: '3s' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-dmserif font-bold text-white">Ember</span>
                    <span className="text-xs bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-full font-medium">Anonymous</span>
                  </div>
                  <div className="text-sm text-accent/80 font-medium flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                    Both into: Photography
                  </div>
                  {/* AI Vibe Teaser */}
                  <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-lg px-2.5 py-1.5 mt-1">
                    <SparkleIcon className="w-3 h-3 text-accent" />
                    <span className="text-[11px] text-accent/90 leading-tight">
                      AI Vibe: <span className="font-semibold">&ldquo;The Creative Minimalist&rdquo;</span> — Connect over abstract frames and deep focus.
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand/5 border border-brand/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-dmserif font-bold text-white">4</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Voice messages</div>
                </div>
                <div className="bg-brand/5 border border-brand/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-dmserif font-bold text-white">2h ago</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Last heard</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-3">
                <Link href="/connect/match-ember" className="flex-1">
                  <Button className="w-full h-12 bg-brand hover:opacity-90 font-semibold text-white rounded-xl shadow-[0_0_20px_rgba(194,105,42,0.3)] transition-all">
                    Open Conversation
                  </Button>
                </Link>
                <Button variant="outline" className="h-12 px-4 border-brand/30 text-brand hover:bg-brand/10 transition-colors rounded-xl">
                  <SparkleIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* Weekly Prompt */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-brand font-semibold tracking-wide uppercase">
                  <SparkleIcon className="w-3.5 h-3.5" />
                  This Week&apos;s Prompt
                </div>
                <p className="text-foreground text-sm leading-relaxed italic">
                  &ldquo;What&rsquo;s something you&rsquo;re genuinely good at that nobody on campus knows about?&rdquo;
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* How It Works */}
        <div className="space-y-4">
          <h2 className="text-lg font-dmserif font-semibold text-muted-foreground">How it works</h2>
          <div className="space-y-3">
            {[
              { icon: HeartHandshakeIcon, title: "Get matched on a shared interest", desc: "We pair you with someone who shares your vibe." },
              { icon: MicIcon, title: "Exchange voice messages anonymously", desc: "No names, no photos. Just voices and words." },
              { icon: EyeIcon, title: "Reveal when you both feel ready", desc: "After 5+ exchanges, you can choose to reveal." },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 bg-card/30 border border-border/30 rounded-2xl p-4 hover:bg-card/50 transition-colors">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
