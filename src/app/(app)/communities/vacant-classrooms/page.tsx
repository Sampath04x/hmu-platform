"use client";

import { useState, useEffect } from "react";
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
  CalendarDays
} from "lucide-react";
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

const BUILDINGS = [
  "GST - Engineering",
  "GSB - Business",
  "GSS - Science",
  "Architecture",
  "Law",
  "Pharmacy",
  "Humanities"
];

const SEMESTERS = ["Odd 2025", "Even 2024", "Odd 2024"];

export default function VacantClassrooms() {
  const [selectedBuilding, setSelectedBuilding] = useState("GST - Engineering");
  const [selectedSemester, setSelectedSemester] = useState("Odd 2025");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [selectedBuilding]);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classrooms?building=${encodeURIComponent(selectedBuilding)}`);
      const data = await response.json();
      setClassrooms(data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast({
        title: "Error",
        description: "Failed to load classrooms. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (classroomId: string, status: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "You need to be logged in to report status." });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classrooms/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ classroom_id: classroomId, status })
      });

      if (response.ok) {
        toast({ title: "Status Reported", description: `Marked room as ${status}.` });
        fetchClassrooms();
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not report status.", variant: "destructive" });
    }
  };

  const handleVote = async (reportId: string, voteType: boolean) => {
    if (!user) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classrooms/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ report_id: reportId, vote_type: voteType })
      });

      if (response.ok) {
        fetchClassrooms();
      }
    } catch (error) {
      console.error("Voting error", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-dmserif font-bold text-white flex items-center gap-2">
            <Building2 className="w-8 h-8 text-brand" />
            Classroom Locator
          </h1>
          <p className="text-muted-foreground">Real-time vacant room tracking for students.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-card border-border/50 text-white font-medium hover:bg-muted" onClick={() => window.open('/timetable.pdf', '_blank')}>
            <CalendarDays className="w-4 h-4 mr-2" />
            Full Schedule
          </Button>

          <AddRoomDialog onSuccess={fetchClassrooms} building={selectedBuilding} />

          {(userProfile?.role === 'super_admin' || userProfile?.role === 'founder' || userProfile?.role === 'junior_moderator') && (
            <ManageRoomsDialog onSuccess={fetchClassrooms} currentBuilding={selectedBuilding} />
          )}
        </div>
      </div>

      {/* Semester Selector */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Semester:</span>
        {SEMESTERS.map(sem => (
            <Badge 
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                variant="outline"
                className={`cursor-pointer px-4 py-1.5 rounded-lg transition-all ${selectedSemester === sem ? 'bg-brand border-brand text-white' : 'hover:bg-muted border-border/50 text-muted-foreground'}`}
            >
                {sem}
            </Badge>
        ))}
      </div>

      {/* Building Summary Stats / Chart */}
      {!loading && classrooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-brand/10 border-brand/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-brand" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Now</p>
              <h4 className="text-2xl font-bold text-white">
                {classrooms.filter(r => r.live_status === 'empty').length} 
                <span className="text-sm font-normal text-muted-foreground ml-1">rooms</span>
              </h4>
            </div>
          </Card>
          
          <Card className="p-4 bg-muted/20 border-border/50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Use</p>
              <h4 className="text-2xl font-bold text-white">
                {classrooms.filter(r => r.live_status === 'occupied').length} 
                <span className="text-sm font-normal text-muted-foreground ml-1">rooms</span>
              </h4>
            </div>
          </Card>

          <Card className="p-4 bg-muted/20 border-border/50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verification Needed</p>
              <h4 className="text-2xl font-bold text-white">
                {classrooms.filter(r => r.live_status === 'unknown' || !r.current_report).length} 
                <span className="text-sm font-normal text-muted-foreground ml-1">rooms</span>
              </h4>
            </div>
          </Card>
        </div>
      )}

      {/* Building Selector */}
      <div className="mb-10">
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex gap-3">
            {BUILDINGS.map((building) => (
              <Button
                key={building}
                onClick={() => setSelectedBuilding(building)}
                variant={selectedBuilding === building ? "default" : "outline"}
                className={`rounded-full px-6 transition-all ${
                  selectedBuilding === building 
                    ? "bg-brand text-white shadow-lg" 
                    : "bg-card border-border/50 text-muted-foreground hover:text-white"
                }`}
              >
                {building}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-card rounded-2xl border border-border/50"></div>
            ))}
        </div>
      ) : classrooms.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center bg-card border-border border-dashed text-center">
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-brand" />
            </div>
            <h3 className="text-xl font-dmserif font-bold text-white mb-2">No Rooms Registered</h3>
            <p className="text-muted-foreground max-w-md">No classrooms have been added for this building yet. Admin/Moderators can add rooms via the dashboard.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((room) => (
            <Card key={room.id} className="relative overflow-hidden bg-card border-border/50 hover:bg-card/80 transition-all group glow-hover p-5 border-l-4" style={{ 
              borderLeftColor: room.live_status === 'empty' ? '#8B8B43' : room.live_status === 'occupied' ? '#ef4444' : '#64748b' 
            }}>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-dmserif font-bold text-white flex items-center gap-2">
                    {room.room_number}
                    {room.live_status === 'empty' && (
                        <Badge className="bg-brand/20 text-brand hover:bg-brand/30 border-brand/50 text-[10px] uppercase font-bold">VACANT</Badge>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Floor {room.floor} • {room.building_name}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {(userProfile?.role === 'super_admin' || userProfile?.role === 'founder' || userProfile?.role === 'moderator' || userProfile?.role === 'junior_moderator') && (
                    <Dialog>
                      <DialogTrigger>
                        <Button variant="ghost" size="icon" className="h-10 w-10 border border-border/50 rounded-xl hover:bg-brand/10 transition-colors">
                          <Plus className="w-5 h-5 text-muted-foreground hover:text-brand" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border/80 text-white">
                        <DialogHeader>
                          <DialogTitle>Update Room Schedule</DialogTitle>
                          <DialogDescription>Modify room details or semester timetable.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                           <p className="text-sm text-brand font-medium">Coming soon: Bulk timetable upload</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <RoomTimetableDialog room={room} />
                </div>
              </div>

              {/* Status Section */}
              <div className="mb-6">
                <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Status Poll</span>
                    <span className="text-[10px] text-brand/80 font-semibold uppercase">Real-time</span>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button 
                        onClick={() => handleReport(room.id, 'empty')}
                        variant="outline" 
                        className={`h-auto py-3 px-2 flex-col gap-1 border-border/50 transition-all ${room.live_status === 'empty' ? 'bg-brand/10 border-brand' : 'hover:bg-brand/5'}`}
                    >
                        <ThumbsUp className={`w-5 h-5 ${room.live_status === 'empty' ? 'text-brand' : 'text-muted-foreground'}`} />
                        <span className="text-[10px] font-bold">ITS EMPTY</span>
                        {room.votes?.up > 0 && <span className="text-[9px] opacity-70">{room.votes.up} votes</span>}
                    </Button>
                    
                    <Button 
                        onClick={() => handleReport(room.id, 'occupied')}
                        variant="outline" 
                        className={`h-auto py-3 px-2 flex-col gap-1 border-border/50 transition-all ${room.live_status === 'occupied' ? 'bg-red-500/10 border-red-500' : 'hover:bg-red-500/5'}`}
                    >
                        <ThumbsDown className={`w-5 h-5 ${room.live_status === 'occupied' ? 'text-red-500' : 'text-muted-foreground'}`} />
                        <span className="text-[10px] font-bold">ITS FULL</span>
                        {room.votes?.down > 0 && <span className="text-[9px] opacity-70">{room.votes.down} votes</span>}
                    </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/50">
                <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Updated {room.last_updated_at ? new Date(room.last_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
                <span className="flex items-center gap-1.5 font-medium hover:text-white cursor-pointer transition-colors group/link">
                    Report Issue <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomTimetableDialog({ room }: { room: any }) {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classrooms/${room.id}/timetable`);
      const data = await resp.json();
      setTimetable(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => open && fetchTimetable()}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-10 w-10 border border-border/50 rounded-xl hover:bg-brand/10 transition-colors" />}>
        <Clock className="w-5 h-5 text-muted-foreground hover:text-brand" />
      </DialogTrigger>
      <DialogContent className="bg-card border-border/80 text-white max-w-lg">
        <DialogHeader>
            <DialogTitle className="text-2xl font-dmserif text-white">Room {room.room_number} Timetable</DialogTitle>
            <DialogDescription className="text-muted-foreground">Detailed schedule for current semester.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] py-4">
          <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10 animate-pulse text-muted-foreground">Loading timetable...</div>
              ) : timetable.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-muted/10 rounded-xl">No schedule sessions uploaded for this room.</div>
              ) : (
                timetable.map((item, idx) => (
                  <div key={idx} className="bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-brand uppercase text-[10px] tracking-wider">{item.day_of_week}</span>
                      <span className="text-xs text-muted-foreground">{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                    </div>
                    <span className="text-white font-medium">{item.subject}</span>
                  </div>
                ))
              )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AddRoomDialog({ building, onSuccess }: { building: string, onSuccess: () => void }) {
    const [roomNum, setRoomNum] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAdd = async () => {
        if (!roomNum) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classrooms`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ 
                    building_name: building, 
                    room_number: roomNum,
                    floor: parseInt(roomNum[0]) || 0
                })
            });

            if (response.ok) {
                toast({ title: "Room Added", description: `Room ${roomNum} is now being tracked. +3 Points!` });
                setRoomNum("");
                onSuccess();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger render={<Button variant="outline" className="bg-card border-border/50 text-white font-medium hover:bg-brand/10" />}>
                <Plus className="w-4 h-4 mr-2" />
                Add Room
            </DialogTrigger>
            <DialogContent className="bg-card border-border/80 text-white">
                <DialogHeader>
                    <DialogTitle>Add Missing Room</DialogTitle>
                    <DialogDescription>Found a room not listed in {building}? Add it here it start tracking.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Room Number / Name</label>
                        <Input 
                            value={roomNum} 
                            onChange={(e) => setRoomNum(e.target.value)} 
                            placeholder="e.g. 302, LT-1, Seminar Hall"
                            className="bg-muted/30 border-border/50"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAdd} disabled={loading} className="bg-brand hover:bg-brand/90">
                        {loading ? "Adding..." : "Add Room"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ManageRoomsDialog({ currentBuilding, onSuccess }: { currentBuilding: string, onSuccess: () => void }) {
    const [bulkJson, setBulkJson] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleBulkUpload = async () => {
        if (!bulkJson) return;
        setLoading(true);
        try {
            const rooms = JSON.parse(bulkJson);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classrooms/bulk`, {
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
                onSuccess();
            }
        } catch (error) {
            toast({ title: "JSON Error", description: "Please check your JSON format.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger render={<Button className="bg-brand hover:bg-brand/90 font-semibold shadow-[0_0_20px_rgba(139,139,67,0.3)]" />}>
                <Plus className="w-4 h-4 mr-2" />
                Manage Rooms
            </DialogTrigger>
            <DialogContent className="bg-card border-border/80 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-dmserif">Admin Classroom Panel</DialogTitle>
                    <DialogDescription>Bulk upload rooms for {currentBuilding} or manage existing ones.</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="bulk" className="w-full">
                    <TabsList className="bg-muted/30 border border-border/50">
                        <TabsTrigger value="bulk">Bulk Upload (JSON)</TabsTrigger>
                        <TabsTrigger value="timetable">Update Timetable</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="bulk" className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">JSON Input</label>
                            <textarea 
                                value={bulkJson}
                                onChange={(e) => setBulkJson(e.target.value)}
                                placeholder='[{"building_name": "GST", "room_number": "301", "floor": 3}]'
                                className="w-full h-40 bg-muted/20 border border-border/50 rounded-xl p-4 text-xs font-mono text-white resize-none"
                            />
                        </div>
                        <Button onClick={handleBulkUpload} disabled={loading} className="w-full bg-brand">
                            {loading ? "Processing..." : "Execute Bulk Upload"}
                        </Button>
                    </TabsContent>
                    
                    <TabsContent value="timetable" className="pt-4 text-center py-10 opacity-60">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 text-brand" />
                        <p>Select a room to update its semester timetable.</p>
                        <p className="text-xs mt-2">Individual room timetable updates are available via room cards.</p>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
