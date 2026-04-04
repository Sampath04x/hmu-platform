"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPinIcon, ClockIcon, CheckIcon } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

// Fallback events
const fallbackEvents = [
  {
    event_id: 1,
    title: "Photography Photowalk",
    club_id: "Photography Club",
    started_at: new Date().toISOString(),
    location: "Main Gate",
    rsvp: 34,
    going: false,
    gradient: "from-violet-500/20 to-indigo-500/10",
  }
];

const gradients = [
  "from-violet-500/20 to-indigo-500/10",
  "from-amber-500/20 to-orange-500/10",
  "from-rose-500/20 to-pink-500/10",
  "from-emerald-500/20 to-teal-500/10"
];

function formatDate(isoString: string) {
  if (!isoString) return { dateStr: "N/A", dayStr: "N/A", timeStr: "N/A" };
  const d = new Date(isoString);
  const dateStr = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { dateStr, dayStr, timeStr };
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("This Week");
  const [goingState, setGoingState] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiFetch("/events");
        setEvents(data || fallbackEvents);
      } catch (err) {
        console.error(err);
        setEvents(fallbackEvents);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filters = ["Today", "This Week", "This Month"];

  const toggleGoing = (id: number) => {
    setGoingState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-sora font-semibold text-white mb-1">What&apos;s Happening</h1>
        <p className="text-muted-foreground">Events across your campus.</p>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeFilter === f
                ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                : "bg-card border border-border text-muted-foreground hover:text-white hover:border-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Event Cards */}
      <div className="space-y-5">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-10">Loading events...</p>
        ) : (
          events.map((event, idx) => {
            const isGoing = goingState[event.event_id] || false;
            const gradient = gradients[idx % gradients.length];
            const { dateStr, dayStr, timeStr } = formatDate(event.started_at);
            const clubName = event.club_id || "Campus Event";
            const clubInitials = clubName.substring(0, 2).toUpperCase();
            const rsvpCount = event.rsvp || Math.floor(Math.random() * 100);

            return (
              <Card key={event.event_id} className="overflow-hidden bg-card border-border/50 glow-hover group flex flex-col sm:flex-row transition-all">
                {/* Cover / Date Block */}
                <div className={`w-full sm:w-44 h-32 sm:h-auto flex-col items-center justify-center bg-gradient-to-br ${gradient} shrink-0 flex relative border-b sm:border-b-0 sm:border-r border-border/30`}>
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
                  <span className="text-xs font-bold text-muted-foreground tracking-widest">{dateStr}</span>
                  <span className="text-3xl font-sora font-bold text-white mt-0.5">{dayStr.split(" ")[1] || "—"}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{dayStr.split(" ")[0] || "—"}</span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {clubInitials}
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">{clubName}</span>
                    </div>

                    <h3 className="text-xl font-sora font-semibold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <MapPinIcon className="w-4 h-4" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        {timeStr}
                      </span>
                    </div>

                  {/* RSVP avatars */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <Avatar key={i} className="w-6 h-6 border-2 border-card">
                          <AvatarFallback className="bg-muted text-[9px]">P{i}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {rsvpCount} going
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Button
                      size="sm"
                      onClick={() => toggleGoing(event.event_id)}
                      className={`flex items-center gap-2 font-semibold h-10 px-5 rounded-xl transition-all ${
                        isGoing
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                          : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                      }`}
                    >
                      {isGoing && <CheckIcon className="w-4 h-4" />}
                      {isGoing ? `Going (${rsvpCount + 1})` : `Going (${rsvpCount})`}
                    </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-4 rounded-xl border-border text-muted-foreground hover:text-white hover:bg-muted transition-colors"
                  >
                    Interested
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
        )}
      </div>
    </div>
  );
}
