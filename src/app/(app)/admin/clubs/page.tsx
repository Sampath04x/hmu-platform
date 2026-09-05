"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  CheckCircle2, 
  ClipboardList, 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw,
  Clock,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard, AdminCardContent } from "@/components/admin/AdminCard";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageLoader } from "@/components/admin/AdminSkeleton";

export default function AdminClubsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({ pending: [], approved: [], rejected: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedClubRequest, setSelectedClubRequest] = useState<any>(null);

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendingClub, setSuspendingClub] = useState<any>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [submittingSuspend, setSubmittingSuspend] = useState(false);

  const [unsuspendModalOpen, setUnsuspendModalOpen] = useState(false);
  const [unsuspendingClub, setUnsuspendingClub] = useState<any>(null);
  const [submittingUnsuspend, setSubmittingUnsuspend] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingClub, setDeletingClub] = useState<any>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);

  const ADMIN_ROLES = ['super_admin', 'founder', 'moderator', 'junior_moderator'];

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("club_requests")
        .select("id, club_name, club_email, president_name, category, description, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const all = rows || [];
      setData({
        pending: all.filter((r: any) => r.status === "pending"),
        approved: all.filter((r: any) => r.status === "approved"),
        rejected: all.filter((r: any) => r.status === "rejected"),
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load clubs data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Verify current user is an admin before allowing any actions
    const checkAdminRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          setIsAdminUser(false);
          return;
        }
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        if (error || !profile) {
          setIsAdminUser(false);
          return;
        }
        setIsAdminUser(ADMIN_ROLES.includes(profile.role));
      } catch {
        setIsAdminUser(false);
      }
    };

    checkAdminRole();
    fetchData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "suspended") {
        setActiveTab("active");
        setStatusFilter("suspended");
      } else if (tab && ["pending", "active", "rejected"].includes(tab)) {
        setActiveTab(tab);
      }
      const q = params.get("search");
      if (q) setSearchQuery(q);
    }
  }, []);

  const handleApproveClub = async (id: string) => {
    if (!isAdminUser) {
      toast.error("Access denied. You do not have permission to perform this action.");
      return;
    }
    try {
      const { error } = await supabase
        .from("club_requests")
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
      toast.success("Club request approved!");
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve club.");
    }
  };

  const handleRejectClubSubmit = async () => {
    if (!rejectingRequest) return;
    if (!isAdminUser) {
      toast.error("Access denied. You do not have permission to perform this action.");
      return;
    }
    setSubmittingReject(true);
    try {
      const { error } = await supabase
        .from("club_requests")
        .update({ status: "rejected" })
        .eq("id", rejectingRequest.id);
      if (error) throw error;
      toast.success("Club request rejected.");
      setRejectModalOpen(false);
      setRejectingRequest(null);
      setRejectionReason("");
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject club.");
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleSuspendSubmit = async () => {
    if (!suspendingClub) return;
    setSubmittingSuspend(true);
    try {
      await apiFetch(`/admin/suspend-user/${suspendingClub.user_id}`, {
        method: "POST",
        body: JSON.stringify({ reason: suspensionReason })
      });
      toast.success("Club suspended successfully");
      setSuspendModalOpen(false);
      setSuspensionReason("");
      setSuspendingClub(null);
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend club");
    } finally {
      setSubmittingSuspend(false);
    }
  };

  const handleUnsuspendSubmit = async () => {
    if (!unsuspendingClub) return;
    setSubmittingUnsuspend(true);
    try {
      await apiFetch(`/admin/unsuspend-user/${unsuspendingClub.user_id}`, { method: "POST" });
      toast.success("Club unsuspended successfully");
      setUnsuspendModalOpen(false);
      setUnsuspendingClub(null);
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to unsuspend club");
    } finally {
      setSubmittingUnsuspend(false);
    }
  };

  const handleDeleteClubSubmit = async () => {
    if (!deletingClub) return;
    setSubmittingDelete(true);
    try {
      await apiFetch(`/admin/remove-user/${deletingClub.user_id}`, { method: "DELETE" });
      toast.success("Club deleted permanently");
      setDeleteModalOpen(false);
      setDeletingClub(null);
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete club");
    } finally {
      setSubmittingDelete(false);
    }
  };

  const getCategories = () => {
    const cats = new Set<string>();
    data.pending.forEach((c: any) => c.category && cats.add(c.category));
    data.approved.forEach((c: any) => c.club_metadata?.category && cats.add(c.club_metadata.category));
    data.rejected.forEach((c: any) => c.category && cats.add(c.category));
    return Array.from(cats);
  };

  const filterList = (list: any[], type: "pending" | "active" | "rejected") => {
    return list.filter((item: any) => {
      let name = "";
      let category = "";
      let president = "";
      let createdAt = "";

      if (type === "active") {
        name = item.name || "";
        category = item.club_metadata?.category || "";
        president = item.club_metadata?.president_name || item.username || "";
        createdAt = item.created_at || "";
      } else {
        name = item.club_name || "";
        category = item.category || "";
        president = item.president_name || "";
        createdAt = item.created_at || "";
      }

      const matchSearch = searchQuery === "" || 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        president.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = categoryFilter === "all" || category.toLowerCase() === categoryFilter.toLowerCase();

      let matchStatus = true;
      if (type === "active" && statusFilter !== "all") {
        if (statusFilter === "active") matchStatus = !item.is_suspended;
        if (statusFilter === "suspended") matchStatus = item.is_suspended;
      }

      let matchDate = true;
      if (dateFilter !== "all" && createdAt) {
        const itemDate = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (dateFilter === "today") matchDate = diffDays <= 1;
        if (dateFilter === "week") matchDate = diffDays <= 7;
        if (dateFilter === "month") matchDate = diffDays <= 30;
      }

      return matchSearch && matchCategory && matchStatus && matchDate;
    });
  };

  if (loading) {
    return <AdminPageLoader text="Loading campus clubs..." />;
  }

  const categories = getCategories();

  // Split approved list into Active and Suspended
  const approvedClubsList = data.approved || [];
  const activeClubsRaw = approvedClubsList.filter((c: any) => !c.is_suspended);
  const suspendedClubsRaw = approvedClubsList.filter((c: any) => c.is_suspended);

  const pendingClubs = filterList(data.pending || [], "pending");
  const activeClubs = filterList(approvedClubsList, "active");
  const rejectedClubs = filterList(data.rejected || [], "rejected");

  const initials = (name: string) => {
    return name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "C";
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Clubs Registry"
        description="Review club requests, manage active clubs, and moderate registered student organizations."
        action={
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => fetchData(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Clubs
          </AdminButton>
        }
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10]">
              {data.pending?.length || 0}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Pending Requests</div>
          </AdminCardContent>
        </AdminCard>
 
        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10]">
              {approvedClubsList.length}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Approved Clubs</div>
          </AdminCardContent>
        </AdminCard>
 
        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10]">
              {activeClubsRaw.length}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Active Clubs</div>
          </AdminCardContent>
        </AdminCard>
 
        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10]">
              {data.rejected?.length || 0}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Rejected Requests</div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Search & Filter bar */}
      <AdminCard>
        <AdminCardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by name, president, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-black/5 text-xs bg-white/60 h-10 w-full outline-none focus:bg-white transition-all shadow-[0_1px_8px_rgba(0,0,0,0.01)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white/60 border border-black/5 rounded-full h-10 px-4 text-neutral-500 outline-none font-medium focus:bg-white hover:border-black/10 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-white/60 border border-black/5 rounded-full h-10 px-4 text-neutral-500 outline-none font-medium focus:bg-white hover:border-black/10 transition-all cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs bg-white/60 border border-black/5 rounded-full h-10 px-4 text-neutral-500 outline-none font-medium focus:bg-white hover:border-black/10 transition-all cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Created Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Unified Tabs */}
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#f0ede6] border border-black/5 p-1 rounded-xl w-full sm:w-auto flex overflow-x-auto gap-1">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-500 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Pending Requests ({pendingClubs.length})
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Approved / Active ({activeClubs.length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Rejected ({rejectedClubs.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="pt-4 space-y-4">
          {pendingClubs.length === 0 ? (
            <AdminEmptyState
              icon={<ClipboardList className="w-8 h-8 text-neutral-400" />}
              title="No Pending Club Requests"
              description="There are currently no club requests waiting for verification."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingClubs.map((club: any) => (
                <AdminCard key={club.id}>
                  <AdminCardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border border-black/5 shrink-0 bg-white">
                          {club.logo_url ? (
                            <AvatarImage src={club.logo_url} alt={club.club_name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-amber-50 text-amber-700 font-bold font-dmserif">
                            {initials(club.club_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-base text-[#0f0f10] font-dmserif leading-tight">{club.club_name}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5 mt-1.5 inline-block">
                            {club.category || "General"}
                          </span>
                        </div>
                      </div>
                      <AdminBadge status="pending" />
                    </div>

                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">
                      {club.description || "No description provided."}
                    </p>

                    <div className="text-[11px] text-neutral-400 space-y-1 border-t border-black/5 pt-3">
                      <div>Applicant: <span className="font-semibold text-[#0f0f10]">{club.president_name}</span></div>
                      <div>Email: <span className="font-semibold text-[#0f0f10]">{club.club_email}</span></div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-300" />
                        Submitted: {new Date(club.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-black/5 pt-3">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedClubRequest(club);
                          setDetailsModalOpen(true);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Details
                      </AdminButton>

                      <AdminButton
                        variant="success"
                        size="sm"
                        onClick={() => handleApproveClub(club.id)}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </AdminButton>

                      <AdminButton
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setRejectingRequest(club);
                          setRejectModalOpen(true);
                        }}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </AdminButton>
                    </div>
                  </AdminCardContent>
                </AdminCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active" className="pt-4 space-y-4">
          {activeClubs.length === 0 ? (
            <AdminEmptyState
              icon={<Users className="w-8 h-8 text-neutral-400" />}
              title="No Active Clubs Found"
              description="No active approved club accounts match your active filters."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeClubs.map((club: any) => (
                <AdminCard key={club.user_id}>
                  <AdminCardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border border-black/5 shrink-0 bg-white">
                          {club.profile_image_url ? (
                            <AvatarImage src={club.profile_image_url} alt={club.name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-sky-50 text-sky-700 font-bold font-dmserif">
                            {initials(club.name || "C")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#0f0f10] truncate font-dmserif">{club.name}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-100 rounded-full px-2 py-0.5 mt-1 inline-block">
                            {club.club_metadata?.category || "General"}
                          </span>
                        </div>
                      </div>
                      <AdminBadge status="approved">Active</AdminBadge>
                    </div>

                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                      {club.bio || club.club_metadata?.description || "Active student organization on Intrst."}
                    </p>

                    <div className="text-[11px] text-neutral-400 space-y-1 border-t border-black/5 pt-3">
                      <div>President/Admin: <span className="font-semibold text-[#0f0f10]">{club.club_metadata?.president_name || `@${club.username}`}</span></div>
                      <div>Members/Followers: <span className="font-semibold text-[#0f0f10]">{club.follower_count} members</span></div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-300" />
                        Joined: {new Date(club.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-black/5 pt-3">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/profile/${club.user_id}`)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View
                      </AdminButton>

                      <AdminButton
                        variant="accent"
                        size="sm"
                        onClick={() => {
                          setSuspendingClub(club);
                          setSuspendModalOpen(true);
                        }}
                        leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                      >
                        Suspend
                      </AdminButton>

                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClubRequest(club);
                          setDetailsModalOpen(true);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Details
                      </AdminButton>

                      {club.is_suspended ? (
                        <AdminButton
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setUnsuspendingClub(club);
                            setUnsuspendModalOpen(true);
                          }}
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                        >
                          Unsuspend
                        </AdminButton>
                      ) : (
                        <AdminButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSuspendingClub(club);
                            setSuspendModalOpen(true);
                          }}
                          leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                        >
                          Suspend
                        </AdminButton>
                      )}

                      <AdminButton
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeletingClub(club);
                          setDeleteModalOpen(true);
                        }}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Delete
                      </AdminButton>
                    </div>
                  </AdminCardContent>
                </AdminCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="pt-4 space-y-3">
          {rejectedClubs.length === 0 ? (
            <AdminEmptyState
              icon={<X className="w-8 h-8 text-neutral-400" />}
              title="No Rejected Applications"
              description="There are no rejected club requests found."
            />
          ) : (
            <div className="space-y-3">
              {rejectedClubs.map((req: any) => (
                <AdminCard key={req.id}>
                  <AdminCardContent className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-bold text-base text-[#0f0f10] font-dmserif">{req.club_name}</h4>
                        <AdminBadge status="rejected" />
                      </div>
                      <p className="text-xs text-neutral-500">Applicant: {req.president_name} ({req.club_email})</p>
                      <p className="text-xs text-neutral-500">Rejection Date: {new Date(req.updated_at || req.created_at).toLocaleDateString()}</p>
                      {req.rejection_reason && (
                        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100/60 p-2 rounded-xl italic mt-2">
                          Reason: "{req.rejection_reason}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClubRequest(req);
                          setDetailsModalOpen(true);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Details
                      </AdminButton>
                      <AdminButton
                        variant="success"
                        size="sm"
                        onClick={() => handleApproveClub(req.id)}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Reconsider
                      </AdminButton>
                    </div>
                  </AdminCardContent>
                </AdminCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              {selectedClubRequest?.club_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Club Application Details
            </DialogDescription>
          </DialogHeader>

          {selectedClubRequest && (
            <div className="space-y-3 text-xs py-2">
              <div><span className="font-bold text-neutral-600 font-dmserif">Category:</span> {selectedClubRequest.category || "N/A"}</div>
              <div><span className="font-bold text-neutral-600 font-dmserif">President:</span> {selectedClubRequest.president_name} ({selectedClubRequest.club_email})</div>
              <div><span className="font-bold text-neutral-600 font-dmserif">Justification:</span></div>
              <p className="bg-neutral-50 p-3 rounded-xl border border-black/5 text-neutral-700 italic">
                "{selectedClubRequest.justification || "No justification provided."}"
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <AdminButton variant="secondary" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Close
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              Reject Club Request
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Provide reason for rejecting {rejectingRequest?.club_name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Input
              type="text"
              placeholder="Reason for rejection (sent to applicant)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-xl border-black/10 text-xs"
            />
          </div>

          <DialogFooter>
            <AdminButton variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="destructive" size="sm" isLoading={submittingReject} onClick={handleRejectClubSubmit}>
              Reject Application
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              Suspend Club Account
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Provide reason for suspending {suspendingClub?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Input
              type="text"
              placeholder="Reason for suspension..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              className="rounded-xl border-black/10 text-xs"
            />
          </div>

          <DialogFooter>
            <AdminButton variant="secondary" size="sm" onClick={() => setSuspendModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="destructive" size="sm" isLoading={submittingSuspend} onClick={handleSuspendSubmit}>
              Confirm Suspension
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Modal */}
      <Dialog open={unsuspendModalOpen} onOpenChange={setUnsuspendModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              Unsuspend Club Account
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Are you sure you want to unsuspend {unsuspendingClub?.name}? They will regain full platform privileges immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <AdminButton variant="secondary" size="sm" onClick={() => setUnsuspendModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="success" size="sm" isLoading={submittingUnsuspend} onClick={handleUnsuspendSubmit}>
              Confirm Action
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Club Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="space-y-1">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              Delete Club Account
            </DialogTitle>
            <DialogDescription className="text-xs text-rose-600 font-medium leading-relaxed">
              Are you sure you want to permanently delete {deletingClub?.name}? This action deletes the auth user and profile, removing all associated data permanently. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <AdminButton variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="destructive" size="sm" isLoading={submittingDelete} onClick={handleDeleteClubSubmit}>
              Delete Permanently
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
