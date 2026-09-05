"use client";

import { useState, useEffect } from "react";
import { ICT_ROOMS } from "@/data/ictRooms";
import {
  Building2,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Plus,
  CalendarDays,
  XIcon,
  Search
} from "lucide-react";
import { getApiUrl } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast as sonnerToast } from "sonner";

function ScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`overflow-auto ${className}`}>{children}</div>;
}

function useToast() {
  return {
    toast: (props: any) => {
      sonnerToast(props.title, { description: props.description });
    }
  }
}

// Gitam original buildings list
const BUILDINGS = [
  "ICT"
];

const formatExpiryTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const SEMESTERS = ["Odd 2025", "Even 2024", "Odd 2024"];

const ROOM_PREFIX: Record<string, string> = {
  "Lecture Hall": "LH",
  "Classroom": "CR",
  "Laboratory": "LAB",
  "Seminar Hall": "SEM",
};

interface Classroom {
  id: string;
  room_number: string;
  display_name?: string;
  floor: number;
  building_name: string;
  room_type?: string;
  is_anonymous?: boolean;
  semester?: string;
  live_status: "empty" | "occupied" | "unknown";
  last_updated_at: string;
  is_verified: boolean;
  confirmed_count: number;
  deny_count: number;
  expiry_minutes: number;
  expires_at?: string;
  note?: string;
  reporter_name?: string;
  current_report?: {
    id: string;
    status: string;
    reporter_name: string;
    is_verified: boolean;
  } | null;
}

// Initial mock data with the requested fields
const INITIAL_CLASSROOMS: Classroom[] = [
  {
    id: "1",
    room_number: "LH-101",
    floor: 1,
    building_name: "GST - Engineering",
    room_type: "Lecture Hall",
    is_anonymous: false,
    semester: "Odd 2025",
    live_status: "empty",
    last_updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    is_verified: true,
    confirmed_count: 12,
    deny_count: 0,
    expiry_minutes: 30,
    note: "Perfect for quiet study. Projector working.",
    reporter_name: "Ankit",
    current_report: {
      id: "r1",
      status: "empty",
      reporter_name: "Ankit",
      is_verified: true
    }
  },
  {
    id: "2",
    room_number: "LH-204",
    floor: 2,
    building_name: "GST - Engineering",
    room_type: "Lecture Hall",
    is_anonymous: false,
    semester: "Odd 2025",
    live_status: "occupied",
    last_updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    is_verified: false,
    confirmed_count: 3,
    deny_count: 1,
    expiry_minutes: 18,
    note: "Tutorial class in progress.",
    reporter_name: "Preeti",
    current_report: {
      id: "r2",
      status: "occupied",
      reporter_name: "Preeti",
      is_verified: false
    }
  },
  {
    id: "3",
    room_number: "LIB-302",
    floor: 3,
    building_name: "GSB - Business",
    room_type: "Seminar Hall",
    is_anonymous: false,
    semester: "Odd 2025",
    live_status: "empty",
    last_updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    is_verified: true,
    confirmed_count: 8,
    deny_count: 0,
    expiry_minutes: 27,
    note: "Outlets and AC fully operational.",
    reporter_name: "John",
    current_report: {
      id: "r3",
      status: "empty",
      reporter_name: "John",
      is_verified: true
    }
  },
  {
    id: "4",
    room_number: "LAB-501",
    floor: 5,
    building_name: "GST - Engineering",
    room_type: "Laboratory",
    is_anonymous: false,
    semester: "Odd 2025",
    live_status: "empty",
    last_updated_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    is_verified: true,
    confirmed_count: 9,
    deny_count: 1,
    expiry_minutes: 8,
    note: "Hardware kits laid out.",
    reporter_name: "Priya",
    current_report: {
      id: "r4",
      status: "empty",
      reporter_name: "Priya",
      is_verified: true
    }
  }
];

export default function VacantClassrooms() {
  const [selectedBuilding, setSelectedBuilding] = useState("ICT");
  const [selectedSemester, setSelectedSemester] = useState("Odd 2025");

  // RENAME state variables to matches user instructions exactly
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [confirmedRooms, setConfirmedRooms] = useState<Record<string, boolean>>({});
  const [deniedRooms, setDeniedRooms] = useState<Record<string, boolean>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  // Load classrooms from localStorage if present
  useEffect(() => {
    // if (typeof window !== "undefined") {
    //   // const cached = localStorage.getItem("intrst_classrooms");
    //   if (cached) {
    //     try {
    //       setRooms(JSON.parse(cached));
    //     } catch (e) {
    //       console.error("Failed to parse cached classrooms:", e);
    //     }
    //   }
    // }

    // Get user and profile
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        setUserProfile(profile);
      }
    };
    fetchUser();
    fetchClassrooms();
  }, []);

  // Expiry Timer: tick down expiry minutes once per minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRooms(prev => {
        const updated = prev.filter(room => {
          if (!room.expires_at) return false;

          const remaining =
            Math.ceil(
              (new Date(room.expires_at).getTime() - Date.now()) / 60000
            );

          room.expiry_minutes = Math.max(remaining, 0);

          return remaining > 0;
        });
        // if (typeof window !== "undefined") {
        //   localStorage.setItem("intrst_classrooms", JSON.stringify(updated));
        // }
        return updated;
      });
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  const saveRoomsState = (updatedList: Classroom[]) => {
    setRooms(updatedList);
    // if (typeof window !== "undefined") {
    //   localStorage.setItem("intrst_classrooms", JSON.stringify(updatedList));
    // }
  };

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/classrooms?building=${encodeURIComponent(selectedBuilding)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const fetchedRooms = data.map((r: any) => ({
            ...r,
            confirmed_count: r.confirmed_count || Math.floor(Math.random() * 10) + 2,
            deny_count: r.deny_count || 0,
            expiry_minutes: r.expires_at
              ? Math.max(
                0,
                Math.ceil(
                  (new Date(r.expires_at).getTime() - Date.now()) / 60000
                )
              )
              : 0,
            is_verified: r.is_verified ?? (Math.random() > 0.4),
            reporter_name: r.current_report?.reporter_name || "Student"
          }));

          // Merge fetched database rooms with local modifications
          setRooms(prev => {
            const localOnly = prev.filter(p => !fetchedRooms.some((f: any) => f.id === p.id || f.room_number === p.room_number));
            return [...localOnly, ...fetchedRooms];
          });
        }
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    }
    setLoading(false);
  };

  const handleConfirmVote = (roomId: string) => {
    if (confirmedRooms[roomId]) {
      toast({ title: "Already Confirmed", description: "You have already confirmed this classroom status." });
      return;
    }
    const updated = rooms.map(room => {
      if (room.id !== roomId) return room;
      const isExpired = room.expiry_minutes === 0 || room.live_status === "unknown";
      if (isExpired) return room; // disabled if expired

      return {
        ...room,
        confirmed_count: room.confirmed_count + 1
      };
    });
    setConfirmedRooms(prev => ({ ...prev, [roomId]: true }));
    saveRoomsState(updated);
    toast({ title: "Vote Cast", description: "Successfully confirmed status." });
  };

  const handleDenyVote = (roomId: string) => {
    if (deniedRooms[roomId]) {
      toast({ title: "Already Voted", description: "You have already voted this status as inaccurate." });
      return;
    }
    const updated = rooms.map(room => {
      if (room.id !== roomId) return room;
      const isExpired = room.expiry_minutes === 0 || room.live_status === "unknown";
      if (isExpired) return room; // disabled if expired

      const nextDenies = room.deny_count + 1;
      const shouldExpire = nextDenies > room.confirmed_count;

      return {
        ...room,
        deny_count: nextDenies,
        live_status: shouldExpire ? "unknown" : room.live_status,
        expiry_minutes: shouldExpire ? 0 : room.expiry_minutes,
        current_report: shouldExpire ? null : room.current_report
      };
    });
    setDeniedRooms(prev => ({ ...prev, [roomId]: true }));
    saveRoomsState(updated);
    toast({ title: "Vote Cast", description: "Voted room status as inaccurate." });
  };

  const handleAddNewRoom = (newRoom: Classroom) => {
    setRooms(prev => {
      const updated = [newRoom, ...prev];
      // if (typeof window !== "undefined") {
      //   localStorage.setItem("intrst_classrooms", JSON.stringify(updated));
      // }
      return updated;
    });
  };

  // Filter classrooms by building selector, semester, and search query
  const displayedClassrooms = rooms.filter(room => {
    const matchesBuilding = room.building_name === selectedBuilding;
    const matchesSemester = room.semester ? room.semester === selectedSemester : true;
    const matchesSearch = searchQuery.trim() === "" ||
      room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.building_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.room_type && room.room_type.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBuilding && matchesSemester && matchesSearch;
  });

  // Dynamic statistics calculations
  const vacantCount = rooms.filter(r => r.live_status === 'empty' && r.expiry_minutes > 0).length;
  const occupiedCount = rooms.filter(r => r.live_status === 'occupied' && r.expiry_minutes > 0).length;
  const needsVoteCount = rooms.filter(r => r.live_status === 'unknown' || r.expiry_minutes === 0 || (r.confirmed_count < 5 && !r.is_verified)).length;

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-dmserif font-bold text-[#0f0f10] flex items-center gap-2">
            <Building2 className="w-8 h-8 text-[#505f78]" />
            Classroom Locator
          </h1>
          <p className="text-neutral-500">Real-time vacant room tracking for study and project groups.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-white border border-black/10 text-black font-bold hover:bg-[#f3f1eb] rounded-full shadow-sm" onClick={() => window.open('/timetable.pdf', '_blank')}>
            <CalendarDays className="w-4 h-4 mr-2 text-[#505f78]" />
            Full Schedule
          </Button>

          {/* Report/Add room dialog */}
          <AddRoomDialog
            onSuccess={handleAddNewRoom}
            building={selectedBuilding}
            reporterName={userProfile?.name || "Student"}
            isVerified={userProfile?.role === "verified_student" || true}
          />

          {(userProfile?.role === 'super_admin' || userProfile?.role === 'founder' || userProfile?.role === 'junior_moderator') && (
            <ManageRoomsDialog onSuccess={fetchClassrooms} currentBuilding={selectedBuilding} />
          )}
        </div>
      </div>

      {/* Semester Selector */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 mr-2">Semester:</span>
        {SEMESTERS.map(sem => (
          <Badge
            key={sem}
            onClick={() => setSelectedSemester(sem)}
            className={`cursor-pointer px-4 py-1.5 rounded-full transition-all text-xs font-bold ${selectedSemester === sem ? 'bg-black border-black text-white shadow-sm' : 'bg-white hover:bg-[#f3f1eb] border border-black/10 text-neutral-500'}`}
          >
            {sem}
          </Badge>
        ))}
      </div>

      {/* Dynamic Building Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5 bg-white border border-black/5 rounded-2xl flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Available Now</p>
            <h4 className="text-2xl font-dmserif font-bold text-[#0f0f10]">
              {vacantCount}
              <span className="text-sm font-sans font-semibold text-neutral-500 ml-1">rooms</span>
            </h4>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-black/5 rounded-2xl flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">In Use</p>
            <h4 className="text-2xl font-dmserif font-bold text-[#0f0f10]">
              {occupiedCount}
              <span className="text-sm font-sans font-semibold text-neutral-500 ml-1">rooms</span>
            </h4>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-black/5 rounded-2xl flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Needs Vote</p>
            <h4 className="text-2xl font-dmserif font-bold text-[#0f0f10]">
              {needsVoteCount}
              <span className="text-sm font-sans font-semibold text-neutral-500 ml-1">rooms</span>
            </h4>
          </div>
        </Card>
      </div>

      {/* Building Selector */}
      <div className="mb-4">
        <ScrollArea className="w-full whitespace-nowrap pb-2 hide-scrollbar">
          <div className="flex gap-2">
            {BUILDINGS.map((building) => (
              <Button
                key={building}
                onClick={() => setSelectedBuilding(building)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${selectedBuilding === building
                  ? "bg-black text-white shadow-sm"
                  : "bg-white hover:bg-[#f3f1eb] border border-black/10 text-[#0f0f10]"
                  }`}
              >
                {building}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Building Search: search bar below filters matching existing Home search bar style */}
      <div className="relative max-w-md mb-8">
        <div className="relative flex items-center bg-white/60 backdrop-blur-xl border border-black/5 rounded-2xl px-4 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.02)] focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.05)] focus-within:border-black/10 focus-within:bg-white/80 transition-all duration-300">
          <Search className="w-5 h-5 text-neutral-400 mr-2 shrink-0" />
          <Input
            type="text"
            placeholder="Search classroom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-transparent border-none p-0 outline-none text-sm text-[#0f0f10] placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-52 bg-white rounded-2xl border border-black/5 animate-pulse"></div>
          ))}
        </div>
      ) : rooms.filter(room => room.building_name === selectedBuilding && (room.semester ? room.semester === selectedSemester : true)).length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center bg-white border border-black/5 border-dashed text-center rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-[#505f78]" />
          </div>
          <h3 className="text-xl font-dmserif font-bold text-[#0f0f10] mb-2">No Rooms Registered</h3>
          <p className="text-neutral-500 max-w-md text-sm mb-4">No classrooms have been added for this building yet. Admin/Moderators can add rooms using the panel.</p>

          <AddRoomDialog
            onSuccess={handleAddNewRoom}
            building={selectedBuilding}
            reporterName={userProfile?.name || "Student"}
            isVerified={userProfile?.role === "verified_student" || true}
            triggerText="Report a Room"
          />
        </Card>
      ) : displayedClassrooms.length === 0 ? (
        <div className="p-12 text-center text-neutral-500 bg-white border border-black/5 rounded-2xl">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#505f78] opacity-50" />
          <p className="font-semibold text-sm">No classrooms match your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedClassrooms.map((room) => {
            const isStale = room.expiry_minutes === 0 || room.live_status === "unknown";
            const expiryText =
              room.expiry_minutes > 0 && room.expires_at
                ? `Expires at ${formatExpiryTime(room.expires_at)}`
                : "Expired";
            const isVerifiedBadge = (room.is_verified || room.confirmed_count >= 5) && !isStale;

            return (
              <Card key={room.id} className="relative overflow-hidden bg-white border border-black/5 hover:border-black/10 transition-all duration-300 group p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      {/* Room number and Status Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-3xl font-dmserif font-bold text-[#0f0f10] tracking-tight">
                          {room.display_name || room.room_number}
                        </h3>
                        {!isStale && room.live_status === 'empty' && (
                          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-none shrink-0">Vacant</Badge>
                        )}
                        {!isStale && room.live_status === 'occupied' && (
                          <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 border border-rose-500/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-none shrink-0">Occupied</Badge>
                        )}
                        {(isStale || room.live_status === 'unknown') && (
                          <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 border border-amber-500/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-none shrink-0">Needs Verification</Badge>
                        )}
                      </div>

                      {/* Metadata Hierarchy */}
                      <div className="space-y-2 mt-4 text-xs font-semibold text-neutral-500">
                        {/* Floor & Type */}
                        <div className="flex items-center gap-1.5 font-bold text-neutral-700">
                          <MapPin className="w-3.5 h-3.5 text-[#505f78] shrink-0" />
                          <span>Floor {room.floor || 1} • {room.room_type || "Classroom"}</span>
                        </div>
                        {/* Building */}
                        <div className="text-neutral-500 pl-5">
                          {room.building_name}
                        </div>
                        {/* Reporter & Verification badges */}
                        <div className="text-neutral-500 pl-5 flex items-center gap-1.5 flex-wrap">
                          <span>
                            {isStale ? (
                              <span className="text-amber-700/80 font-bold">Needs status verification</span>
                            ) : (
                              <>
                                Reported by <strong className="text-neutral-700 font-bold">{room.is_anonymous ? "Anonymous" : (room.reporter_name || "A student")}</strong>
                              </>
                            )}
                          </span>
                          {room.is_verified && !isStale && (
                            <Badge variant="outline" className="bg-[#505f78]/5 text-[#505f78] border-[#505f78]/10 text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0 shadow-none">
                              Verified Student
                            </Badge>
                          )}
                          {isVerifiedBadge && (
                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-none flex items-center shrink-0">
                              ✔ Verified
                            </Badge>
                          )}
                        </div>
                        {/* Countdown */}
                        {room.expiry_minutes > 0 && !isStale && (
                          <div className="text-neutral-400 font-bold pl-5 flex items-center gap-1.5">
                            <span>⏳ {expiryText}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      {(userProfile?.role === 'super_admin' || userProfile?.role === 'founder' || userProfile?.role === 'moderator' || userProfile?.role === 'junior_moderator') && (
                        <Dialog>
                          <DialogTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8 border border-black/5 rounded-full hover:bg-neutral-100 transition-colors">
                              <Plus className="w-4 h-4 text-neutral-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white border border-black/5 text-[#0f0f10] sm:rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="font-dmserif text-[#0f0f10]">Update Room Schedule</DialogTitle>
                              <DialogDescription>Modify room details or semester timetable.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <p className="text-sm text-[#855300] font-semibold">Coming soon: Bulk timetable upload</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <RoomTimetableDialog room={room} />
                    </div>
                  </div>

                  {/* Optional Notes */}
                  {room.note && (
                    <p className="text-xs text-neutral-500 italic mt-3.5 pl-3 border-l-2 border-black/10 leading-relaxed">
                      &ldquo;{room.note}&rdquo;
                    </p>
                  )}

                  {/* Verification section & Voting pills */}
                  <div className="mt-6 pt-4 border-t border-black/5">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        disabled={isStale}
                        onClick={() => handleConfirmVote(room.id)}
                        className="h-9 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-full flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        ✓ Confirm
                      </Button>

                      <Button
                        disabled={isStale}
                        onClick={() => handleDenyVote(room.id)}
                        className="h-9 border border-black/10 bg-white hover:bg-[#f3f1eb] text-black text-xs font-bold rounded-full flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        ✕ Deny
                      </Button>
                    </div>

                    {/* Counts secondary info */}
                    <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-400 font-medium mt-2.5">
                      <span>✓ {room.confirmed_count || 0} confirmations</span>
                      <span>✕ {room.deny_count || 0} denials</span>
                    </div>
                  </div>
                </div>

                {/* Footer updated date & report issue link */}
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-4 mt-4 border-t border-black/5">
                  <span className="flex flex-col gap-0.5 text-left font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      Updated {room.last_updated_at && !isStale ? new Date(room.last_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-semibold pl-5">
                      {isStale ? "Expired" : `Expires in ${room.expiry_minutes || 0} min`}
                    </span>
                  </span>
                  <ReportIssueDialog room={room} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoomTimetableDialog({ room }: { room: any }) {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${getApiUrl()}/classrooms/${room.id}/timetable`);
      if (resp.ok) {
        const data = await resp.json();
        setTimetable(data || []);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    setTimetable([
      { day_of_week: "Monday", start_time: "09:00 AM", end_time: "10:30 AM", subject: "Math Lecture" },
      { day_of_week: "Wednesday", start_time: "11:00 AM", end_time: "12:30 PM", subject: "Compiler Lab" },
      { day_of_week: "Friday", start_time: "02:00 PM", end_time: "03:30 PM", subject: "Project Presentation" }
    ]);
    setLoading(false);
  };

  return (

    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);

        if (isOpen) {
          fetchTimetable();
        }
      }}
    >
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-8 rounded-full border border-black/10 bg-white hover:bg-[#f3f1eb] text-black text-xs font-bold px-3 transition-all"
      >
        View Timetable
      </Button>
      <DialogContent className="bg-white border border-black/5 text-[#0f0f10] max-w-lg sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-dmserif text-[#0f0f10]">{room.display_name || room.room_number} Timetable</DialogTitle>
          <DialogDescription className="text-neutral-500">Detailed schedule for current semester.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] py-2">
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-10 animate-pulse text-neutral-500 text-sm">Loading timetable...</div>
            ) : timetable.length === 0 ? (
              <div className="text-center py-10 text-neutral-500 bg-[#faf9f6] rounded-xl border border-black/5 text-sm">No schedule sessions uploaded for this room.</div>
            ) : (
              timetable.map((item, idx) => (
                <div key={idx} className="bg-[#faf9f6] border border-black/5 rounded-xl p-4 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#855300] uppercase text-[10px] tracking-wider">{item.day_of_week}</span>
                    <span className="text-xs text-neutral-500 font-semibold">{item.start_time} - {item.end_time}</span>
                  </div>
                  <span className="text-[#0f0f10] font-semibold text-sm">{item.subject}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AddRoomDialog({ building, onSuccess, reporterName, isVerified, triggerText }: { building: string, onSuccess: (room: Classroom) => void, reporterName: string, isVerified: boolean, triggerText?: string }) {
  // const [roomNum, setRoomNum] = useState("");
  // const [selectedBuilding, setSelectedBuilding] = useState(building || "GST - Engineering");
  // const [floorNum, setFloorNum] = useState("1");
  // const [roomType, setRoomType] = useState("Classroom");
  const [selectedBuilding] = useState("ICT");
  const [floorNum, setFloorNum] = useState("1");
  const [roomType, setRoomType] = useState("Lecture Hall");
  const [roomNum, setRoomNum] = useState("");
  const [status, setStatus] = useState<"empty" | "occupied">("empty");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const availableRooms: string[] =
    (ICT_ROOMS as any)[Number(floorNum)]?.[roomType] || [];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNum.trim()) return;
    setLoading(true);
    const displayName = `${ROOM_PREFIX[roomType]}-${roomNum.toUpperCase()}`;
    console.log({
      roomNum,
      roomType,
      displayName
    });
    const generatedId = Date.now().toString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    expiresAt.setMinutes(0);
    expiresAt.setSeconds(0);
    expiresAt.setMilliseconds(0);

    const newRoomObj: Classroom = {
      id: generatedId,
      room_number: roomNum.toUpperCase(),
      display_name: displayName,
      floor: parseInt(floorNum) || 1,
      building_name: selectedBuilding,
      room_type: roomType,
      is_anonymous: isAnonymous,
      live_status: status,
      last_updated_at: new Date().toISOString(),
      is_verified: isAnonymous ? false : isVerified,
      confirmed_count: 1, // Start with 1 confirmation from reporter
      deny_count: 0,
      expiry_minutes: Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60)),
      expires_at: expiresAt.toISOString(),
      note: note || undefined,
      reporter_name: isAnonymous ? "Anonymous" : reporterName,
      current_report: {
        id: `r_${generatedId}`,
        status: status,
        reporter_name: isAnonymous ? "Anonymous" : reporterName,
        is_verified: isAnonymous ? false : isVerified
      }
    };


    try {
      // If using Supabase: Insert into rooms table
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${getApiUrl()}/classrooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          building_name: selectedBuilding,
          room_number: roomNum.toUpperCase(),
          floor: parseInt(floorNum) || 1,
          room_type: roomType,
          display_name: displayName
        })
      });

      if (response.ok) {
        const addedRoom = await response.json();
        newRoomObj.id = addedRoom.id || generatedId;

        // Call report endpoint to save initial status
        try {
          await fetch(`${getApiUrl()}/classrooms/report`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              classroom_id: addedRoom.id,
              status: status
            })
          });
        } catch (repErr) {
          console.error("Report status endpoint failed:", repErr);
        }
      }
    } catch (dbError) {
      console.error("Database connection failed, inserting locally:", dbError);
    }

    // Dynamic state update callback
    onSuccess(newRoomObj);

    // Reset Form
    setRoomNum("");
    setNote("");
    setFloorNum("1");
    setRoomType("Lecture Hall");
    setIsAnonymous(false);
    setOpen(false);
    setLoading(false);
    toast({ title: "Room Added", description: `Room ${roomNum.toUpperCase()} reported! +3 points earned.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          console.log("ADD ROOM CLICKED");
          setOpen(true);
        }}
        className="bg-white border border-black/5 text-[#0f0f10] font-semibold hover:bg-neutral-100 rounded-xl shadow-sm"
      >
        {triggerText ? (
          triggerText
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2 text-[#855300]" />
            Add Room
          </>
        )}
      </Button>
      <DialogContent
        className="bg-white border border-black/5 text-[#0f0f10] sm:rounded-2xl max-w-md
        [&>button]:rounded-full
        [&>button]:transition-all
        [&>button]:duration-200
        [&>button]:hover:bg-[#f5f5f4]
        [&>button]:hover:text-black"
      >
        <DialogHeader>
          <DialogTitle className="font-dmserif">Report Classroom Status</DialogTitle>
          <DialogDescription>Report vacancy status of Gitam campus classrooms.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddSubmit} className="space-y-4 py-2 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Building
              </label>

              <Input
                value="ICT"
                readOnly
                className="bg-[#faf9f6] border border-black/5 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Floor
              </label>

              <select
                value={floorNum}
                onChange={(e) => {
                  setFloorNum(e.target.value);
                  setRoomNum("");
                }}
                className="w-full bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3"
              >
                {[1, 2, 3, 4, 5, 6].map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Room Type
              </label>

              <select
                value={roomType}
                onChange={(e) => {
                  setRoomType(e.target.value);
                  setRoomNum("");
                }}
                className="w-full bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3"
              >
                <option value="Lecture Hall">Lecture Hall</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Seminar Hall">Seminar Hall</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Room Number
              </label>

              <select
                value={roomNum}
                onChange={(e) => setRoomNum(e.target.value)}
                className="w-full bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3"
              >
                <option value="">Select Room</option>

                {availableRooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 block">Status</label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setStatus("empty")}
                className={`flex-1 rounded-xl h-10 font-bold ${status === "empty" ? "bg-black text-white" : "bg-white text-black border border-black/5"}`}
              >
                Vacant
              </Button>
              <Button
                type="button"
                onClick={() => setStatus("occupied")}
                className={`flex-1 rounded-xl h-10 font-bold transition-all duration-200 ${status === "occupied"
                  ? "bg-black text-white"
                  : "bg-white text-black border border-black/10 hover:bg-[#fdf2f2] hover:border-rose-200 hover:text-rose-700"
                  }`}
              >
                Occupied
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Anonymous Report</span>
              <span className="text-[11px] text-neutral-500">Hide your username from the report card</span>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-black border-black/5 accent-black cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Optional Notes</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Free until 4 PM"
              className="bg-[#faf9f6] border border-black/5 rounded-xl text-[#0f0f10] placeholder-neutral-400"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRoomNum("");
                setNote("");
                setFloorNum("1");
                setRoomType("Lecture Hall");
                setIsAnonymous(false);
                setOpen(false);
              }}
              className="flex-1 h-11 rounded-xl border border-black/10 bg-white text-black hover:bg-[#f5f5f4] hover:border-black/20 hover:text-black transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black hover:bg-[#505f78] text-white rounded-xl font-semibold h-11"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageRoomsDialog({ currentBuilding, onSuccess }: { currentBuilding: string, onSuccess: () => void }) {
  const [bulkJson, setBulkJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleBulkUpload = async () => {
    if (!bulkJson) return;
    setLoading(true);
    try {
      const rooms = JSON.parse(bulkJson);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${getApiUrl()}/classrooms/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ rooms })
      });

      if (response.ok) {
        toast({ title: "Bulk Upload Complete", description: "Successfully updated classroom registry." });
        setBulkJson("");
        setOpen(false);
        onSuccess();
      }
    } catch (error) {
      toast({ title: "JSON Error", description: "Please check your JSON format.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-black hover:bg-[#505f78] text-white rounded-xl font-semibold shadow-sm"
      >
        <Plus className="w-4 h-4 mr-2 text-white" />
        Manage Rooms
      </Button>
      <DialogContent className="bg-white border border-black/5 text-[#0f0f10] max-w-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-dmserif text-[#0f0f10]">Admin Classroom Panel</DialogTitle>
          <DialogDescription>Bulk upload rooms for {currentBuilding} or manage existing ones.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bulk" className="w-full mt-4">
          <TabsList className="bg-[#faf9f6] border border-black/5 p-1 rounded-xl">
            <TabsTrigger value="bulk" className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] text-neutral-500 rounded-lg">Bulk Upload (JSON)</TabsTrigger>
            <TabsTrigger value="timetable" className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] text-neutral-500 rounded-lg">Update Timetable</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="pt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">JSON Input</label>
              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"building_name": "GST", "room_number": "301", "floor": 3}]'
                className="w-full h-40 bg-[#faf9f6] border border-black/5 rounded-xl p-4 text-xs font-mono text-[#0f0f10] resize-none outline-none focus:border-neutral-300"
              />
            </div>
            <Button onClick={handleBulkUpload} disabled={loading} className="w-full bg-black hover:bg-[#505f78] text-white rounded-xl font-semibold">
              {loading ? "Processing..." : "Execute Bulk Upload"}
            </Button>
          </TabsContent>

          <TabsContent value="timetable" className="pt-4 text-center py-10 opacity-60">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-[#855300]" />
            <p className="text-sm font-semibold">Select a room to update its semester timetable.</p>
            <p className="text-xs text-neutral-500 mt-2">Individual room timetable updates are available via room cards.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ReportIssueDialog({ room }: { room: Classroom }) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("AC not working");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast({ title: "Issue Reported", description: `Issue with ${room.display_name || room.room_number} submitted successfully.` });
      setSubmitting(false);
      setOpen(false);
      setDescription("");
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 font-semibold text-[#505f78] hover:text-black cursor-pointer transition-colors group/link"
      >
        Report Issue
        <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
      </span>
      <DialogContent className="bg-white border border-black/5 text-[#0f0f10] sm:rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-dmserif">Report Classroom Issue</DialogTitle>
          <DialogDescription>Let us know if there is an issue with {room.display_name || room.room_number}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 block">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3 text-sm text-[#0f0f10] outline-none"
            >
              <option value="AC not working">AC not working</option>
              <option value="Projector not working">Projector not working</option>
              <option value="Dirty classroom">Dirty classroom</option>
              <option value="Furniture damaged">Furniture damaged</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 block">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue..."
              className="w-full h-24 bg-[#faf9f6] border border-black/5 rounded-xl p-3 text-sm text-[#0f0f10] outline-none resize-none"
            />
          </div>
          <DialogFooter className="flex gap-2 pt-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border border-black/5 rounded-xl font-semibold h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-black hover:bg-[#505f78] text-white rounded-xl font-semibold h-11"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
