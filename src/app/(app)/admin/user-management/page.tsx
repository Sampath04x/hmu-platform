"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock,
  Trash2,
  UserCheck,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  Shield,
  RefreshCw,
  Mail,
  GraduationCap,
  Building2,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard, AdminCardContent } from "@/components/admin/AdminCard";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageLoader } from "@/components/admin/AdminSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Constant arrays matching backend profile options
const DEPARTMENTS = [
  "CSE", "ECE", "Mechanical", "Civil", "EEE", "IT",
  "Chemical", "Biotech", "MBA", "Law", "Pharmacy", "Architecture"
];

const ROLES = [
  { value: "user", label: "Student" },
  { value: "club", label: "Club Account" },
  { value: "junior_moderator", label: "Junior Moderator" },
  { value: "moderator", label: "Moderator" },
  { value: "super_admin", label: "Super Admin" },
  { value: "founder", label: "Founder" }
];

const YEARS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
  { value: "6", label: "Ph.D." }
];

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, suspended
  const [verifyFilter, setVerifyFilter] = useState("all"); // all, verified, unverified
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      setVerifyFilter("all");
      setStatusFilter("all");
    } else if (value === "verified") {
      setVerifyFilter("verified");
      setStatusFilter("active");
    } else if (value === "unverified") {
      setVerifyFilter("unverified");
      setStatusFilter("active");
    } else if (value === "suspended") {
      setVerifyFilter("all");
      setStatusFilter("suspended");
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Modal States
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState<any>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [submittingSuspend, setSubmittingSuspend] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleEditingUser, setRoleEditingUser] = useState<any>(null);
  const [selectedNewRole, setSelectedNewRole] = useState("");
  const [submittingRole, setSubmittingRole] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const [viewProfileModalOpen, setViewProfileModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);

  // Fetch all users
  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiFetch("/admin/all-users");
      setUsers(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const verified = params.get("verified");
      const filter = params.get("filter");
      const tab = params.get("tab");
      if (verified === "true" || filter === "verified" || tab === "verified") {
        handleTabChange("verified");
      } else if (tab === "suspended") {
        handleTabChange("suspended");
      } else if (tab && ["all", "verified", "unverified", "suspended"].includes(tab)) {
        handleTabChange(tab);
      }
      const q = params.get("search");
      if (q) {
        setSearchQuery(q);
      }
    }
  }, []);


  // Action Handlers
  const handleVerifyToggle = async (user: any) => {
    const nextStatus = !user.is_verified;
    try {
      const result = await apiFetch(`/admin/verify-user/${user.user_id}`, {
        method: "POST",
        body: JSON.stringify({ is_verified: nextStatus })
      });
      toast.success(result.message || `User ${nextStatus ? "verified" : "unverified"} successfully`);

      // Update local state
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, is_verified: nextStatus } : u));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update verification status");
    }
  };

  const handleSuspendSubmit = async () => {
    if (!suspendingUser) return;
    setSubmittingSuspend(true);
    try {
      const result = await apiFetch(`/admin/suspend-user/${suspendingUser.user_id}`, {
        method: "POST",
        body: JSON.stringify({ reason: suspensionReason })
      });
      toast.success(result.message || "User suspended successfully");

      // Update local state
      setUsers(prev => prev.map(u => u.user_id === suspendingUser.user_id ? { ...u, is_suspended: true, suspension_reason: suspensionReason } : u));
      setSuspendModalOpen(false);
      setSuspensionReason("");
      setSuspendingUser(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to suspend user");
    } finally {
      setSubmittingSuspend(false);
    }
  };

  const handleActivateUser = async (user: any) => {
    try {
      const result = await apiFetch(`/admin/unsuspend-user/${user.user_id}`, {
        method: "POST"
      });
      toast.success(result.message || "User activated successfully");

      // Update local state
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, is_suspended: false, suspension_reason: null } : u));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to activate user");
    }
  };

  const handleRoleChangeSubmit = async () => {
    if (!roleEditingUser || !selectedNewRole) return;
    setSubmittingRole(true);
    try {
      const result = await apiFetch(`/admin/set-role/${roleEditingUser.user_id}`, {
        method: "POST",
        body: JSON.stringify({ role: selectedNewRole })
      });
      toast.success(result.message || "Role updated successfully");

      // Update local state
      setUsers(prev => prev.map(u => u.user_id === roleEditingUser.user_id ? { ...u, role: selectedNewRole } : u));
      setRoleModalOpen(false);
      setRoleEditingUser(null);
      setSelectedNewRole("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update role");
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setSubmittingDelete(true);
    try {
      const result = await apiFetch(`/admin/remove-user/${deletingUser.user_id}`, {
        method: "DELETE"
      });
      toast.success(result.message || "User permanently deleted");

      // Update local state
      setUsers(prev => prev.filter(u => u.user_id !== deletingUser.user_id));
      setDeleteModalOpen(false);
      setDeletingUser(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete user");
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Filter and search computation
  const filteredUsers = users.filter(user => {
    // Search Query
    const searchString = `${user.name || ""} ${user.username || ""} ${user.email || ""}`.toLowerCase();
    const matchesSearch = searchQuery === "" || searchString.includes(searchQuery.toLowerCase());

    // Role Filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    // Status Filter (is_suspended)
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "suspended" && user.is_suspended) ||
      (statusFilter === "active" && !user.is_suspended);

    // Verification Filter
    const matchesVerify = verifyFilter === "all" ||
      (verifyFilter === "verified" && user.is_verified) ||
      (verifyFilter === "unverified" && !user.is_verified);

    // Department Filter
    const matchesDept = deptFilter === "all" || user.department === deptFilter;

    // Year Filter
    const matchesYear = yearFilter === "all" ||
      (user.year_of_study !== null && user.year_of_study !== undefined && user.year_of_study.toString() === yearFilter);

    return matchesSearch && matchesRole && matchesStatus && matchesVerify && matchesDept && matchesYear;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, verifyFilter, deptFilter, yearFilter]);

  // Helper formatting functions
  const formatYear = (yearNum: number | null | undefined) => {
    if (yearNum === null || yearNum === undefined) return "N/A";
    if (yearNum === 6) return "Ph.D.";
    const suffixes = ["st", "nd", "rd", "th"];
    const suffix = yearNum >= 1 && yearNum <= 4 ? suffixes[yearNum - 1] : "th";
    return `${yearNum}${suffix} Year`;
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; class: string }> = {
      founder: { label: "Founder", class: "bg-purple-100 text-purple-700 border-purple-200" },
      super_admin: { label: "Super Admin", class: "bg-red-100 text-red-700 border-red-200" },
      moderator: { label: "Moderator", class: "bg-blue-100 text-blue-700 border-blue-200" },
      junior_moderator: { label: "Jr. Moderator", class: "bg-teal-100 text-teal-700 border-teal-200" },
      club: { label: "Club", class: "bg-amber-100 text-amber-700 border-amber-200" },
      user: { label: "Student", class: "bg-[#f3f1eb] text-neutral-700 border-black/5" }
    };

    const current = roleMap[role] || { label: role, class: "bg-neutral-100 text-neutral-700" };
    return (
      <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${current.class}`}>
        {current.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Manage accounts, verify profiles, adjust permission levels, or issue restrictions."
        action={
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => fetchUsers(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Users
          </AdminButton>
        }
      />

      {/* Summary statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10]">
              {users.length}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Total Accounts</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-emerald-700">
              {users.filter(u => u.is_verified).length}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Verified Students</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-amber-700">
              {users.filter(u => !u.is_verified).length}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Unverified Accounts</div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex flex-col justify-between space-y-2">
            <div className="text-2xl font-bold font-mono text-[#0f0f10] text-red-700">
              {users.filter(u => u.is_suspended).length}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Restricted / Suspended</div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Search & Filters Panel */}
      <Card className="bg-white/80 backdrop-blur-md border border-black/5 rounded-[2rem] shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search by name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#faf9f6] border border-black/5 rounded-xl h-11 pl-11 pr-4 text-sm text-[#0f0f10] placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-black/20 focus-visible:border-neutral-300"
              />
            </div>

            {/* Basic filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:w-auto">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3 text-xs text-[#0f0f10] outline-none font-semibold cursor-pointer"
              >
                <option value="all">All Roles</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3 text-xs text-[#0f0f10] outline-none font-semibold cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              {/* Verification Filter */}
              <select
                value={verifyFilter}
                onChange={(e) => setVerifyFilter(e.target.value)}
                className="bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3 text-xs text-[#0f0f10] outline-none font-semibold cursor-pointer"
              >
                <option value="all">All Verifications</option>
                <option value="verified">Verified Student</option>
                <option value="unverified">Unverified</option>
              </select>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3 text-xs text-[#0f0f10] outline-none font-semibold cursor-pointer"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Extra filter criteria (Year of Study) */}
          <div className="flex items-center gap-3 border-t border-black/5 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Year of Study:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              <Badge
                onClick={() => setYearFilter("all")}
                className={`cursor-pointer px-3.5 py-1 rounded-full text-xs transition-all font-bold ${yearFilter === "all" ? 'bg-black text-white' : 'bg-[#faf9f6] text-neutral-500 border border-black/5 hover:bg-neutral-100'}`}
              >
                All Years
              </Badge>
              {YEARS.map(y => (
                <Badge
                  key={y.value}
                  onClick={() => setYearFilter(y.value)}
                  className={`cursor-pointer px-3.5 py-1 rounded-full text-xs transition-all font-bold ${yearFilter === y.value ? 'bg-black text-white' : 'bg-[#faf9f6] text-neutral-500 border border-black/5 hover:bg-neutral-100'}`}
                >
                  {y.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-[#f0ede6] border border-black/5 p-1 rounded-xl w-full sm:w-auto flex overflow-x-auto gap-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-500 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            All Students
          </TabsTrigger>
          <TabsTrigger
            value="verified"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Verified
          </TabsTrigger>
          <TabsTrigger
            value="unverified"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Unverified
          </TabsTrigger>
          <TabsTrigger
            value="suspended"
            className="data-[state=active]:bg-white data-[state=active]:text-[#0f0f10] data-[state=active]:shadow-sm text-neutral-600 rounded-lg text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial"
          >
            Restricted / Suspended
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Users Table */}
      <Card className="bg-white border border-black/5 rounded-[2.5rem] overflow-hidden shadow-sm">
        <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-neutral-500 gap-4">
                <Loader2 className="w-10 h-10 text-black animate-spin" />
                <p className="font-semibold text-sm">Loading users list...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-20 text-center text-neutral-500 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#faf9f6] border border-black/5 flex items-center justify-center">
                  <UserMinus className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-dmserif font-bold text-[#0f0f10]">No Users Found</h3>
                <p className="text-neutral-500 max-w-sm text-sm">No profiles match the current filter selection or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf9f6] border-b border-black/5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      <th className="py-4 px-6">User / Profile</th>
                      <th className="py-4 px-6">Email / Username</th>
                      <th className="py-4 px-6">Department & Year</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6">Verification</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 text-sm">
                    {currentUsers.map((user) => {
                      const initials = (user.name || "U").substring(0, 2).toUpperCase();
                      return (
                        <tr key={user.user_id} className="hover:bg-neutral-50/50 transition-colors">
                          {/* Profile details */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border border-black/5">
                                {user.profile_image_url ? (
                                  <img src={user.profile_image_url} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <AvatarFallback className="bg-[#505f78]/10 text-[#505f78] font-bold">
                                    {initials}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <h4 className="font-semibold text-[#0f0f10] leading-tight">{user.name || "No Name"}</h4>
                                <span className="text-xs text-neutral-400 font-medium">@{user.username || "username"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Email & Username */}
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-[#0f0f10] font-medium select-all">{user.email || "no-email@gitam.in"}</span>
                              {user.phone && <span className="text-[11px] text-neutral-400 font-medium select-all">{user.phone}</span>}
                            </div>
                          </td>

                          {/* Department & Year */}
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-[#0f0f10] font-semibold">{user.department || "General"}</span>
                              <span className="text-xs text-neutral-500 font-medium">{formatYear(user.year_of_study)}</span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-4 px-6">
                            {getRoleBadge(user.role)}
                          </td>

                          {/* Verification Status */}
                          <td className="py-4 px-6">
                            {user.is_verified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-none flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/25" /> Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-neutral-100 text-neutral-400 border-black/5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-none flex items-center gap-1 w-fit">
                                <Clock className="w-3.5 h-3.5" /> Unverified
                              </Badge>
                            )}
                          </td>

                          {/* Account Status */}
                          <td className="py-4 px-6">
                            {user.is_suspended ? (
                              <Badge className="bg-rose-500/10 text-rose-700 border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-none flex items-center gap-1 w-fit" title={`Reason: ${user.suspension_reason || "None"}`}>
                                <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/10 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-none flex items-center gap-1 w-fit">
                                Active
                              </Badge>
                            )}
                          </td>

                          {/* Actions Dropdown */}
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              {/* @ts-expect-error - asChild type check */}
                              <DropdownMenuTrigger asChild>
                                <button className="text-neutral-500 hover:text-black hover:bg-neutral-100 p-1.5 rounded-full transition-colors outline-none">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 rounded-xl border border-black/5 shadow-lg bg-white/95 backdrop-blur-md">
                                <DropdownMenuItem
                                  onClick={() => { setViewingUser(user); setViewProfileModalOpen(true); }}
                                  className="cursor-pointer font-medium text-xs py-2"
                                >
                                  <User className="w-4 h-4 mr-2 text-neutral-400" /> View Profile
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleVerifyToggle(user)}
                                  className="cursor-pointer font-medium text-xs py-2"
                                >
                                  <UserCheck className="w-4 h-4 mr-2 text-neutral-400" /> {user.is_verified ? "Unverify Student" : "Verify Student"}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => { setRoleEditingUser(user); setSelectedNewRole(user.role || "user"); setRoleModalOpen(true); }}
                                  className="cursor-pointer font-medium text-xs py-2"
                                >
                                  <Shield className="w-4 h-4 mr-2 text-neutral-400" /> Change Role
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-black/5" />

                                {user.is_suspended ? (
                                  <DropdownMenuItem
                                    onClick={() => handleActivateUser(user)}
                                    className="cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 font-medium text-xs py-2"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Activate User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => { setSuspendingUser(user); setSuspendModalOpen(true); }}
                                    className="cursor-pointer text-amber-600 focus:bg-amber-50 focus:text-amber-700 font-medium text-xs py-2"
                                  >
                                    <UserMinus className="w-4 h-4 mr-2 text-amber-500" /> Suspend User
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem
                                  onClick={() => { setDeletingUser(user); setDeleteModalOpen(true); }}
                                  className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 font-medium text-xs py-2"
                                >
                                  <Trash2 className="w-4 h-4 mr-2 text-red-500" /> Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-[#faf9f6]/40 border-t border-black/5">
                <span className="text-xs text-neutral-500 font-semibold">
                  Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-lg border border-black/10 bg-white hover:bg-neutral-100 text-neutral-600 transition-colors shadow-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-bold text-neutral-700 px-3 py-1 bg-white border border-black/5 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-lg border border-black/10 bg-white hover:bg-neutral-100 text-neutral-600 transition-colors shadow-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {/* MODAL: View Profile details */}
      <Dialog open={viewProfileModalOpen} onOpenChange={setViewProfileModalOpen}>
        <DialogContent className="bg-white border border-black/5 text-[#0f0f10] max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-dmserif text-[#0f0f10] text-2xl flex items-center gap-2">
              User Profile
            </DialogTitle>
            <DialogDescription>Full user profile details from database.</DialogDescription>
          </DialogHeader>

          {viewingUser && (
            <div className="space-y-6 py-4 text-left">
              {/* Profile Avatar Header */}
              <div className="flex items-center gap-4 p-4 bg-[#faf9f6] border border-black/5 rounded-2xl">
                <Avatar className="w-16 h-16 border border-black/15">
                  {viewingUser.profile_image_url ? (
                    <img src={viewingUser.profile_image_url} alt={viewingUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-[#505f78]/15 text-[#505f78] font-bold text-lg">
                      {(viewingUser.name || "U").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-[#0f0f10] leading-snug">{viewingUser.name || "No Display Name"}</h3>
                  <p className="text-xs text-neutral-400 font-semibold">@{viewingUser.username || "username"}</p>
                  <div className="mt-1.5 flex gap-1 flex-wrap">
                    {getRoleBadge(viewingUser.role)}
                    {viewingUser.is_verified && (
                      <Badge variant="outline" className="bg-[#505f78]/5 text-[#505f78] border-[#505f78]/10 text-[9px] font-bold rounded-full">
                        Verified Student
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Fields Details */}
              <div className="space-y-3.5">
                {/* Email */}
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-neutral-400 mt-1 shrink-0" />
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Institutional Email</label>
                    <span className="text-sm font-semibold text-[#0f0f10] select-all">{viewingUser.email || "N/A"}</span>
                  </div>
                </div>

                {/* Department & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-neutral-400 mt-1 shrink-0" />
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Department</label>
                      <span className="text-sm font-semibold text-[#0f0f10]">{viewingUser.department || "General / Unset"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="w-4 h-4 text-neutral-400 mt-1 shrink-0" />
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Academic Year</label>
                      <span className="text-sm font-semibold text-[#0f0f10]">{formatYear(viewingUser.year_of_study)}</span>
                    </div>
                  </div>
                </div>

                {/* Account Status / Points */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Points Balance</label>
                    <span className="text-sm font-bold text-[#855300] font-mono">{viewingUser.points !== undefined ? viewingUser.points : 0} points</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Join Date</label>
                    <span className="text-xs text-neutral-500 font-semibold">
                      {viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString(undefined, { dateStyle: "medium" }) : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Bio / Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Bio</label>
                  <p className="text-xs text-neutral-500 bg-[#faf9f6] border border-black/5 rounded-xl p-3 leading-relaxed mt-1 italic whitespace-pre-wrap">
                    {viewingUser.bio || "No profile bio written yet."}
                  </p>
                </div>

                {/* Suspended Details */}
                {viewingUser.is_suspended && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1.5">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-700" /> Account Restriction Active
                    </span>
                    <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                      Reason: &ldquo;{viewingUser.suspension_reason || "No reason logged."}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => { setViewProfileModalOpen(false); setViewingUser(null); }}
              className="bg-black hover:bg-neutral-800 text-white rounded-xl font-semibold h-11 w-full"
            >
              Close Profile Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Suspend User */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="bg-white border border-black/5 text-[#0f0f10] max-w-sm sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-dmserif text-[#0f0f10] text-xl flex items-center gap-2">
              Restrict Account Access
            </DialogTitle>
            <DialogDescription>
              Suspend @{suspendingUser?.username}&apos;s access. They will be immediately blocked from interacting with communities.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2 text-left">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Suspension Reason</label>
            <Input
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="e.g. Inappropriate content, policy violation..."
              className="bg-[#faf9f6] border border-black/5 rounded-xl text-[#0f0f10]"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setSuspendModalOpen(false); setSuspendingUser(null); setSuspensionReason(""); }}
              className="flex-1 border border-black/5 rounded-xl font-semibold h-11"
            >
              Cancel
            </Button>
            <Button
              disabled={submittingSuspend || !suspensionReason.trim()}
              onClick={handleSuspendSubmit}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold h-11"
            >
              {submittingSuspend ? "Processing..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Change Role */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="bg-white border border-black/5 text-[#0f0f10] max-w-sm sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-dmserif text-[#0f0f10] text-xl">
              Modify User Authorization
            </DialogTitle>
            <DialogDescription>
              Update @{roleEditingUser?.username}&apos;s clearance and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2 text-left">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Select Security Role</label>
            <select
              value={selectedNewRole}
              onChange={(e) => setSelectedNewRole(e.target.value)}
              className="w-full bg-[#faf9f6] border border-black/5 rounded-xl h-11 px-3 text-sm text-[#0f0f10] outline-none font-semibold cursor-pointer"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setRoleModalOpen(false); setRoleEditingUser(null); setSelectedNewRole(""); }}
              className="flex-1 border border-black/5 rounded-xl font-semibold h-11"
            >
              Cancel
            </Button>
            <Button
              disabled={submittingRole || !selectedNewRole}
              onClick={handleRoleChangeSubmit}
              className="flex-1 bg-black hover:bg-neutral-800 text-white rounded-xl font-semibold h-11"
            >
              {submittingRole ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Delete User Profile */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-white border border-black/5 text-[#0f0f10] max-w-sm sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-dmserif text-[#0f0f10] text-xl flex items-center gap-2">
              Delete User Account
            </DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to permanently delete @{deletingUser?.username}&apos;s profile? This action will erase all posts, settings, and authorization details, and is completely irreversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => { setDeleteModalOpen(false); setDeletingUser(null); }}
              className="flex-1 border border-black/5 rounded-xl font-semibold h-11"
            >
              Cancel
            </Button>
            <Button
              disabled={submittingDelete}
              onClick={handleDeleteSubmit}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold h-11"
            >
              {submittingDelete ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
