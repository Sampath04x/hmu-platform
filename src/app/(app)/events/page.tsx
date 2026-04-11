"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPinIcon, ClockIcon, CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

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
    gradient: "from-brand/20 to-accent/10",
  }
];

const gradients = [
  "from-brand/20 to-accent/10",
  "from-amber-600/20 to-orange-500/10",
  "from-rose-600/20 to-pink-500/10",
  "from-emerald-600/20 to-teal-500/10"
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
  const { role, user_id } = useUser();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("This Week");
  const [goingState, setGoingState] = useState<{ [key: number]: boolean }>({});
  
  // Create Event Modal State
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    started_at: "",
  });

  const canCreateEvent = role === 'club' || role === 'super_admin' || role === 'founder';

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const filters = ["Today", "This Week", "This Month"];

  const toggleGoing = (id: number) => {
    setGoingState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.location || !newEvent.started_at) {
      return toast.error("Please fill in all required fields.");
    }
    
    setIsCreating(true);
    try {
      await apiFetch("/events", {
        method: "POST",
        body: JSON.stringify({
          ...newEvent,
          poster_url: "https://via.placeholder.com/400x300", // Placeholder for now
        }),
      });
      toast.success("Event created successfully!");
      setIsFabOpen(false);
      setNewEvent({ title: "", description: "", location: "", started_at: "" });
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create event");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col md:flex-row">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 border-x border-border/40 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-dmserif font-semibold text-white mb-1">What&apos;s Happening</h1>
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
                  ? "bg-brand text-white shadow-[0_0_15px_rgba(194,105,42,0.3)]"
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
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>No events happening right now. Be the first to host one!</p>
            </div>
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
                    <span className="text-3xl font-dmserif font-bold text-white mt-0.5">{dayStr.split(" ")[1] || "—"}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{dayStr.split(" ")[0] || "—"}</span>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand to-accent text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {clubInitials}
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">{clubName}</span>
                      </div>

                      <h3 className="text-xl font-dmserif font-semibold text-white group-hover:text-brand transition-colors leading-tight">
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
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-danger/10 hover:text-danger hover:border-danger/30"
                            : "bg-brand hover:opacity-90 text-white shadow-[0_0_10px_rgba(194,105,42,0.3)]"
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

      {/* FAB for Clubs */}
      {canCreateEvent && (
        <button 
          onClick={() => setIsFabOpen(true)}
          className="fixed bottom-[100px] md:bottom-8 right-4 md:right-8 w-14 h-14 bg-brand hover:opacity-90 active:scale-95 transition-all text-white rounded-full shadow-[0_0_20px_rgba(194,105,42,0.5)] flex items-center justify-center z-40"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      )}

      {/* Create Event Modal */}
      {isFabOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl safe-area-bottom animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-lg font-dmserif font-semibold">Host an Event</h3>
              <button onClick={() => setIsFabOpen(false)} className="p-2 text-muted-foreground hover:text-white hover:bg-muted rounded-full transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Tech Symposium"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-brand/50 transition-colors"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Tell students what to expect..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-brand/50 transition-colors resize-none min-h-[100px]"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-brand/50 transition-colors"
                    value={newEvent.started_at}
                    onChange={(e) => setNewEvent({ ...newEvent, started_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Auditorium"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-brand/50 transition-colors"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  className="bg-brand hover:opacity-90 text-white rounded-xl px-8 font-semibold w-full sm:w-auto"
                  onClick={handleCreateEvent}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Publish Event"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
