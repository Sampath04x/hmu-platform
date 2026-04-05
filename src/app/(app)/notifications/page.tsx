"use client";

import Link from "next/link";
import { ChevronLeftIcon, HeartIcon, BellIcon, MessageSquareIcon, SparkleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = {
  Today: [
    {
      id: 1,
      icon: "match",
      title: "Ember heard your voice message",
      time: "2h ago",
      unread: true,
      href: "/connect/match-ember",
    },
    {
      id: 2,
      icon: "club",
      title: "Photography Club posted a new event",
      time: "4h ago",
      unread: true,
      href: "/communities/photo",
    },
    {
      id: 3,
      icon: "person",
      title: "Arjun sent you a connection request",
      time: "5h ago",
      unread: true,
      href: "/profile/arjun-k",
    },
    {
      id: 4,
      icon: "prompt",
      title: "New weekly prompt for your match",
      time: "9am",
      unread: false,
      href: "/connect",
    },
  ],
  Yesterday: [
    {
      id: 5,
      icon: "event",
      title: "Open Mic Night is tomorrow — you RSVPd",
      time: "Yesterday",
      unread: false,
      href: "/events",
    },
    {
      id: 6,
      icon: "person",
      title: "Riya accepted your connection request",
      time: "Yesterday",
      unread: false,
      href: "/profile/riya-m",
    },
  ],
};

function NotifIcon({ type }: { type: string }) {
  const base = "w-10 h-10 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "match":
      return <div className={cn(base, "bg-brand/15 border border-brand/20")}><MessageSquareIcon className="w-5 h-5 text-brand" /></div>;
    case "club":
      return <div className={cn(base, "bg-accent/15 border border-accent/20")}><BellIcon className="w-5 h-5 text-accent" /></div>;
    case "person":
      return <div className={cn(base, "bg-emerald-500/15 border border-emerald-500/20")}><HeartIcon className="w-5 h-5 text-emerald-400" /></div>;
    case "prompt":
      return <div className={cn(base, "bg-amber-500/15 border border-amber-500/20")}><SparkleIcon className="w-5 h-5 text-amber-400" /></div>;
    case "event":
      return <div className={cn(base, "bg-rose-500/15 border border-rose-500/20")}><BellIcon className="w-5 h-5 text-rose-400" /></div>;
    default:
      return <div className={cn(base, "bg-muted")}><BellIcon className="w-5 h-5 text-muted-foreground" /></div>;
  }
}

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-card text-muted-foreground transition-colors border border-transparent hover:border-border">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-3xl font-dmserif font-semibold text-white">Notifications</h1>
        <span className="ml-auto text-xs text-brand hover:text-accent cursor-pointer font-medium">Mark all read</span>
      </div>

      {/* Notification Groups */}
      {Object.entries(notifications).map(([group, items]) => (
        <div key={group} className="mb-8">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">{group}</h2>
          <div className="space-y-2">
            {items.map((notif) => (
              <Link key={notif.id} href={notif.href}>
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer group",
                  notif.unread
                    ? "bg-brand/5 border border-brand/10 hover:border-brand/25 hover:bg-brand/10"
                    : "bg-card border border-border/50 hover:border-border hover:bg-card/80"
                )}>
                  <NotifIcon type={notif.icon} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm leading-snug", notif.unread ? "text-white font-medium" : "text-foreground")}>{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                  </div>
                  {notif.unread && (
                    <div className="w-2 h-2 rounded-full bg-brand shadow-[0_0_6px_rgba(139,139,67,0.7)] shrink-0" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

    </div>
  );
}
