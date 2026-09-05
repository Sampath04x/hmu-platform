"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Clock,
  Check,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  User,
  ShieldCheck,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("open");

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const fetchReports = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiFetch("/admin/reports");
      setReports(res || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["open", "under_review", "resolved", "dismissed"].includes(tab)) {
        setActiveTab(tab);
      }
      const q = params.get("search");
      if (q) setSearchQuery(q);
    }
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/admin/reports/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      toast.success(`Report marked as ${status.replace("_", " ")}`);
      fetchReports(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update report status");
    }
  };

  const handleResolveAndRemove = async (id: string, contentId: string, contentType: string) => {
    try {
      await apiFetch(`/admin/remove-content/${contentId}`, {
        method: "DELETE",
        body: JSON.stringify({ contentType })
      });
      await apiFetch(`/admin/reports/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "resolved" })
      });
      toast.success("Content removed and report resolved successfully!");
      fetchReports(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve and remove content");
    }
  };

  // Extract unique content types
  const getContentTypes = () => {
    const types = new Set<string>();
    reports.forEach(r => {
      if (r.content_type) {
        types.add(r.content_type);
      }
    });
    return Array.from(types);
  };

  const filterList = (list: any[], tab: "open" | "under_review" | "resolved" | "dismissed") => {
    return list.filter((rpt: any) => {
      // 1. Tab filter
      const status = rpt.status || "open";
      if (tab !== status) return false;

      // 2. Search query
      const reason = rpt.reason || "";
      const contentId = rpt.content_id || "";
      const reporterId = rpt.reporter_id || "";

      const matchesSearch = searchQuery === "" ||
        reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reporterId.toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Type filter
      const matchesType = typeFilter === "all" || rpt.content_type === typeFilter;

      return matchesSearch && matchesType;
    });
  };

  if (loading) {
    return <AdminPageLoader text="Loading content reports..." />;
  }

  const contentTypes = getContentTypes();
  const openReports = filterList(reports, "open");
  const underReviewReports = filterList(reports, "under_review");
  const resolvedReports = filterList(reports, "resolved");
  const dismissedReports = filterList(reports, "dismissed");

  const openCount = reports.filter(r => (r.status || "open") === "open").length;
  const underReviewCount = reports.filter(r => r.status === "under_review").length;
  const resolvedCount = reports.filter(r => r.status === "resolved").length;
  const dismissedCount = reports.filter(r => r.status === "dismissed").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports Moderator"
        description="Review and manage reported content, flags, and community guidelines violations."
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
              {openCount}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Open Reports</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-amber-700">
              {underReviewCount}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Under Review</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-emerald-700">
              {resolvedCount}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Resolved Reports</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-neutral-500">
              {dismissedCount}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Dismissed Reports</div>
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
              placeholder="Search by content ID, reason, or reporter ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-black/5 text-xs bg-white/60 h-10 w-full outline-none focus:bg-white transition-all shadow-[0_1px_8px_rgba(0,0,0,0.01)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {contentTypes.length > 0 && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-white/60 border border-black/5 rounded-full h-10 px-4 text-neutral-500 outline-none font-medium focus:bg-white hover:border-black/10 transition-all cursor-pointer"
              >
                <option value="all">All Content Types</option>
                {contentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Tabs */}
      <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#f0ede6] border border-black/5 p-1 rounded-xl w-full sm:w-auto flex overflow-x-auto gap-1">
          <TabsTrigger
            value="open"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-500 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Open ({openReports.length})
          </TabsTrigger>
          <TabsTrigger
            value="under_review"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Under Review ({underReviewReports.length})
          </TabsTrigger>
          <TabsTrigger
            value="resolved"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Resolved ({resolvedReports.length})
          </TabsTrigger>
          <TabsTrigger
            value="dismissed"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Dismissed ({dismissedReports.length})
          </TabsTrigger>
        </TabsList>

        {["open", "under_review", "resolved", "dismissed"].map((tabName) => {
          const list = 
            tabName === "open" ? openReports : 
            tabName === "under_review" ? underReviewReports : 
            tabName === "resolved" ? resolvedReports : dismissedReports;

          return (
            <TabsContent key={tabName} value={tabName} className="pt-4">
              {list.length === 0 ? (
                <AdminEmptyState
                  icon={<AlertCircle className="w-8 h-8 text-neutral-400" />}
                  title={`No ${tabName.replace("_", " ")} reports`}
                  description="Everything is up to date."
                />
              ) : (
                <div className="space-y-3">
                  {list.map((rpt: any) => (
                    <AdminCard key={rpt.id}>
                      <AdminCardContent className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-semibold capitalize border-amber-200 text-amber-700 bg-amber-50 rounded-lg">
                              {rpt.content_type || "Content"}
                            </Badge>
                            <span className="text-xs text-neutral-400">ID: {rpt.content_id}</span>
                          </div>
                          <p className="text-sm font-semibold text-[#0f0f10] mt-2 font-dmserif">Reason: {rpt.reason || "No reason given."}</p>
                          <div className="flex items-center gap-4 text-xs text-neutral-500 mt-1">
                            <span>Reported by: {rpt.reporter_id || "Anonymous"}</span>
                            <span>•</span>
                            <span>{new Date(rpt.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                          <AdminButton
                            onClick={() => {
                              setSelectedReport(rpt);
                              setDetailsModalOpen(true);
                            }}
                            size="sm"
                            variant="secondary"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Details
                          </AdminButton>

                          {tabName === "open" && (
                            <AdminButton
                              onClick={() => handleUpdateStatus(rpt.id, "under_review")}
                              size="sm"
                              variant="secondary"
                              className="border border-amber-200 text-amber-700 bg-amber-50/20"
                              leftIcon={<Clock className="w-3.5 h-3.5" />}
                            >
                              Investigate
                            </AdminButton>
                          )}

                          {(tabName === "open" || tabName === "under_review") && (
                            <>
                              <AdminButton
                                onClick={() => handleUpdateStatus(rpt.id, "resolved")}
                                size="sm"
                                variant="success"
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                              >
                                Resolve (Keep)
                              </AdminButton>

                              <AdminButton
                                onClick={() => handleResolveAndRemove(rpt.id, rpt.content_id, rpt.content_type || "post")}
                                size="sm"
                                variant="destructive"
                                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                              >
                                Resolve & Remove
                              </AdminButton>

                              <AdminButton
                                onClick={() => handleUpdateStatus(rpt.id, "dismissed")}
                                size="sm"
                                variant="secondary"
                                leftIcon={<X className="w-3.5 h-3.5" />}
                              >
                                Dismiss
                              </AdminButton>
                            </>
                          )}
                        </div>
                      </AdminCardContent>
                    </AdminCard>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              Report Details
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Guideline violation report log
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 text-xs py-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 border border-black/5 rounded-xl">
                <div>
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase">Content Type</span>
                  <span className="font-semibold text-neutral-700 capitalize">{selectedReport.content_type || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase">Content ID</span>
                  <span className="font-semibold text-neutral-700 font-mono">{selectedReport.content_id || "N/A"}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Reason for Report</span>
                <p className="bg-neutral-50 p-3 rounded-xl border border-black/5 text-neutral-700 italic">
                  "{selectedReport.reason || "No explanation provided."}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase">Reporter ID</span>
                  <span className="font-semibold text-neutral-700 font-mono">{selectedReport.reporter_id || "Anonymous"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase">Reported Date</span>
                  <span className="font-semibold text-neutral-700">{new Date(selectedReport.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <AdminButton variant="secondary" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Close
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
