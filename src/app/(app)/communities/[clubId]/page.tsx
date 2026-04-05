"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, ShareIcon, UsersIcon, CalendarIcon, MapPinIcon, LinkIcon } from "lucide-react";

export default function ClubPage() {
  const [activeTab, setActiveTab] = useState("Posts");

  const club = {
    name: "Photography Club",
    category: "Media",
    members: 189,
    verified: true,
    description: "The official photography club of the campus. Capturing moments and teaching the art.",
    founded: 2018,
    advisor: "Dr. A. Verma",
    initials: "PC",
    isJoined: false
  };

  const tabs = ["Posts", "Events", "Members", "About"];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cover Banner */}
      <div className="h-48 md:h-64 w-full bg-gradient-to-r from-brand/20 via-accent/20 to-brand/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 md:-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex items-end gap-5">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-brand to-accent text-white font-bold text-4xl md:text-5xl flex items-center justify-center border-[6px] border-background shadow-2xl shrink-0">
              {club.initials}
            </div>
            
            <div className="mb-2 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-medium rounded-md">{club.category}</Badge>
                {club.verified && (
                  <Badge variant="outline" className="border-accent/30 text-accent gap-1 rounded-md">
                    <CheckCircle2Icon className="w-3.5 h-3.5" /> Verified
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-dmserif font-bold text-white leading-tight">{club.name}</h1>
              
              <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <Avatar key={i} className="w-6 h-6 border-2 border-background">
                      <AvatarFallback className="bg-muted text-xs">P</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span>{club.members} members</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-2 shrink-0">
            <Button className="w-full md:w-32 bg-brand hover:bg-brand/90 text-white font-semibold shadow-[0_0_15px_rgba(139,139,67,0.3)] transition-all">
              Join Club
            </Button>
            <Button variant="ghost" className="px-3 border border-border text-muted-foreground hover:text-white hover:bg-card transition-colors">
              <ShareIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-border/40 mb-6 sticky top-[64px] md:top-0 bg-background/90 backdrop-blur-md z-30 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === tab ? 'text-white' : 'text-muted-foreground hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand shadow-[0_0_10px_rgba(139,139,67,0.5)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === "Posts" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="p-5 bg-card border-border/50 glow-hover">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand/20 text-brand font-bold flex items-center justify-center text-sm">{club.initials}</div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Announcement</h4>
                    <p className="text-xs text-muted-foreground">3h ago &middot; Admin</p>
                  </div>
                  <Badge className="ml-auto h-6 bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20" variant="outline">
                    EVENT
                  </Badge>
                </div>
                <p className="text-foreground text-[15px] leading-relaxed mb-4">
                  Photowalk this Saturday! We&apos;ll be covering the old campus architecture. Bring your DSLRs or just your phones. Everyone is welcome.
                </p>
                <div className="w-full h-48 bg-muted rounded-xl bg-gradient-to-br from-brand/10 to-transparent flex items-center justify-center text-muted-foreground border border-border/50">
                  [Image Placeholder]
                </div>
              </Card>

              <Card className="p-5 bg-card border-border/50 glow-hover">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand/20 text-brand font-bold flex items-center justify-center text-sm">{club.initials}</div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Workshop</h4>
                    <p className="text-xs text-muted-foreground">2d ago &middot; Admin</p>
                  </div>
                </div>
                <p className="text-foreground text-[15px] leading-relaxed">
                  Thanks to everyone who joined the editing workshop yesterday! The Lightroom presets have been shared in the group chat.
                </p>
              </Card>
            </div>
          )}

          {activeTab === "Events" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {[1, 2].map((i) => (
                <Card key={i} className="overflow-hidden bg-card border-border/50 glow-hover flex flex-col sm:flex-row group transition-all">
                  <div className="w-full sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-brand/20 to-accent/10 group-hover:from-brand/30 transition-colors flex items-center justify-center shrink-0 border-r border-border/30">
                    <CalendarIcon className="w-8 h-8 text-brand/50" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <Badge className="bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 mb-2">SAT, 6:00 AM</Badge>
                        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">34 Going</span>
                      </div>
                      <h3 className="text-lg font-dmserif font-semibold text-white group-hover:text-brand transition-colors">Weekly Campus Photowalk</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><MapPinIcon className="w-4 h-4" /> Main Gate</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="bg-brand hover:bg-brand/90 text-white font-semibold flex-1 shadow-[0_0_10px_rgba(139,139,67,0.2)]">Going</Button>
                      <Button size="sm" variant="outline" className="border-border hover:bg-muted text-muted-foreground hover:text-white flex-1 transition-colors">Interested</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "Members" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {Array(8).fill(0).map((_, i) => (
                <Card key={i} className="p-4 flex flex-col items-center justify-center text-center bg-card border-border/50 hover:bg-card/80 transition-colors cursor-pointer group">
                  <Avatar className="w-16 h-16 mb-3 border-2 border-transparent group-hover:border-brand/50 transition-colors shadow-lg">
                    <AvatarFallback className="bg-brand/10 text-brand font-bold text-lg">P{i}</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-white text-sm">Priya S.</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">3rd Year</p>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "About" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="p-6 bg-card border-border/50">
                <h3 className="text-lg font-dmserif font-semibold mb-3">About {club.name}</h3>
                <p className="text-muted-foreground leading-relaxed select-none">
                  {club.description}
                </p>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-5 bg-card border-border/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Founded</h4>
                    <p className="text-sm text-muted-foreground">{club.founded}</p>
                  </div>
                </Card>
                <Card className="p-5 bg-card border-border/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Faculty Advisor</h4>
                    <p className="text-sm text-muted-foreground">{club.advisor}</p>
                  </div>
                </Card>
              </div>

              <Card className="p-6 bg-card border-border/50">
                <h3 className="text-lg font-dmserif font-semibold mb-3">Links</h3>
                <div className="space-y-3">
                  <a href="#" className="flex items-center gap-3 text-brand hover:text-accent transition-colors group">
                    <LinkIcon className="w-4 h-4 bg-brand/10 p-1 rounded-md box-content group-hover:bg-brand/20" /> 
                    <span className="font-medium text-sm">instagram.com/photoclub</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 text-brand hover:text-accent transition-colors group">
                    <LinkIcon className="w-4 h-4 bg-brand/10 p-1 rounded-md box-content group-hover:bg-brand/20" /> 
                    <span className="font-medium text-sm">photoclub.compus.edu</span>
                  </a>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
