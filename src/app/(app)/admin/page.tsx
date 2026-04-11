"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { formatDistanceToNow } from "date-fns";
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XSquare, 
  Coffee, 
  PlusCircle, 
  UserCog,
  LayoutDashboard,
  ScrollText,
  UserCheck,
  UserX,
  Ban,
  Trash2,
  ShieldAlert,
  KeySquare,
  ShieldOff,
  Trophy
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminPage() {
  const { role, user_id } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingClubs, setPendingClubs] = useState<any[]>([]);
  const [clubRequests, setClubRequests] = useState<any[]>([]);
  const [canteens, setCanteens] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  
  const [newCanteen, setNewCanteen] = useState({
    name: "",
    description: "",
    location: "",
    image_url: "",
    category: "Main Canteen"
  });
  const [isAddingCanteen, setIsAddingCanteen] = useState(false);

  const canManageAdmins = ["super_admin", "founder"].includes(role);
  const canModerate = ["super_admin", "founder", "moderator"].includes(role);
  const canApproveEmails = ["super_admin", "founder", "moderator", "junior_moderator"].includes(role);
  const canManageClubs = ["super_admin", "founder", "moderator"].includes(role);
  const canViewAudit = ["super_admin", "founder"].includes(role);

  useEffect(() => {
    const fetchData = async () => {
       try {
          const [statsData, pendingData, requestsData, canteensData] = await Promise.all([
             apiFetch("/admin/stats").catch(() => ({
                totalUsers: 452,
                pendingVerifications: 12,
                reportedPosts: 3,
                activeCanteens: 8
             })),
             apiFetch("/admin/pending-users").catch(() => []),
             apiFetch("/admin/club-requests").catch(() => []),
             apiFetch("/canteens").catch(() => [])
          ]);
          setStats(statsData);
          if (Array.isArray(pendingData)) {
            setPendingClubs(pendingData.filter((u: any) => u.role === "club"));
          }
          if (Array.isArray(requestsData)) {
            setClubRequests(requestsData.filter(r => r.status === "pending"));
          }
          if (Array.isArray(canteensData)) {
            setCanteens(canteensData);
          }
       } catch (err) {
          console.warn("Dashboard fetch failed, showing demo data", err);
       } finally {
          setIsLoading(false);
       }
    };
    fetchData();
  }, []);

  const fetchAuditLogs = async () => {
    if (!canViewAudit) return;
    setAuditLoading(true);
    try {
      const data = await apiFetch("/admin/audit-logs");
      if (Array.isArray(data)) setAuditLogs(data);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setAuditLoading(false);
    }
  };

  const approveClub = async (userId: string) => {
    try {
      await apiFetch(`/admin/approve-user/${userId}`, { method: "POST" });
      toast.success("Club account approved");
      setPendingClubs(prev => prev.filter(c => c.user_id !== userId));
    } catch (err) {
      toast.error("Failed to approve club account");
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await apiFetch(`/admin/club-requests/${id}/approve`, { method: "POST" });
      toast.success("Application approved and email sent!");
      setClubRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error("Failed to approve application");
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await apiFetch(`/admin/club-requests/${id}/reject`, { method: "POST" });
      toast.success("Application rejected");
      setClubRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error("Failed to reject application");
    }
  };

  const handleAddCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCanteen(true);
    try {
      const data = await apiFetch("/admin/canteens", {
        method: "POST",
        body: JSON.stringify({...newCanteen, menu: []})
      });
      setCanteens(prev => [...prev, data]);
      setNewCanteen({ name: "", description: "", location: "", image_url: "", category: "Main Canteen" });
      toast.success("Canteen added successfully");
    } catch (err) {
      toast.error("Failed to add canteen");
    } finally {
      setIsAddingCanteen(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <Badge variant="outline" className="bg-brand/10 text-brand border-brand/20 px-3 py-1 font-semibold tracking-wider">
               {role.toUpperCase().replace('_', ' ')}
             </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-dmserif font-bold tracking-tight mb-3">Admin Control Center</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Manage the campus ecosystem, verify members, and maintain the intrst community integrity.
          </p>
        </div>
        {canViewAudit && (
          <div className="flex gap-3">
            <Button
              onClick={fetchAuditLogs}
              className="rounded-full bg-brand hover:bg-accent text-white h-12 px-6"
            >
              <ScrollText className="w-5 h-5 mr-2" />
              Load Audit Trail
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.totalUsers} icon={<Users />} color="brand" />
        <StatCard title="Pending Review" value={stats.pendingVerifications} icon={<CheckCircle2 />} color="amber" />
        <StatCard title="Reports" value={stats.reportedPosts} icon={<AlertTriangle />} color="rose" />
        <StatCard title="Canteens" value={stats.activeCanteens} icon={<Coffee />} color="indigo" />
      </div>

      {/* Main Controls */}
      <Tabs defaultValue={canModerate ? "moderation" : "approvals"} className="w-full">
        <TabsList className="bg-card/50 border border-border/40 p-1 rounded-2xl h-14 mb-8 flex-wrap gap-1">
          {canApproveEmails && <TabsTrigger value="approvals" className="rounded-xl px-6 h-12">Email Approvals</TabsTrigger>}
          {canModerate && <TabsTrigger value="moderation" className="rounded-xl px-6 h-12 data-[state=active]:bg-brand data-[state=active]:text-white">Moderation</TabsTrigger>}
          {canManageAdmins && <TabsTrigger value="members" className="rounded-xl px-6 h-12">Members</TabsTrigger>}
          {canManageClubs && <TabsTrigger value="requests" className="rounded-xl px-6 h-12">Club Requests</TabsTrigger>}
          {canManageClubs && <TabsTrigger value="clubs" className="rounded-xl px-6 h-12">Clubs</TabsTrigger>}
          {canManageAdmins && <TabsTrigger value="roles" className="rounded-xl px-6 h-12">Permissions</TabsTrigger>}
          {canViewAudit && (
            <TabsTrigger
              value="audit"
              className="rounded-xl px-6 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              onClick={fetchAuditLogs}
            >
              <ScrollText className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="space-y-6 outline-none">
           <Card className="bg-card/30 border-border/40 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="p-8 pb-4">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                       <CardTitle className="text-2xl font-dmserif font-bold">User Repository</CardTitle>
                       <CardDescription>Search, review activity, or manage any campus user.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                       <input 
                         placeholder="Search name, email, ID..." 
                         className="bg-background border border-border/40 rounded-full px-5 h-11 text-sm outline-none focus:border-brand/60"
                       />
                       <Button size="sm" className="bg-brand text-white rounded-full px-6">Search</Button>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                 <div className="rounded-2xl border border-border/40 divide-y divide-border/40 overflow-hidden">
                    <UserActivityItem 
                      name="Sumit Raj" 
                      email="sumit.raj@student.gitam.edu" 
                      points={420} 
                      level="Ambassador" 
                      status="active" 
                    />
                    <UserActivityItem 
                      name="Vikram Rao" 
                      email="vikram02@gmail.com" 
                      points={55} 
                      level="Novice" 
                      status="flagged" 
                    />
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6 outline-none">
           <Card className="bg-card/30 border-border/40 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-2xl font-dmserif font-bold">Pending Join Requests</CardTitle>
                 <CardDescription>Review students requesting access with non-institutional emails.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                 <div className="rounded-2xl border border-border/40 divide-y divide-border/40 font-medium">
                    <div className="flex items-center justify-between p-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">SR</div>
                          <div>
                             <div className="text-white">Rahul Verma</div>
                             <div className="text-sm text-muted-foreground">rahul.v@gmail.com</div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                         <Button size="sm" variant="outline" className="rounded-full">Reject</Button>
                         <Button size="sm" className="bg-brand text-white rounded-full px-6">Approve Access</Button>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6 outline-none">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <Card className="bg-card/30 border-border/40 backdrop-blur-sm overflow-hidden rounded-3xl">
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-2xl font-dmserif font-bold">Community Oversight</CardTitle>
                      <CardDescription>Handle reported content and behavioral flags.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <div className="rounded-2xl border border-border/40 divide-y divide-border/40 font-medium">
                         <ModerationItem title="Inappropriate joke in Foodies" reporter="John D." status="pending" type="post" />
                         <ModerationItem title="Toxic behavior reported" reporter="Systems" status="warning_sent" type="user" />
                      </div>
                    </CardContent>
                 </Card>
              </div>
              <div className="space-y-6">
                 <Card className="bg-brand/5 border-brand/20 rounded-3xl overflow-hidden">
                    <CardHeader className="p-8">
                       <CardTitle className="text-xl font-dmserif font-bold">Global Constraints</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                       <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-background/40">
                          <span className="text-xs font-bold uppercase">Shadowban Mode</span>
                          <div className="h-2 w-2 rounded-full bg-slate-500" />
                       </div>
                       <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                          <span className="text-xs font-bold uppercase text-amber-500">Auto-Flag Threshold</span>
                          <span className="text-xs font-mono font-bold">10 Reports</span>
                       </div>
                    </CardContent>
                 </Card>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6 outline-none">
           <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-sm">
              <CardHeader className="p-8">
                 <CardTitle className="text-2xl font-dmserif font-bold">New Club Inquiries</CardTitle>
                 <CardDescription>Review external organizations requesting official status on the platform.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                 <div className="space-y-6">
                    {clubRequests.length === 0 ? (
                       <div className="text-center py-20 px-8 rounded-3xl border border-dashed border-white/10 bg-white/5">
                          <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                          <p className="text-muted-foreground font-medium">No new club inquiries at the moment.</p>
                       </div>
                    ) : (
                       clubRequests.map((req) => (
                         <div key={req.id} className="p-8 bg-zinc-950/40 rounded-[2.5rem] border border-border/40 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                               <div className="flex items-start gap-6">
                                  <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                     <CheckCircle2 className="w-8 h-8" />
                                  </div>
                                  <div className="space-y-1">
                                     <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-2">{req.category}</Badge>
                                     <h3 className="text-2xl font-dmserif font-bold text-white">{req.club_name}</h3>
                                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> President: {req.president_name}</div>
                                        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {req.club_email}</div>
                                     </div>
                                  </div>
                               </div>
                               <div className="flex gap-2">
                                  <Button onClick={() => handleRejectRequest(req.id)} variant="outline" className="rounded-full h-11 px-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/10">Decline Application</Button>
                                  <Button onClick={() => handleApproveRequest(req.id)} className="bg-brand hover:bg-accent text-white rounded-full h-11 px-10 font-bold">Verify & Email</Button>
                               </div>
                            </div>
                            {req.description && (
                               <div className="p-6 bg-white/5 rounded-2xl text-zinc-300 text-sm italic border-l-4 border-brand/40">
                                 &ldquo;{req.description}&rdquo;
                               </div>
                            )}
                         </div>
                       ))
                    )}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="canteens" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-3xl bg-brand/5 border-brand/20">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-brand/20 flex items-center justify-center">
                  <PlusCircle className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-2xl font-dmserif font-bold">Add New Canteen</h3>
                <form onSubmit={handleAddCanteen} className="w-full space-y-4 text-left mt-4">
                   <input required minLength={2} className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 text-sm outline-none" placeholder="Canteen Name" value={newCanteen.name} onChange={e => setNewCanteen({...newCanteen, name: e.target.value})} />
                   <input className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 text-sm outline-none" placeholder="Location" value={newCanteen.location} onChange={e => setNewCanteen({...newCanteen, location: e.target.value})} />
                   <input className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 text-sm outline-none" placeholder="Image URL" value={newCanteen.image_url} onChange={e => setNewCanteen({...newCanteen, image_url: e.target.value})} />
                   <input className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 text-sm outline-none" placeholder="Category (e.g. Snacks, Meals)" value={newCanteen.category} onChange={e => setNewCanteen({...newCanteen, category: e.target.value})} />
                   <textarea className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 text-sm outline-none" placeholder="Description" rows={3} value={newCanteen.description} onChange={e => setNewCanteen({...newCanteen, description: e.target.value})} />
                   <Button disabled={isAddingCanteen} type="submit" className="w-full bg-brand text-white rounded-xl h-12 hover:bg-accent font-semibold transition-all">
                     {isAddingCanteen ? "Adding..." : "Register Outlet"}
                   </Button>
                </form>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/40">
               <CardHeader className="p-8">
                 <CardTitle className="text-2xl font-dmserif font-bold">Active Outlets</CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0">
                 <div className="space-y-4">
                    {canteens.map(c => (
                      <OutletItem key={c.id} name={c.name} rating={c.average_rating || 0} status={(c.average_rating || 0) > 4 ? 'open' : 'busy'} />
                    ))}
                    {canteens.length === 0 && <p className="text-muted-foreground text-sm">No canteens added yet.</p>}
                 </div>
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-6 outline-none">
           <Card className="rounded-3xl border-border/40 bg-card/30">
              <CardHeader className="p-8">
                 <CardTitle className="text-2xl font-dmserif font-bold">Club Authentication</CardTitle>
                 <CardDescription>Manually verify accounts ending with _vsp@gitam.in</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                 <div className="space-y-6">
                    {pendingClubs.length === 0 ? (
                       <p className="text-muted-foreground">No pending clubs to approve.</p>
                     ) : (
                       pendingClubs.map((club) => (
                         <div key={club.user_id} className="flex items-center justify-between p-6 bg-background/50 rounded-2xl border border-border/40 hover:border-brand/30 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-brand font-bold text-lg">{club.name ? club.name[0] : 'C'}</div>
                               <div>
                                  <div className="font-bold text-white uppercase tracking-wider">{club.club_metadata?.name || club.name || "Unnamed Club"}</div>
                                  <div className="text-xs text-muted-foreground font-mono">{club.username}</div>
                                  <div className="text-xs text-muted-foreground">{club.club_metadata?.category || "Category pending"}</div>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <Button size="sm" onClick={() => approveClub(club.user_id)} className="bg-brand text-white rounded-full px-6 font-bold">Approve</Button>
                            </div>
                         </div>
                       ))
                     )}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6 outline-none">
           <Card className="rounded-3xl border-border/40 bg-card/30 overflow-hidden">
              <CardHeader className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl bg-brand/10 text-brand">
                        <UserCog className="w-10 h-10" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-dmserif font-bold">Role & Permission Matrix</CardTitle>
                        <CardDescription>Configure granular system access for staff accounts.</CardDescription>
                      </div>
                   </div>
                   <Button className="bg-brand text-white rounded-full h-12 px-8 font-bold shadow-lg hover:shadow-brand/20 transition-all">Add Staff Member</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-background/50 border-y border-border/40">
                          <tr>
                             <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin Member</th>
                             <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Level</th>
                             <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Caps</th>
                             <th className="px-8 py-4 text-right"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-border/40">
                          <PermissionsRow 
                            name="Sampath" 
                            email="sampath@gitam.in" 
                            role="Founder" 
                            caps={["Root", "Finance", "Users", "DB"]} 
                          />
                          <PermissionsRow 
                            name="Manish" 
                            email="manish@gitam.in" 
                            role="Super Admin" 
                            caps={["All Mods", "Analytics"]} 
                          />
                          <PermissionsRow 
                            name="Kedhar" 
                            email="bkedhar10@gitam.in" 
                            role="Moderator" 
                            caps={["Filter", "Warn", "Approve"]} 
                          />
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
        {canViewAudit && (
          <TabsContent value="audit" className="space-y-6 outline-none">
            <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
              <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
                      <ScrollText className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-dmserif font-bold">Administrative Audit Trail</CardTitle>
                      <CardDescription>Full log of all admin actions for oversight and accountability.</CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={fetchAuditLogs}
                    disabled={auditLoading}
                    variant="outline"
                    className="rounded-full h-10 px-6 border-border/60 text-sm"
                  >
                    {auditLoading ? "Refreshing..." : "↻ Refresh"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {auditLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/5">
                    <ScrollText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No audit logs yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Actions will appear here as admins make changes.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <AuditLogItem key={log.id} log={log} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
       </Tabs>
    </div>
  );
}

function UserActivityItem({ name, email, points, level, status }: any) {
  return (
    <div className="flex items-center justify-between p-6 hover:bg-white/5 transition-all">
      <div className="flex items-center gap-5">
        <Avatar className="w-12 h-12 border border-border/60">
          <AvatarFallback className="bg-brand/10 text-brand font-bold text-lg">
            {name ? name[0] : "@"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-bold text-white flex items-center gap-2">
            {name}
            <Badge
              variant="outline"
              className={`text-[10px] h-5 uppercase tracking-tighter ${
                status === "flagged"
                  ? "border-amber-500/50 text-amber-500"
                  : "border-emerald-500/50 text-emerald-400"
              }`}
            >
              {status}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground font-mono opacity-80">
            {email}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-center hidden sm:block">
          <div className="text-lg font-dmserif font-bold text-white">
            {points}
          </div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">
            {level}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-5 text-xs text-brand font-bold"
          >
            Review Activity
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-4 text-xs text-rose-400 hover:bg-rose-500/10"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

function PermissionsRow({ name, email, role, caps }: any) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-8 py-6">
        <div className="font-bold text-white">{name}</div>
        <div className="text-xs text-muted-foreground font-mono">{email}</div>
      </td>
      <td className="px-8 py-6">
        <Badge
          variant="outline"
          className="text-[10px] px-2.5 py-1 bg-brand/10 border-brand/30 text-brand uppercase font-bold"
        >
          {role}
        </Badge>
      </td>
      <td className="px-8 py-6">
        <div className="flex gap-2 flex-wrap">
          {caps.map((c: string) => (
            <span
              key={c}
              className="text-[10px] border border-white/10 rounded-full px-2.5 py-1 text-muted-foreground font-medium bg-white/5"
            >
              {c}
            </span>
          ))}
          <button className="text-[10px] text-brand font-bold underline px-1 hover:text-white transition-colors">
            Edit
          </button>
        </div>
      </td>
      <td className="px-8 py-6 text-right">
        <Button
          variant="ghost"
          className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 h-10 px-4 rounded-xl"
        >
          Revoke Access
        </Button>
      </td>
    </tr>
  );
}


function StatCard({ title, value, icon, color }: any) {
  const colorMap: any = {
    brand: "bg-brand/10 text-brand",
    rose: "bg-rose-500/10 text-rose-400",
    amber: "bg-amber-500/10 text-amber-400",
    indigo: "bg-indigo-500/10 text-indigo-400",
  };
  return (
    <Card className="bg-card/20 border-border/40 rounded-3xl overflow-hidden relative group transition-all hover:bg-card/40">
       <CardContent className="p-8">
         <div className={`p-4 rounded-2xl inline-flex mb-6 ${colorMap[color] || colorMap.brand} group-hover:scale-110 transition-transform`}>
           {icon && <div className="w-8 h-8">{icon}</div>}
         </div>
         <div className="text-4xl font-dmserif font-bold mb-1 tracking-tight">{value}</div>
         <div className="text-muted-foreground font-medium">{title}</div>
       </CardContent>
    </Card>
  );
}

function ModerationItem({ title, reporter, status, type }: any) {
  return (
    <div className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
       <div className="flex items-center gap-4">
         <div className={`p-3 rounded-xl ${status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
           {type === 'post' ? <Users className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
         </div>
         <div>
           <div className="font-semibold text-white">{title}</div>
           <div className="text-sm text-muted-foreground">Reported by {reporter}</div>
         </div>
       </div>
       <div className="flex items-center gap-3">
         <Button size="sm" variant="outline" className="rounded-full h-9 px-5 border-border/60 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/40">Ignore</Button>
         <Button size="sm" className="bg-brand text-white rounded-full h-9 px-5">Take Action</Button>
       </div>
    </div>
  );
}

function OutletItem({ name, rating, status }: any) {
   return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/40 hover:border-brand/40 transition-all cursor-pointer">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold">
            {name[0]}
          </div>
          <div>
            <div className="font-bold">{name}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
               <Shield className="w-3 h-3 text-brand" /> {rating} avg rating
            </div>
          </div>
       </div>
       <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${status === 'open' ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span className="text-xs uppercase font-bold tracking-widest opacity-60">{status}</span>
       </div>
    </div>
   );
}

function RoleItem({ email, role }: any) {
  return (
    <div className="flex items-center justify-between p-6">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400">@</div>
          <div>
            <div className="font-bold">{email}</div>
            <div className="text-xs text-muted-foreground font-mono">{role}</div>
          </div>
       </div>
       <Button variant="ghost" className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl h-10 px-4">Remove Access</Button>
    </div>
  )
}

const AUDIT_ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  APPROVE_USER:    { label: "Approved User",       icon: <UserCheck className="w-4 h-4" />,   color: "bg-emerald-500/15 text-emerald-400" },
  REJECT_USER:     { label: "Rejected User",        icon: <UserX className="w-4 h-4" />,       color: "bg-rose-500/15 text-rose-400" },
  SUSPEND_USER:    { label: "Suspended User",       icon: <Ban className="w-4 h-4" />,         color: "bg-amber-500/15 text-amber-400" },
  UNSUSPEND_USER:  { label: "Unsuspended User",     icon: <ShieldOff className="w-4 h-4" />,   color: "bg-sky-500/15 text-sky-400" },
  WARN_USER:       { label: "Warned User",          icon: <ShieldAlert className="w-4 h-4" />, color: "bg-orange-500/15 text-orange-400" },
  REMOVE_CONTENT:  { label: "Removed Content",      icon: <Trash2 className="w-4 h-4" />,      color: "bg-red-500/15 text-red-400" },
  REMOVE_USER:     { label: "Permanently Removed User", icon: <UserX className="w-4 h-4" />,  color: "bg-red-600/20 text-red-500" },
  SET_ROLE:        { label: "Changed Role",         icon: <KeySquare className="w-4 h-4" />,   color: "bg-purple-500/15 text-purple-400" },
  DELETE_EVENT:    { label: "Deleted Event",        icon: <Trash2 className="w-4 h-4" />,      color: "bg-rose-500/15 text-rose-400" },
};

function AuditLogItem({ log }: { log: any }) {
  const meta = AUDIT_ACTION_META[log.action] || {
    label: log.action.replace(/_/g, " "),
    icon: <ScrollText className="w-4 h-4" />,
    color: "bg-zinc-500/15 text-zinc-400",
  };

  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-background/40 border border-border/30 hover:border-border/60 hover:bg-background/60 transition-all group">
      {/* Action Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{meta.label}</span>
          {log.target?.name && (
            <span className="text-xs text-muted-foreground">
              → <span className="text-foreground font-medium">{log.target.name}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground/80">
            by <span className="text-foreground/70 font-medium">{log.admin?.name || "Unknown Admin"}</span>
          </span>
          {log.details && Object.keys(log.details).length > 0 && (
            <span className="text-[10px] font-mono bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-muted-foreground/60 max-w-xs truncate">
              {JSON.stringify(log.details)}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider shrink-0 text-right">
        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
      </div>
    </div>
  );
}
