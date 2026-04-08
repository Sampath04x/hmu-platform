"use client";

import React from "react";
import { ShieldCheckIcon, LockIcon, EyeOffIcon, DatabaseIcon, UserCheckIcon } from "lucide-react";
import Link from "next/link";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-20 px-6">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      
      <div className="max-w-3xl w-full z-10 space-y-12">
        <div className="text-center space-y-4">
          <ShieldCheckIcon className="w-16 h-16 text-brand mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-dmserif font-bold text-white tracking-tight">Privacy Manifesto</h1>
          <p className="text-muted-foreground text-lg">We don&apos;t just protect your data. We respect your anonymity.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <section className="space-y-4 bg-card/20 p-8 rounded-3xl border border-border/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-brand">
              <EyeOffIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-white">Anonymity by Design</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              When using the &quot;Connect&quot; feature, your identity is completely hidden behind an AI-generated codename. No photos, no roll numbers, no social links—until you both choose to reveal.
            </p>
          </section>

          <section className="space-y-4 bg-card/20 p-8 rounded-3xl border border-border/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-brand">
              <DatabaseIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-white">Data Collection</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We collect your Gitam email for verification purposes only. Your specific interest tags and AI profile answers are used to find relevant matches and content. We never sell your data to third parties.
            </p>
          </section>

          <section className="space-y-4 bg-card/20 p-8 rounded-3xl border border-border/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-brand">
              <LockIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-white">Security Infrastructure</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              All communications are handled through a secure backend layer with end-to-end encryption for sensitive profile data. Parallel logins are prohibited to prevent account hijacking.
            </p>
          </section>

          <section className="space-y-4 bg-card/20 p-8 rounded-3xl border border-border/40 backdrop-blur-sm">
             <div className="flex items-center gap-3 text-brand">
              <UserCheckIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-white">Your Control</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              You can request data deletion at any time by contacting us. Admin logs track all sensitive moderator actions to ensure accountability.
            </p>
          </section>
        </div>

        <div className="text-center pt-8">
            <Link href="/" className="text-brand font-medium hover:underline">Return to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
