"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2Icon, LockIcon, UserPlusIcon, MessageSquareIcon, ThumbsUpIcon, MessageCircleIcon } from "lucide-react";

const sharedInterests = ["Photography", "Film"];
const allInterests = ["Photography", "Coding", "Anime", "Film", "Chess"];

export default function UserProfilePage() {
  const isConnected = false;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Cover */}
      <div className="h-44 md:h-52 bg-gradient-to-br from-violet-600/40 via-indigo-600/30 to-rose-600/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background" />
      </div>

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-16 flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className={`w-28 h-28 border-4 border-background shadow-2xl ${!isConnected ? "blur-[8px]" : ""}`}>
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-rose-600 text-white text-4xl font-sora font-bold">A</AvatarFallback>
          </Avatar>
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full">
              <LockIcon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <h1 className="text-3xl font-sora font-bold text-white">Arjun Kapoor</h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-muted-foreground font-medium">Mechanical · 2nd Year</span>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 gap-1 rounded-full px-3">
              <CheckCircle2Icon className="w-3.5 h-3.5" /> Verified
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Into tinkering, late-night debates, and surprisingly good at chess.
          </p>
        </div>

        {/* Shared interests highlight */}
        {sharedInterests.length > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full">
            <span className="text-sm text-indigo-400 font-medium">You both like:</span>
            {sharedInterests.map((tag) => (
              <span key={tag} className="text-sm text-indigo-300 font-semibold">{tag}</span>
            ))}
          </div>
        )}

        {/* Shared club highlight */}
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-[9px]">PC</div>
          You&apos;re both in: Photography Club
        </div>

        {/* Interest Tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {allInterests.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                sharedInterests.includes(tag)
                  ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                  : "bg-indigo-500/10 text-indigo-400/70 border-indigo-500/10"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3 mt-7 w-full max-w-sm">
          <Button className="flex-1 h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] gap-2">
            <UserPlusIcon className="w-4 h-4" /> Connect
          </Button>
          <Button variant="outline" className="flex-1 h-12 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl gap-2 group">
            {isConnected ? (
              <>
                <MessageSquareIcon className="w-4 h-4" /> Message
              </>
            ) : (
              <>
                <LockIcon className="w-4 h-4 group-hover:text-indigo-300 transition-colors" />
                <span className="text-sm">Request to Message</span>
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-sm">
          {[
            { label: "Connections", value: "18" },
            { label: "Posts", value: "7" },
            { label: "Events", value: "4" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border/50 rounded-2xl py-4 px-2 text-center">
              <div className="text-2xl font-sora font-bold text-white">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8">
        <Tabs defaultValue="posts">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 h-auto gap-1">
            {["posts", "connections", "clubs"].map((t) => (
              <TabsTrigger key={t} value={t} className="flex-1 capitalize rounded-lg py-2 text-sm data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-none text-muted-foreground hover:text-white transition-colors">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="posts" className="mt-6 space-y-4">
            {[
              { tag: "OPINION", content: "Hot take: the 9am slots should be illegal. Nobody is learning anything. Change my mind." },
              { tag: "QUESTION", content: "Does anyone actually use the library or is it just for the photos?" },
            ].map((post, i) => (
              <Card key={i} className="p-5 bg-card border-border/50 glow-hover">
                <Badge className="mb-3 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20" variant="outline">{post.tag}</Badge>
                <p className="text-foreground leading-relaxed mb-4">{post.content}</p>
                <div className="flex items-center gap-5 text-muted-foreground text-sm">
                  <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                    <ThumbsUpIcon className="w-4 h-4" /> 128
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                    <MessageCircleIcon className="w-4 h-4" /> 67
                  </button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="connections" className="mt-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {["Riya M.", "Ananya S.", "Karthik R."].map((name, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 bg-card border border-border/50 rounded-2xl hover:border-indigo-500/30 transition-colors cursor-pointer group">
                  <Avatar className="w-14 h-14 border border-border group-hover:border-indigo-500/40 transition-colors">
                    <AvatarFallback className="bg-muted text-foreground font-bold">{name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-white transition-colors">{name}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clubs" className="mt-6 space-y-3">
            {["Photography Club", "Debate Union"].map((club, i) => (
              <Card key={i} className="p-4 bg-card border-border/50 flex items-center gap-4 glow-hover">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-bold text-lg flex items-center justify-center">
                  {club[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{club}</h4>
                  <p className="text-xs text-muted-foreground">Member</p>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
