"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUpIcon, MessageCircleIcon, BookmarkIcon, PlusIcon, XIcon, LockIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("All");
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [postTag, setPostTag] = useState("");

  const tabs = ["All", "Events", "Questions", "Tips", "Utility", "Opinions"];

  const posts = [
    {
      id: 1,
      author: "Priya S.",
      dept: "CSE",
      year: "3rd Year",
      tag: "TIP",
      time: "2h ago",
      content: "The Sarvana Bhavan near gate 2 is genuinely the best thing on this campus. The dosa is worth the 10 min walk. You're welcome.",
      likes: 45,
      comments: 12
    },
    {
      id: 2,
      author: "Arjun K.",
      dept: "Mechanical",
      year: "2nd Year",
      tag: "QUESTION",
      time: "4h ago",
      content: "Does anyone actually use the library or is it just for the photos?",
      likes: 128,
      comments: 67
    },
    {
      id: 3,
      author: "Photography Club",
      dept: "Media",
      year: "Verified",
      tag: "EVENT",
      time: "5h ago",
      content: "Photography Club is doing a campus photowalk this Saturday 6am. Limited spots. RSVP below.",
      likes: 89,
      comments: 34
    },
    {
      id: 4,
      author: "Riya M.",
      dept: "ECE",
      year: "4th Year",
      tag: "UTILITY",
      time: "8h ago",
      content: "Prof Sharma's ML class — attendance is strict but the notes are actually incredible. Don't bunk, just go.",
      likes: 312,
      comments: 8
    },
    {
      id: 5,
      author: "Dev V.",
      dept: "Civil",
      year: "1st Year",
      tag: "OPINION",
      time: "1d ago",
      content: "Hot take: the 9am slots should be illegal. Nobody is learning anything. Change my mind.",
      likes: 890,
      comments: 156
    }
  ];

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "EVENT": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "QUESTION": return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
      case "TIP": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "UTILITY": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "OPINION": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredPosts = activeTab === "All" ? posts : posts.filter(p => p.tag === activeTab.toUpperCase().replace(/S$/, ''));

  return (
    <div className="min-h-screen bg-background relative flex flex-col md:flex-row">
      <div className="flex-1 max-w-2xl mx-auto w-full border-x border-border/40 min-h-screen relative pb-24">
        {/* Top Header - Mobile */}
        <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 pt-[calc(env(safe-area-inset-top)+64px)] px-4 pb-3 overflow-x-auto hide-scrollbar flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-card text-muted-foreground hover:bg-card/80 border border-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Top Header - Desktop */}
        <div className="hidden md:flex sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 px-6 py-4 gap-3 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-card/50 text-muted-foreground hover:text-white border border-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="mb-8 md:block hidden">
            <h1 className="text-3xl font-sora font-semibold text-white">Campus Pulse</h1>
            <p className="text-muted-foreground">What&apos;s happening on campus right now.</p>
          </div>

          {filteredPosts.map((post) => (
            <Card key={post.id} className="p-4 sm:p-5 bg-card border-border/50 glow-hover">
              <div className="flex gap-3 mb-3">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold">{post.author[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{post.author}</h4>
                      <p className="text-xs text-muted-foreground">{post.dept} &middot; {post.year}</p>
                    </div>
                    <Badge className={getTagColor(post.tag)} variant="outline">
                      {post.tag}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-foreground text-[15px] leading-relaxed mb-4 ml-[52px]">
                {post.content}
              </p>
              
              <div className="flex items-center gap-6 ml-[52px] text-muted-foreground">
                <button className="flex items-center gap-1.5 text-xs font-medium hover:text-indigo-400 transition-colors group">
                  <div className="p-1.5 rounded-full group-hover:bg-indigo-500/10 transition-colors">
                    <ThumbsUpIcon className="w-4 h-4" />
                  </div>
                  {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium hover:text-violet-400 transition-colors group">
                  <div className="p-1.5 rounded-full group-hover:bg-violet-500/10 transition-colors">
                    <MessageCircleIcon className="w-4 h-4" />
                  </div>
                  {post.comments}
                </button>
                <div className="flex-1"></div>
                <div className="text-xs">{post.time}</div>
                <button className="p-1.5 rounded-full hover:bg-muted hover:text-white transition-colors">
                  <BookmarkIcon className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button 
        onClick={() => setIsFabOpen(true)}
        className="fixed bottom-[100px] md:bottom-8 right-4 md:right-8 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center z-40"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      {isFabOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl safe-area-bottom animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-lg font-sora font-semibold">Create Post</h3>
              <button onClick={() => setIsFabOpen(false)} className="p-2 text-muted-foreground hover:text-white hover:bg-muted rounded-full transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {["TIP", "QUESTION", "EVENT", "UTILITY", "OPINION"].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setPostTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      postTag === tag ? getTagColor(tag) + ' shadow-[0_0_10px_currentColor]' : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <Textarea 
                placeholder="What's on your mind?" 
                className="min-h-[150px] bg-background border-none focus-visible:ring-0 text-base resize-none placeholder:text-muted-foreground"
              />

              <div className="flex justify-between items-center pt-2">
                <button className="text-indigo-400 text-sm font-medium hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                  <LockIcon className="w-4 h-4" /> Anonymous
                </button>
                <Button 
                  className={`px-6 rounded-xl font-semibold ${
                    postTag ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                  disabled={!postTag}
                  onClick={() => setIsFabOpen(false)}
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
