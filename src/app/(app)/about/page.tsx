"use client";

import React from "react";
import { MailIcon, SparklesIcon, UsersIcon, ShieldCheckIcon, GlobeIcon, Share2Icon } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-20 px-6">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700"></div>

      <div className="max-w-4xl w-full z-10 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium animate-fade-in">
            <SparklesIcon className="w-4 h-4" />
            <span>The Honest Campus Layer</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-dmserif font-bold tracking-tight text-white animate-slide-up">
            About <span className="text-brand">intrst</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
            For 13,000+ GITAM students, there was no single honest platform. 
            Official channels are curated. WhatsApp groups are chaotic. 
          </p>
        </div>

        {/* Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up delay-200">
          <div className="p-8 rounded-3xl bg-card/30 border border-border/40 backdrop-blur-xl hover:border-brand/40 transition-all hover:-translate-y-1 group">
            <UsersIcon className="w-10 h-10 text-brand mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-3">By Students</h3>
            <p className="text-muted-foreground leading-relaxed">
              Built and run entirely by students who understand what campus life actually needs.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-card/30 border border-border/40 backdrop-blur-xl hover:border-brand/40 transition-all hover:-translate-y-1 group">
            <ShieldCheckIcon className="w-10 h-10 text-brand mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-3">Honest Truth</h3>
            <p className="text-muted-foreground leading-relaxed">
              Real reviews, real ratings. No corporate filters, just raw student perspectives.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-card/30 border border-border/40 backdrop-blur-xl hover:border-brand/40 transition-all hover:-translate-y-1 group">
            <SparklesIcon className="w-10 h-10 text-brand mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-3">Utility First</h3>
            <p className="text-muted-foreground leading-relaxed">
              From canteens to professors, we provide the tools you need to navigate GITAM.
            </p>
          </div>
        </div>

        {/* The Why Section */}
        <div className="rounded-3xl bg-gradient-to-br from-brand/20 to-transparent p-1">
          <div className="bg-background/80 backdrop-blur-md rounded-[calc(1.5rem-1px)] p-10 md:p-16 space-y-8">
            <h2 className="text-4xl font-dmserif font-bold text-white">Why intrst?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We found that institutional knowledge at GITAM was trapped in fragmented silos. Seniors knew which electives were easy, which canteens had the best meals, and which clubs were worth joining—but juniors had to learn this the hard way.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  intrst was born to democratize this knowledge. We are the digital commons where students share, connect, and grow without the noise.
                </p>
              </div>
              <div className="space-y-6">
                <blockquote className="border-l-4 border-brand pl-6 py-2 italic text-lg text-white/90">
                  &quot;intrst is the honest campus layer that should have existed from day one.&quot;
                </blockquote>
                <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                    <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center font-bold text-brand">F</div>
                    <div>
                        <div className="text-white font-bold">The Founders</div>
                        <div className="text-sm text-muted-foreground">Class of &apos;26</div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-3xl border border-border/40 bg-card/10">
            <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">Have questions?</h3>
                <p className="text-muted-foreground">We&apos;re always open to feedback and collaboration.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
                <a 
                    href="mailto:intrst2026@gmail.com" 
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-black font-bold hover:bg-brand hover:text-white transition-all shadow-xl"
                >
                    <MailIcon className="w-5 h-5" />
                    <span>Contact Us</span>
                </a>
                <div className="flex items-center gap-3">
                    <a href="https://instagram.com/intrst.in" target="_blank" className="p-3 rounded-2xl border border-border/40 hover:text-brand hover:border-brand/40 transition-colors">
                        <Share2Icon className="w-6 h-6" />
                    </a>
                    <a href="https://github.com/Sampath04x/hmu-platform" target="_blank" className="p-3 rounded-2xl border border-border/40 hover:text-brand hover:border-brand/40 transition-colors">
                        <GlobeIcon className="w-6 h-6" />
                    </a>
                </div>
            </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="mt-20 flex flex-col items-center gap-2 text-muted-foreground animate-bounce opacity-50">
        <span className="text-[10px] uppercase tracking-widest font-bold">Built for GITAM</span>
        <div className="w-1 h-8 bg-brand/20 rounded-full"></div>
      </div>
    </div>
  );
};

export default AboutPage;
