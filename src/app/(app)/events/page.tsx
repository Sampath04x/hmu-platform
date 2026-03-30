"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPinIcon, ClockIcon, CheckIcon } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Photography Photowalk",
    club: "Photography Club",
    clubInitials: "PC",
    date: "SAT",
    day: "APR 5",
    time: "6:00 AM",
    location: "Main Gate",
    rsvp: 34,
    going: false,
    gradient: "from-violet-500/20 to-indigo-500/10",
  },
  {
    id: 2,
    title: "Startup Pitch Night",
    club: "Startup Cell",
    clubInitials: "SC",
    date: "FRI",
    day: "APR 4",
    time: "6:00 PM",
    location: "Seminar Hall",
    rsvp: 67,
    going: true,
    gradient: "from-amber-500/20 to-orange-500/10",
  },
  {
    id: 3,
    title: "Open Mic Night",
    club: "Lit Society",
    clubInitials: "LS",
    date: "THU",
    day: "APR 3",
    time: "7:00 PM",
    location: "Amphitheatre",
    rsvp: 89,
    going: false,
    gradient: "from-rose-500/20 to-pink-500/10",
  },
  {
    id: 4,
    title: "Inter-Department Football",
    club: "FC Campus",
    clubInitials: "FC",
    date: "SUN",
    day: "APR 6",
    time: "5:00 PM",
    location: "Ground A",
    rsvp: 112,
    going: false,
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
];

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState("This Week");
  const [goingState, setGoingState] = useState<{ [key: number]: boolean }>(
    events.reduce((acc, e) => ({ ...acc, [e.id]: e.going }), {})
  );

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
        {events.map((event) => {
          const isGoing = goingState[event.id];
          return (
            <Card key={event.id} className="overflow-hidden bg-card border-border/50 glow-hover group flex flex-col sm:flex-row transition-all">
              {/* Cover / Date Block */}
              <div className={`w-full sm:w-44 h-32 sm:h-auto flex-col items-center justify-center bg-gradient-to-br ${event.gradient} shrink-0 flex relative border-b sm:border-b-0 sm:border-r border-border/30`}>
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
                <span className="text-xs font-bold text-muted-foreground tracking-widest">{event.date}</span>
                <span className="text-3xl font-sora font-bold text-white mt-0.5">{event.day.split(" ")[1]}</span>
                <span className="text-xs font-semibold text-muted-foreground">{event.day.split(" ")[0]}</span>
              </div>

              {/* Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {event.clubInitials}
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{event.club}</span>
                  </div>

                  <h3 className="text-xl font-sora font-semibold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                    {event.title}
                  </h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="w-4 h-4" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4" />
                      {event.time}
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
                      {event.rsvp} going
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => toggleGoing(event.id)}
                    className={`flex items-center gap-2 font-semibold h-10 px-5 rounded-xl transition-all ${
                      isGoing
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                    }`}
                  >
                    {isGoing && <CheckIcon className="w-4 h-4" />}
                    {isGoing ? `Going (${event.rsvp + 1})` : `Going (${event.rsvp})`}
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
        })}
      </div>
    </div>
  );
}
