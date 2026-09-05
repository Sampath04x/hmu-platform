"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Check,
  X,
  Trash2,
  Search,
  Clock,
  MapPin,
  Edit2,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    started_at: "",
    ended_at: "",
    poster_url: ""
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchEvents = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiFetch("/events?all=true");
      setEvents(res || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load events data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "past") {
        setActiveTab("completed");
      } else if (tab && ["all", "pending", "approved", "upcoming", "completed", "rejected"].includes(tab)) {
        setActiveTab(tab);
      }
      const q = params.get("search");
      if (q) setSearchQuery(q);
    }
  }, []);

  const handleApproveEvent = async (id: string) => {
    try {
      await apiFetch(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_approved: true, status: "approved" })
      });
      toast.success("Event approved and published!");
      fetchEvents(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve event.");
    }
  };

  const handleRejectEvent = async (id: string) => {
    try {
      await apiFetch(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_approved: false, status: "rejected" })
      });
      toast.success("Event application rejected.");
      fetchEvents(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject event.");
    }
  };

  const handleEditOpen = (event: any) => {
    setSelectedEvent(event);
    setEditForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      started_at: event.started_at ? new Date(event.started_at).toISOString().slice(0, 16) : "",
      ended_at: event.ended_at ? new Date(event.ended_at).toISOString().slice(0, 16) : "",
      poster_url: event.poster_url || ""
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedEvent) return;
    setSubmittingEdit(true);
    try {
      await apiFetch(`/events/${selectedEvent.event_id}`, {
        method: "PUT",
        body: JSON.stringify(editForm)
      });
      toast.success("Event updated successfully!");
      setEditModalOpen(false);
      setSelectedEvent(null);
      fetchEvents(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update event");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingEvent) return;
    setSubmittingDelete(true);
    try {
      await apiFetch(`/events/${deletingEvent.event_id}`, { method: "DELETE" });
      toast.success("Event cancelled and deleted");
      setDeleteModalOpen(false);
      setDeletingEvent(null);
      fetchEvents(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete event");
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Extract unique organizers
  const getOrganizers = () => {
    const orgs = new Map<string, string>();
    events.forEach(e => {
      if (e.club_id && e.club_name) {
        orgs.set(e.club_id, e.club_name);
      }
    });
    return Array.from(orgs.entries());
  };

  const filterList = (list: any[], type: "all" | "pending" | "approved" | "upcoming" | "completed" | "rejected") => {
    const now = new Date();
    return list.filter((evt: any) => {
      const isApproved = evt.is_approved === true || evt.status === "approved";
      const isRejected = evt.status === "rejected";
      const isPast = isApproved && evt.started_at && new Date(evt.started_at) < now;
      const isUpcomingApproved = isApproved && evt.started_at && new Date(evt.started_at) >= now;
      const isPending = !isApproved && !isRejected;

      // Filter by tab type
      if (type === "pending" && !isPending) return false;
      if (type === "approved" && !isApproved) return false;
      if (type === "upcoming" && !isUpcomingApproved) return false;
      if (type === "completed" && !isPast) return false;
      if (type === "rejected" && !isRejected) return false;

      // Search query
      const matchesSearch = searchQuery === "" ||
        evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.club_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.location?.toLowerCase().includes(searchQuery.toLowerCase());

      // Organizer filter
      const matchesOrganizer = organizerFilter === "all" || evt.club_id === organizerFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all" && evt.started_at) {
        const evtDate = new Date(evt.started_at);
        const diffTime = Math.abs(now.getTime() - evtDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (dateFilter === "today") matchesDate = diffDays <= 1;
        if (dateFilter === "week") matchesDate = diffDays <= 7;
        if (dateFilter === "month") matchesDate = diffDays <= 30;
      }

      return matchesSearch && matchesOrganizer && matchesDate;
    });
  };

  if (loading) {
    return <AdminPageLoader text="Loading campus events..." />;
  }

  const organizers = getOrganizers();

  const getFilteredCountForStatus = (type: "all" | "pending" | "approved" | "upcoming" | "completed" | "rejected") => {
    return filterList(events, type).length;
  };

  const currentList = filterList(events, activeTab as any);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Events Management"
        description="Review and manage campus events submitted to intrst."
        action={
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => fetchEvents(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Events
          </AdminButton>
        }
      />

      {/* Filters bar */}
      <AdminCard>
        <AdminCardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by event title, organizer, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-black/5 text-xs bg-white/60 h-10 w-full outline-none focus:bg-white transition-all shadow-[0_1px_8px_rgba(0,0,0,0.01)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {organizers.length > 0 && (
              <select
                value={organizerFilter}
                onChange={(e) => setOrganizerFilter(e.target.value)}
                className="text-xs bg-white/60 border border-black/5 rounded-full h-10 px-4 text-neutral-500 outline-none font-medium focus:bg-white hover:border-black/10 transition-all cursor-pointer"
              >
                <option value="all">All Organizers</option>
                {organizers.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs bg-white/60 border border-black/5 rounded-full h-10 px-4 text-neutral-500 outline-none font-medium focus:bg-white hover:border-black/10 transition-all cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Tabs list triggers row */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-[#f0ede6] border border-black/5 p-1 rounded-xl w-full sm:w-auto flex overflow-x-auto gap-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-500 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            All ({getFilteredCountForStatus("all")})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-500 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Pending Review ({getFilteredCountForStatus("pending")})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Approved ({getFilteredCountForStatus("approved")})
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Upcoming ({getFilteredCountForStatus("upcoming")})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Completed ({getFilteredCountForStatus("completed")})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Rejected ({getFilteredCountForStatus("rejected")})
          </TabsTrigger>
        </TabsList>

        <div className="w-full">
          {currentList.length === 0 ? (
            <AdminEmptyState
              insideCard={false}
              icon={<Calendar className="w-8 h-8 text-neutral-400" />}
              title="No events found"
              description="There are no events matching your current filters."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentList.map((evt: any) => {
                const isApproved = evt.is_approved === true || evt.status === "approved";
                const isRejected = evt.status === "rejected";
                const isPast = isApproved && evt.started_at && new Date(evt.started_at) < new Date();
                const isUpcomingApproved = isApproved && !isPast;
                const isPending = !isApproved && !isRejected;

                return (
                  <AdminCard key={evt.event_id} className="flex flex-col justify-between h-full animate-fadeIn">
                    <div>
                      {/* Event Poster / Image */}
                      <div className="h-44 bg-gradient-to-br from-[#505f78]/10 to-[#855300]/5 border-b border-black/5 relative overflow-hidden flex items-center justify-center">
                        {evt.poster_url ? (
                          <img
                            src={evt.poster_url}
                            alt={evt.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-neutral-300 flex flex-col items-center gap-1.5">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">No Poster</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <AdminBadge
                            status={
                              isPending ? "pending" :
                              isUpcomingApproved ? "approved" :
                              isRejected ? "rejected" : "under_review"
                            }
                          >
                            {isPending ? "Pending" :
                             isUpcomingApproved ? "Approved" :
                             isRejected ? "Rejected" : "Completed"}
                          </AdminBadge>
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <h4 className="font-bold text-base text-[#0f0f10] font-dmserif leading-snug">{evt.title}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 border border-black/5 rounded-full px-2.5 py-0.5 mt-2 inline-block">
                            {evt.club_name}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                          {evt.description || "No description provided."}
                        </p>

                        {isRejected && evt.rejection_reason && (
                          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100/60 p-2.5 rounded-xl italic mt-1.5">
                            Reason: "{evt.rejection_reason}"
                          </p>
                        )}

                        <div className="text-[11px] text-neutral-400 space-y-1.5 border-t border-black/5 pt-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                            <span>{evt.location || "Main Campus"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                            <span>{new Date(evt.started_at).toLocaleString()}</span>
                          </div>
                          {evt.created_at && (
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                              <span>Submitted: {new Date(evt.created_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex gap-2 border-t border-black/5 pt-4 bg-white/40">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedEvent(evt);
                          setDetailsModalOpen(true);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Details
                      </AdminButton>

                      {isPending && (
                        <>
                          <AdminButton
                            variant="success"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleApproveEvent(evt.event_id)}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </AdminButton>
                          <AdminButton
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRejectEvent(evt.event_id)}
                            leftIcon={<X className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </AdminButton>
                        </>
                      )}

                      {isApproved && !isPast && (
                        <>
                          <AdminButton
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditOpen(evt)}
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </AdminButton>
                          <AdminButton
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setDeletingEvent(evt);
                              setDeleteModalOpen(true);
                            }}
                            leftIcon={<X className="w-3.5 h-3.5" />}
                          >
                            Cancel
                          </AdminButton>
                        </>
                      )}

                      {(isRejected || isPast) && (
                        <AdminButton
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setDeletingEvent(evt);
                            setDeleteModalOpen(true);
                          }}
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Delete Record
                        </AdminButton>
                      )}
                    </div>
                  </AdminCard>
                );
              })}
            </div>
          )}
        </div>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Submitted Event Details
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-3 text-xs py-2">
              <div><span className="font-bold text-neutral-600 font-dmserif">Organizer:</span> {selectedEvent.club_name}</div>
              <div><span className="font-bold text-neutral-600 font-dmserif">Venue:</span> {selectedEvent.location || "Main Campus"}</div>
              <div><span className="font-bold text-neutral-600 font-dmserif">Start Time:</span> {new Date(selectedEvent.started_at).toLocaleString()}</div>
              {selectedEvent.ended_at && (
                <div><span className="font-bold text-neutral-600 font-dmserif">End Time:</span> {new Date(selectedEvent.ended_at).toLocaleString()}</div>
              )}
              <div><span className="font-bold text-neutral-600 font-dmserif">Description:</span></div>
              <p className="bg-neutral-50 p-3 rounded-xl border border-black/5 text-neutral-700 italic">
                "{selectedEvent.description || "No description provided."}"
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

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              Edit Event
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 font-medium">
              Modify the details of {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#0f0f10]">Title</label>
              <Input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="rounded-xl border-black/10 text-xs bg-white/60"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#0f0f10]">Location</label>
              <Input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="rounded-xl border-black/10 text-xs bg-white/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#0f0f10]">Start Time</label>
                <Input
                  type="datetime-local"
                  value={editForm.started_at}
                  onChange={(e) => setEditForm({ ...editForm, started_at: e.target.value })}
                  className="rounded-xl border-black/10 text-xs bg-white/60"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#0f0f10]">End Time</label>
                <Input
                  type="datetime-local"
                  value={editForm.ended_at}
                  onChange={(e) => setEditForm({ ...editForm, ended_at: e.target.value })}
                  className="rounded-xl border-black/10 text-xs bg-white/60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#0f0f10]">Poster URL</label>
              <Input
                type="text"
                value={editForm.poster_url}
                onChange={(e) => setEditForm({ ...editForm, poster_url: e.target.value })}
                className="rounded-xl border-black/10 text-xs bg-white/60"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#0f0f10]">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-black/10 text-xs bg-white/60 p-2.5 outline-none focus:border-black/30"
              />
            </div>
          </div>

          <DialogFooter>
            <AdminButton variant="secondary" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="primary" size="sm" isLoading={submittingEdit} onClick={handleEditSubmit}>
              Save Changes
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / Cancel Event Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-black/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="space-y-1">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-[#0f0f10] font-dmserif">
              Cancel & Remove Event
            </DialogTitle>
            <DialogDescription className="text-xs text-rose-600 font-medium leading-relaxed">
              Are you sure you want to permanently delete {deletingEvent?.title}? This deletes the event record and removes it from the platform. This action is irreversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <AdminButton variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="destructive" size="sm" isLoading={submittingDelete} onClick={handleDeleteSubmit}>
              Confirm Deletion
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
