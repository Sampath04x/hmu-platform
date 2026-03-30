"use client";

import Link from "next/link";
import { SearchIcon, CheckCircle2Icon, UsersIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CommunitiesPage() {
  const trendingClubs = [
    { id: "gdsc", name: "Google Developer Student Club", category: "Technical", members: 340, verified: true, joined: true },
    { id: "photo", name: "Photography Club", category: "Media", members: 189, verified: true, joined: false },
    { id: "lit", name: "Lit Society", category: "Cultural", members: 156, verified: true, joined: false },
    { id: "fc", name: "FC Campus", category: "Sports", members: 267, verified: false, joined: false },
    { id: "startup", name: "Startup Cell", category: "Technical", members: 198, verified: true, joined: false },
    { id: "debate", name: "Debate Union", category: "Cultural", members: 134, verified: false, joined: false }
  ];

  const interestGroups = [
    { name: "Chess Club", members: 45 },
    { name: "Anime Watchers", members: 112 },
    { name: "Cafe Hoppers", members: 89 },
    { name: "Night Owls", members: 230 }
  ];

  return (
    <div className="min-h-screen bg-background relative pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-sora font-semibold text-white">Communities</h1>
        <p className="text-muted-foreground">Find where you belong on campus.</p>
      </div>

      <div className="relative mb-10 text-white focus-within:text-white group">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
        <Input 
          type="text" 
          placeholder="Search clubs, groups, interests..." 
          className="pl-12 h-14 bg-card border-border rounded-xl focus-visible:ring-indigo-500 font-medium placeholder:font-normal text-base shadow-[0_0_20px_rgba(0,0,0,0.2)] group-focus-within:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all"
        />
      </div>

      {/* Your Clubs */}
      <section className="mb-12">
        <h2 className="text-xl font-sora font-semibold mb-4">Your Clubs</h2>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
          {trendingClubs.filter(c => c.joined).map(club => (
            <Link key={club.id} href={`/communities/${club.id}`} className="shrink-0 w-64 snap-start">
              <Card className="flex items-center gap-3 p-3 bg-card border-border/50 glow-hover hover:scale-105 transition-all">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg">
                  {club.name[0]}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-sm truncate">{club.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{club.members} members</p>
                </div>
              </Card>
            </Link>
          ))}
          <div className="shrink-0 w-64 snap-start">
            <Card className="flex items-center gap-3 p-3 bg-card border-border border-dashed hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors cursor-pointer justify-center h-[74px]">
              <p className="font-medium text-indigo-400 text-sm">Explore more +</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Trending on Campus */}
      <section className="mb-12">
        <h2 className="text-xl font-sora font-semibold mb-4">Trending on Campus</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingClubs.map(club => (
            <Card key={club.id} className="overflow-hidden bg-card border-border/50 glow-hover group relative">
              <Link href={`/communities/${club.id}`} className="absolute inset-0 z-10" aria-label={`View ${club.name}`}></Link>
              
              <div className="h-24 bg-gradient-to-br from-indigo-500/20 to-violet-500/5 group-hover:from-indigo-500/30 transition-colors relative">
                {/* Abstract pattern placeholder */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
              </div>
              
              <div className="px-5 pb-5 pt-0 relative z-20">
                <div className="flex justify-between items-end mb-3">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold text-2xl flex items-center justify-center -mt-8 border-[4px] border-card shadow-lg ring-1 ring-border">
                    {club.name[0]}
                  </div>
                  {club.joined ? (
                    <Button variant="outline" className="h-8 px-3 text-xs bg-card hover:bg-muted font-medium z-30" disabled>Joined</Button>
                  ) : (
                    <Button className="h-8 px-5 text-xs bg-indigo-500 hover:bg-indigo-600 font-semibold z-30 pointer-events-auto shadow-[0_0_10px_rgba(99,102,241,0.3)]">Join</Button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-sora font-semibold text-lg text-white group-hover:text-indigo-400 transition-colors leading-tight">{club.name}</h3>
                  {club.verified && <CheckCircle2Icon className="w-4 h-4 text-blue-500 fill-blue-500/20" />}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span className="bg-muted/50 px-2 py-1 rounded-md text-foreground font-medium">{club.category}</span>
                  <span className="flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" />{club.members}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Interest Groups */}
      <section className="mb-8">
        <h2 className="text-xl font-sora font-semibold mb-4">Interest Groups</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {interestGroups.map((group, i) => (
            <Card key={i} className="p-4 bg-card border-border/50 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all cursor-pointer group">
              <h3 className="font-medium text-white group-hover:text-indigo-400 transition-colors mb-1">{group.name}</h3>
              <p className="text-xs text-muted-foreground">{group.members} members</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
