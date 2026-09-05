"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Trash2,
  AlertTriangle,
  Clock,
  Check,
  User,
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  Eye,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
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

export default function AdminClassroomsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("active");

  // Modals
  const [reporterModalOpen, setReporterModalOpen] = useState(false);
  const [selectedReporter, setSelectedReporter] = useState<any>(null);

  const fetchReports = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiFetch("/admin/classroom-reports");
      setReports(res || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load classroom reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Expiry Timer countdown ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 10000); // refresh every 10 seconds
    return () => clearInterval(timer);
  }, []);

  const getMinutesRemaining = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60));
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await apiFetch(`/admin/classroom-reports/${id}`, { method: "DELETE" });
      toast.success("Classroom report deleted.");
      fetchReports(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete report.");
    }
  };

  const handleMarkFalseReport = async (id: string) => {
    try {
      await apiFetch(`/admin/classroom-reports/${id}/false`, { method: "POST" });
      toast.success("Report marked false. points deducted from reporter.");
      fetchReports(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to mark false report.");
    }
  };

  const handleKeepActive = async (id: string) => {
    try {
      await apiFetch(`/admin/classroom-reports/${id}/keep-active`, { method: "POST" });
      toast.success("Report expiry extended by 1 hour!");
      fetchReports(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to extend report activity.");
    }
  };

  const handleViewReporter = (reporter: any) => {
    if (!reporter) {
      toast.error("Reporter profile details unavailable.");
      return;
    }
    setSelectedReporter(reporter);
    setReporterModalOpen(true);
  };

  // Extract unique building names
  const getBuildings = () => {
    const buildings = new Set<string>();
    reports.forEach(r => {
      if (r.classroom?.building_name) {
        buildings.add(r.classroom.building_name);
      }
    });
    return Array.from(buildings);
  };

  const filterList = (list: any[], tab: "active" | "expired" | "flagged") => {
    return list.filter((rpt: any) => {
      const minutesLeft = getMinutesRemaining(rpt.expires_at);
      const isExpired = minutesLeft <= 0;
      const isFlagged = rpt.deny_count >= 2 || (rpt.confirmed_count > 0 && rpt.deny_count > 0);

      // 1. Tab filter
      if (tab === "active" && (isExpired || isFlagged)) return false;
      if (tab === "expired" && !isExpired) return false;
      if (tab === "flagged" && (!isFlagged || isExpired)) return false;

      // 2. Search query
      const building = rpt.classroom?.building_name || "";
      const room = rpt.classroom?.room_number || "";
      const reporterName = rpt.reporter?.name || "";
      const reporterUser = rpt.reporter?.username || "";

      const matchesSearch = searchQuery === "" ||
        building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reporterUser.toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Building filter
      const matchesBuilding = buildingFilter === "all" || building === buildingFilter;

      // 4. Status filter
      const matchesStatus = statusFilter === "all" || rpt.status === statusFilter;

      return matchesSearch && matchesBuilding && matchesStatus;
    });
  };

  if (loading) {
    return <AdminPageLoader text="Loading classroom reports..." />;
  }

  const buildings = getBuildings();
  const activeReports = filterList(reports, "active");
  const expiredReports = filterList(reports, "expired");
  const flaggedReports = filterList(reports, "flagged");

  const activeCount = reports.filter(r => getMinutesRemaining(r.expires_at) > 0 && r.deny_count < 2).length;
  const vacantCount = reports.filter(r => getMinutesRemaining(r.expires_at) > 0 && r.status === "empty").length;
  const occupiedCount = reports.filter(r => getMinutesRemaining(r.expires_at) > 0 && r.status === "occupied").length;
  const expiredCount = reports.filter(r => getMinutesRemaining(r.expires_at) <= 0).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Classrooms Moderator"
        description="Monitor active peer-to-peer classroom occupancy updates and moderate false reports."
        action={
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => fetchReports(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Reports
          </AdminButton>
        }
      />

      {/* Top summary grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10]">
              {activeCount}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Active Reports</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-emerald-700">
              {vacantCount}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Vacant Rooms</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-red-700">
              {occupiedCount}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Occupied Reports</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-neutral-500">
              {expiredCount}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Expired Reports</div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Filters bar */}
      <AdminCard>
        <AdminCardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by room, building, or reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-black/5 text-xs bg-white/60 h-10 w-full outline-none focus:bg-white transition-all shadow-[0_1px_8px_rgba(0,0,0,0.01)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {buildings.length > 0 && (
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="text-xs bg-white/60 border border-black/5 rounded-full h-10 px-4 text-neutral-500 outline-none font-medium focus:bg-white hover:border-black/10 transition-all cursor-pointer"
              >
                <option value="all">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white/60 border border-black/5 rounded-full h-10 px-4 text-neutral-500 outline-none font-medium focus:bg-white hover:border-black/10 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="empty">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Tabs */}
      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#f0ede6] border border-black/5 p-1 rounded-xl w-full sm:w-auto flex overflow-x-auto gap-1">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-500 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Active Reports ({activeReports.length})
          </TabsTrigger>
          <TabsTrigger
            value="expired"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Expired Reports ({expiredReports.length})
          </TabsTrigger>
          <TabsTrigger
            value="flagged"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Flagged / Needs Review ({flaggedReports.length})
          </TabsTrigger>
        </TabsList>

        {["active", "expired", "flagged"].map((tabName) => {
          const list = 
            tabName === "active" ? activeReports : 
            tabName === "expired" ? expiredReports : flaggedReports;

          return (
            <TabsContent key={tabName} value={tabName} className="pt-4">
              {list.length === 0 ? (
                <AdminEmptyState
                  icon={<Building2 className="w-8 h-8 text-neutral-400" />}
                  title={`No ${tabName} reports`}
                  description="Everything is up to date."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {list.map((rpt: any) => {
                    const minutesLeft = getMinutesRemaining(rpt.expires_at);
                    const isExpired = minutesLeft <= 0;
                    const building = rpt.classroom?.building_name || "Unknown Building";
                    const room = rpt.classroom?.room_number || "—";
                    const reporterName = rpt.reporter?.name || "Student";

                    return (
                      <AdminCard key={rpt.id} className={`flex flex-col justify-between h-full ${isExpired ? "opacity-60 border-dashed" : ""}`}>
                        <div>
                          <div className="p-6 pb-4 border-b border-black/5 flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-bold text-lg text-[#0f0f10] leading-snug">{building}</h4>
                              <span className="text-xl font-dmserif font-bold text-[#855300] mt-1 inline-block">Room {room}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              {rpt.status === "empty" ? (
                                <AdminBadge status="active">VACANT</AdminBadge>
                              ) : (
                                <AdminBadge status="rejected">OCCUPIED</AdminBadge>
                              )}
                              {isExpired ? (
                                <span className="text-[10px] text-red-500 font-bold uppercase">Expired</span>
                              ) : (
                                <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-neutral-400" />
                                  {minutesLeft}m left
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-6 py-4 space-y-4">
                            <div className="space-y-2.5 text-xs text-neutral-500 border-b border-black/5 pb-4">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-neutral-400">Reporter:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-neutral-700 hover:underline cursor-pointer" onClick={() => handleViewReporter(rpt.reporter)}>
                                    {reporterName}
                                  </span>
                                  {rpt.reporter?.is_verified && (
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="font-medium text-neutral-400">Anonymous:</span>
                                {rpt.is_anonymous ? (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] font-bold shadow-none rounded-full px-2">ANONYMOUS</Badge>
                                ) : (
                                  <span className="font-semibold text-neutral-400 text-[10px]">PUBLIC</span>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="font-medium text-neutral-400">Reported At:</span>
                                <span className="font-semibold text-neutral-700">
                                  {new Date(rpt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(rpt.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                              <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl p-2.5 flex flex-col justify-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">✓ Confirms</span>
                                <span className="text-sm font-bold text-emerald-800">{rpt.confirmed_count || 0}</span>
                              </div>
                              <div className="bg-red-50 border border-red-100/50 rounded-xl p-2.5 flex flex-col justify-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-0.5">✕ Denials</span>
                                <span className="text-sm font-bold text-red-800">{rpt.deny_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 pt-4 flex gap-2 border-t border-black/5 bg-neutral-50/50">
                          <AdminButton
                            onClick={() => handleKeepActive(rpt.id)}
                            disabled={isExpired}
                            size="sm"
                            className="flex-1"
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Keep Active
                          </AdminButton>

                          <AdminButton
                            onClick={() => handleMarkFalseReport(rpt.id)}
                            size="sm"
                            variant="secondary"
                            className="border border-amber-200 text-amber-700 hover:bg-amber-50"
                            leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                          >
                            Mark False
                          </AdminButton>

                          <AdminButton
                            onClick={() => handleDeleteReport(rpt.id)}
                            size="sm"
                            variant="destructive"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            Delete
                          </AdminButton>
                        </div>
                      </AdminCard>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* MODAL: View Reporter Details */}
      <Dialog open={reporterModalOpen} onOpenChange={setReporterModalOpen}>
        <DialogContent className="bg-white border border-black/5 text-[#0f0f10] max-w-sm sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-dmserif text-2xl">Reporter Profile Details</DialogTitle>
            <DialogDescription>Full student identity details (admin visibility only).</DialogDescription>
          </DialogHeader>
          {selectedReporter && (
            <div className="py-4 space-y-4 text-left">
              <div className="flex items-center gap-3 p-4 bg-[#faf9f6] border border-black/5 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight flex items-center gap-1.5">
                    {selectedReporter.name}
                    {selectedReporter.is_verified && (
                      <ShieldCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                    )}
                  </h3>
                  <span className="text-xs text-neutral-500">@{selectedReporter.username}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">User Role</span>
                  <span className="text-[#0f0f10] capitalize">{selectedReporter.role || "Student"}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Activity Points</span>
                  <span className="text-[#855300] font-bold">{selectedReporter.points || 0} pts</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <AdminButton
              onClick={() => { setReporterModalOpen(false); setSelectedReporter(null); }}
              className="w-full"
            >
              Close Profile
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
