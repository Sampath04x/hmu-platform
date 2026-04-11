"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, HeartIcon, BellIcon, MessageSquareIcon, SparkleIcon, CheckCircle2Icon, UsersIcon, CalendarDaysIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  notification_id: string;
  type: 'event_invite' | 'event_approved' | 'message' | 'club annoucement' | 'club_post' | 'club_event' | 'system_announcement' | 'club_approved';
  is_read: boolean;
  metadata: any;
  created_at: string;
};

function NotifIcon({ type }: { type: string }) {
  const base = "w-10 h-10 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "message":
      return <div className={cn(base, "bg-brand/15 border border-brand/20")}><MessageSquareIcon className="w-5 h-5 text-brand" /></div>;
    case "club_post":
    case "club annoucement":
      return <div className={cn(base, "bg-accent/15 border border-accent/20")}><BellIcon className="w-5 h-5 text-accent" /></div>;
    case "club_event":
    case "event_invite":
      return <div className={cn(base, "bg-rose-500/15 border border-rose-500/20")}><CalendarDaysIcon className="w-5 h-5 text-rose-400" /></div>;
    case "club_approved":
      return <div className={cn(base, "bg-emerald-500/15 border border-emerald-500/20")}><CheckCircle2Icon className="w-5 h-5 text-emerald-400" /></div>;
    case "system_announcement":
      return <div className={cn(base, "bg-blue-500/15 border border-blue-500/20")}><SparkleIcon className="w-5 h-5 text-blue-400" /></div>;
    default:
      return <div className={cn(base, "bg-muted")}><BellIcon className="w-5 h-5 text-muted-foreground" /></div>;
  }
}

function getNotifContent(notif: Notification) {
  const { type, metadata } = notif;
  switch (type) {
    case 'club_post':
      return {
        title: `${metadata?.club_name || 'A club'} posted an update`,
        description: metadata?.preview || "Check out their latest post!",
        href: metadata?.club_id ? `/profile/${metadata.club_id}` : '/home'
      };
    case 'club_event':
      return {
        title: `New Event: ${metadata?.event_title || 'Upcoming Event'}`,
        description: `${metadata?.club_name || 'A club'} just announced a new event!`,
        href: metadata?.event_id ? `/events/${metadata.event_id}` : '/events'
      };
    case 'club_approved':
      return {
        title: `${metadata?.club_name || 'Your'} club is approved! 🎉`,
        description: "Welcome to HMU. You can now post events and manage your club.",
        href: metadata?.profile_link || "/profile/me"
      };
    case 'message':
      return {
        title: "New message received",
        description: "You have a new unread message in your inbox.",
        href: "/connect"
      };
    default:
      return {
        title: "New notification",
        description: "You have a new update on HMU.",
        href: "/home"
      };
  }
}

export default function NotificationsPage() {
  const { user_id } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user_id) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user_id]);

  const markAllRead = async () => {
    if (!user_id) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user_id)
        .eq("is_read", false);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("notification_id", id);
      
      setNotifications(prev => prev.map(n => 
        n.notification_id === id ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto px-4 sm:px-6 py-6 transition-all duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-card text-muted-foreground transition-colors border border-transparent hover:border-border">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-3xl font-dmserif font-semibold text-white">Notifications</h1>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllRead}
            className="ml-auto text-xs text-brand hover:text-accent cursor-pointer font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4 border border-border/50">
            <BellIcon className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-medium text-white">All caught up!</h3>
          <p className="text-sm text-muted-foreground max-w-[240px] mt-1 text-balance">
            We&apos;ll notify you when clubs post something new or your events are updated.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const content = getNotifContent(notif);
            return (
              <Link 
                key={notif.notification_id} 
                href={content.href}
                onClick={() => !notif.is_read && markAsRead(notif.notification_id)}
              >
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2",
                  !notif.is_read
                    ? "bg-brand/5 border border-brand/10 hover:border-brand/20 hover:bg-brand/10"
                    : "bg-card border border-border/40 hover:border-border hover:bg-card/80 opacity-80 hover:opacity-100"
                )}>
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm leading-snug", !notif.is_read ? "text-white font-medium" : "text-foreground")}>
                      {content.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{content.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-brand shadow-[0_0_8px_rgba(139,139,67,0.8)] shrink-0 animate-pulse" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
