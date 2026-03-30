"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, ThumbsUpIcon, MessageCircleIcon, BookmarkIcon, Bell, Lock, Shield } from "lucide-react";
import { useUser } from "@/context/UserContext";

const TABS = ["Posts", "Connections", "Clubs", "Settings"] as const;
type Tab = typeof TABS[number];

const posts = [
  { tag: "TIP", tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", content: "The Sarvana Bhavan near gate 2 is genuinely the best thing on this campus. The dosa is worth the 10 min walk.", likes: 45, comments: 12, time: "2h ago" },
  { tag: "QUESTION", tagColor: "bg-violet-500/10 text-violet-400 border-violet-500/20", content: "Has anyone actually finished all the labs before the deadlines or is everyone just submitting at 11:59?", likes: 89, comments: 34, time: "1d ago" },
];

const connections = ["Arjun K.", "Riya M.", "Dev V.", "Ananya S.", "Karthik R.", "Shreya P."];
const clubs = [
  { name: "Photography Club", role: "Member", color: "from-indigo-500 to-violet-500" },
  { name: "Startup Cell", role: "Core Team", color: "from-violet-500 to-rose-500" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${on ? "bg-indigo-500" : "bg-white/10"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function MyProfilePage() {
  const { name, interests } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("Posts");
  const [settings, setSettings] = useState({
    photoVisibility: false,
    deptVisibility: true,
    girlsFirst: true,
    matchNotifs: true,
    eventReminders: true,
    messageRequests: false,
  });
  const toggle = (k: keyof typeof settings) => setSettings(s => ({ ...s, [k]: !s[k] }));

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Cover Banner ─── */}
      <div className="h-44 bg-gradient-to-br from-indigo-600/60 via-violet-600/40 to-indigo-900/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background" />
      </div>

      {/* ─── Profile Header ─── */}
      <div className="px-4 sm:px-6 -mt-14 flex flex-col items-center text-center max-w-2xl mx-auto">
        <Avatar className="w-28 h-28 border-4 border-background shadow-2xl">
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-4xl font-sora font-bold">{name[0]}</AvatarFallback>
        </Avatar>

        <div className="mt-4 space-y-2 w-full">
          <h1 className="text-2xl font-sora font-bold text-white">{name}</h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">ECE · 3rd Year</span>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 gap-1 rounded-full text-xs px-2.5">
              <CheckCircle2Icon className="w-3 h-3" /> Verified
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Just trying to figure things out. Love photography, random conversations and bad horror movies.
          </p>

          {/* Interest Tags */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {interests.map(tag => (
              <span key={tag} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full px-3 py-1 text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-3 gap-3 mt-6 w-full">
          {[["24", "Connections"], ["12", "Posts"], ["8", "Events"]].map(([val, label]) => (
            <div key={label} className="bg-card border border-border/50 rounded-2xl py-4 text-center">
              <div className="text-xl font-sora font-bold text-white">{val}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8 pb-28">
        {/* Tab Switcher */}
        <div className="flex bg-card border border-border/50 rounded-2xl p-1 gap-1 mb-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === tab
                  ? "bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content — only one rendered at a time */}
        {activeTab === "Posts" && (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <Card key={i} className="p-5 bg-card border-border/50 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold border px-3 py-1 rounded-full ${post.tagColor}`}>{post.tag}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{post.time}</span>
                </div>
                <p className="text-foreground leading-relaxed text-sm mb-4">{post.content}</p>
                <div className="flex items-center gap-5 text-muted-foreground text-xs">
                  <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                    <ThumbsUpIcon className="w-4 h-4" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                    <MessageCircleIcon className="w-4 h-4" /> {post.comments}
                  </button>
                  <div className="flex-1" />
                  <button className="hover:text-white transition-colors">
                    <BookmarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "Connections" && (
          <div className="grid grid-cols-3 gap-3">
            {connections.map((name, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 bg-card border border-border/50 rounded-2xl hover:border-indigo-500/30 transition-colors cursor-pointer group">
                <Avatar className="w-14 h-14 border border-border group-hover:border-indigo-500/40 transition-colors">
                  <AvatarFallback className="bg-muted text-foreground font-bold">{name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-white transition-colors leading-tight">{name}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Clubs" && (
          <div className="space-y-3">
            {clubs.map((club, i) => (
              <Card key={i} className="p-4 bg-card border-border/50 flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club.color} text-white font-bold text-lg flex items-center justify-center shrink-0`}>
                  {club.name[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{club.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{club.role}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="space-y-8">
            {/* Privacy */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-indigo-400" />
                <h3 className="font-sora font-semibold text-white">Privacy Settings</h3>
              </div>
              <div className="space-y-2">
                {[
                  { key: "photoVisibility" as const, label: "Show my photo to non-connections" },
                  { key: "deptVisibility" as const, label: "Show my department" },
                  { key: "girlsFirst" as const, label: "Girls-first protection", desc: "Only people who've interacted with your content can message you first." },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex justify-between items-start p-4 bg-card border border-border/50 rounded-xl">
                    <div className="flex-1 pr-4">
                      <p className="font-medium text-white text-sm">{label}</p>
                      {desc && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>}
                    </div>
                    <Toggle on={settings[key]} onToggle={() => toggle(key)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="font-sora font-semibold text-white">Notification Settings</h3>
              </div>
              <div className="space-y-2">
                {[
                  { key: "matchNotifs" as const, label: "Match notifications" },
                  { key: "eventReminders" as const, label: "Event reminders" },
                  { key: "messageRequests" as const, label: "Message requests" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex justify-between items-center p-4 bg-card border border-border/50 rounded-xl">
                    <p className="font-medium text-white text-sm">{label}</p>
                    <Toggle on={settings[key]} onToggle={() => toggle(key)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h3 className="font-sora font-semibold text-white">Account</h3>
              </div>
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/40">
                <button className="w-full text-left px-4 py-3.5 text-sm text-foreground hover:bg-muted/30 transition-colors">Change Password</button>
                <button className="w-full text-left px-4 py-3.5 text-sm text-foreground hover:bg-muted/30 transition-colors">Export My Data</button>
                <button className="w-full text-left px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
