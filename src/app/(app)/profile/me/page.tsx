"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, ThumbsUpIcon, MessageCircleIcon, BookmarkIcon, Bell, Lock, Shield, UserIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";


const posts = [
  { tag: "TIP", tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", content: "The Sarvana Bhavan near gate 2 is genuinely the best thing on this campus. The dosa is worth the 10 min walk.", likes: 45, comments: 12, time: "2h ago" },
  { tag: "QUESTION", tagColor: "bg-violet-500/10 text-violet-400 border-violet-500/20", content: "Has anyone actually finished all the labs before the deadlines or is everyone just submitting at 11:59?", likes: 89, comments: 34, time: "1d ago" },
];

const connections = ["Arjun K.", "Riya M.", "Dev V.", "Ananya S.", "Karthik R.", "Shreya P."];
const clubs = [
  { name: "Photography Club", role: "Member", color: "from-brand to-accent" },
  { name: "Startup Cell", role: "Core Team", color: "from-accent to-brand" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${on ? "bg-brand" : "bg-white/10"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function MyProfilePage() {
  const { name, interests, role } = useUser();
  
  const TABS = role === 'club' 
    ? (["Posts", "Insights", "Settings"] as const)
    : (["Posts", "Connections", "Clubs", "Settings"] as const);
  
  type Tab = typeof TABS[number];
  const [activeTab, setActiveTab] = useState<Tab>("Posts" as Tab);
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
      <div className="h-44 bg-gradient-to-br from-brand/60 via-accent/40 to-brand/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background" />
      </div>

      {/* ─── Profile Header ─── */}
      <div className="px-4 sm:px-6 -mt-14 flex flex-col items-center text-center max-w-2xl mx-auto">
        <Avatar className="w-28 h-28 border-4 border-background shadow-2xl">
          <AvatarFallback className="bg-gradient-to-br from-brand to-accent text-white text-4xl font-dmserif font-bold">{name[0]}</AvatarFallback>
        </Avatar>

        <div className="mt-4 space-y-2 w-full">
          <h1 className="text-2xl font-dmserif font-bold text-white">{name}</h1>
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
              <span key={tag} className="bg-brand/10 text-brand border border-brand/20 rounded-full px-3 py-1 text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-3 gap-3 mt-6 w-full">
          {[
            ["24", "Connections"], 
            ["12", "Posts"], 
            ["156", "Points", "bg-brand/20 text-brand"]
          ].map(([val, label, activeClass]) => (
            <div key={label} className={`bg-card border border-border/50 rounded-2xl py-4 text-center ${activeClass || ""}`}>
              <div className="text-xl font-dmserif font-bold text-white">{val}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Daily Activity Progress */}
        <div className="w-full mt-6 px-2">
           <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily Activity Limit</span>
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">8 / 20 Used</span>
           </div>
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full w-[40%] shadow-[0_0_8px_rgba(194,105,42,0.5)]" />
           </div>
           <p className="text-[9px] text-muted-foreground mt-2 italic text-left">
              Limit resets in 14 hours. Points help unlock premium features.
           </p>
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
                  ? "bg-brand text-white shadow-[0_0_12px_rgba(194,105,42,0.3)]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content — only one rendered at a time */}
        {activeTab === "Insights" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <Card className="p-6 bg-card border-border/50 bg-gradient-to-br from-brand/5 to-transparent">
                  <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Total Followers</div>
                  <div className="text-4xl font-dmserif font-bold text-white">428</div>
                  <div className="text-xs text-emerald-400 font-bold mt-2">+12% from last week</div>
               </Card>
               <Card className="p-6 bg-card border-border/50 bg-gradient-to-br from-accent/5 to-transparent">
                  <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Total Reach</div>
                  <div className="text-4xl font-dmserif font-bold text-white">1.8k</div>
                  <div className="text-xs text-emerald-400 font-bold mt-2">+24% from last week</div>
               </Card>
            </div>

            <Card className="p-8 bg-card border-border/50">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-dmserif text-xl font-bold">Engagement Trends</h3>
                  <div className="text-xs font-bold uppercase tracking-widest text-brand">Last 7 Days</div>
               </div>
               
               <div className="h-48 flex items-end justify-between gap-3 px-2">
                  {[45, 78, 56, 92, 45, 67, 88].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                       <div 
                         className="w-full bg-brand/20 rounded-t-lg transition-all group-hover:bg-brand relative"
                         style={{ height: `${val}%` }}
                       >
                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{val}</div>
                       </div>
                       <span className="text-[10px] uppercase font-bold text-muted-foreground">{['M','T','W','T','F','S','S'][i]}</span>
                    </div>
                  ))}
               </div>
            </Card>

            <Card className="p-8 bg-card border-border/50 space-y-6">
               <h3 className="font-dmserif text-xl font-bold">Top Interactions</h3>
               <div className="space-y-4">
                  {[
                    { label: "Hearts & Likes", count: "1,240", icon: ThumbsUpIcon, color: "text-rose-400" },
                    { label: "Community Shares", count: "215", icon: Shield, color: "text-blue-400" },
                    { label: "Profile Views", count: "890", icon: UserIcon, color: "text-brand" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                       <div className="flex items-center gap-3">
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                          <span className="text-sm font-medium text-white">{item.label}</span>
                       </div>
                       <span className="font-dmserif font-bold">{item.count}</span>
                    </div>
                  ))}
               </div>
            </Card>
          </div>
        )}

        {/* Tab Content — only one rendered at a time */}
        {activeTab === "Posts" && (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <Card key={i} className="p-5 bg-card border-border/50 hover:border-brand/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold border px-3 py-1 rounded-full ${post.tagColor}`}>{post.tag}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{post.time}</span>
                </div>
                <p className="text-foreground leading-relaxed text-sm mb-4">{post.content}</p>
                <div className="flex items-center gap-5 text-muted-foreground text-xs">
                  <button className="flex items-center gap-1.5 hover:text-brand transition-colors">
                    <ThumbsUpIcon className="w-4 h-4" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-accent transition-colors">
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
              <div key={i} className="flex flex-col items-center gap-2 p-4 bg-card border border-border/50 rounded-2xl hover:border-brand/30 transition-colors cursor-pointer group">
                <Avatar className="w-14 h-14 border border-border group-hover:border-brand/40 transition-colors">
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
              <Card key={i} className="p-4 bg-card border-border/50 flex items-center gap-4 hover:border-brand/30 transition-colors">
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
                <Lock className="w-4 h-4 text-brand" />
                <h3 className="font-dmserif font-semibold text-white">Privacy Settings</h3>
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
                <Bell className="w-4 h-4 text-brand" />
                <h3 className="font-dmserif font-semibold text-white">Notification Settings</h3>
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

            {/* Club Admin Management (Only for Club role) */}
            {role === 'club' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-brand" />
                  <h3 className="font-dmserif font-semibold text-white">Manage Club Admins</h3>
                </div>
                <Card className="bg-card border-brand/30 p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-4 italic">
                    Add other Gitam emails to allow them to manage this club account.
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                        <input 
                          type="email" 
                          placeholder="admin@student.gitam.edu"
                          className="flex-1 bg-background/50 border border-border h-10 px-3 rounded-lg text-sm focus:outline-none focus:border-brand"
                        />
                        <Button size="sm" className="bg-brand text-white">Add</Button>
                    </div>
                    {/* Placeholder for list of admins */}
                    <div className="pt-2 border-t border-border/40">
                       <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-foreground">You (Owner)</span>
                          <Badge variant="outline" className="text-[10px] uppercase">Owner</Badge>
                       </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Account */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-brand" />
                <h3 className="font-dmserif font-semibold text-white">Account</h3>
              </div>
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/40">
                {role === 'super_admin' && (
                  <Link href="/admin" className="w-full block text-left px-4 py-3.5 text-sm text-brand font-bold hover:bg-brand/10 transition-colors">
                    Access Super Admin Dashboard
                  </Link>
                )}
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
