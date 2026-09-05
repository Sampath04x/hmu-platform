"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusIcon,
  UsersIcon,
  CalendarIcon,
  SettingsIcon,
  ShieldCheck,
  Globe,
  Share2,
  Link as LinkIcon,
  UserCheck,
  UserPlus,
  Loader2,
  LayoutDashboard,
  UserCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ClubDetails {
  club_id: string;
  club_name: string;
  username?: string;
  category?: string;
  description?: string;
  logo_url?: string;
  social_links?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
    other?: string;
    other_links?: string;
  };
}

export default function ClubDashboardPage() {
  const { role, isAuthLoading, user_id, name } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "members" | "requests" | "settings">("dashboard");
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [stats, setStats] = useState({ events: 0, posts: 0 });

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    club_name: "",
    username: "",
    category: "General",
    description: "",
    instagram: "",
    linkedin: "",
    website: "",
    other_links: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user_id) {
        router.push("/signin");
        return;
      }

      const fetchClubData = async () => {
        try {
          setLoading(true);

          // 1. Fetch club linkage from public.club_admins
          const { data: adminData } = await supabase
            .from("club_admins")
            .select("club_id, clubs(*)")
            .eq("user_id", user_id)
            .maybeSingle();

          let fetchedClub: ClubDetails | null = null;
          if (adminData && adminData.clubs) {
            fetchedClub = adminData.clubs as any;
          } else {
            // Fallback: check profile club_metadata or created_by in clubs
            const { data: directClub } = await supabase
              .from("clubs")
              .select("*")
              .eq("created_by", user_id)
              .maybeSingle();
            if (directClub) fetchedClub = directClub as any;
          }

          if (fetchedClub) {
            setClub(fetchedClub);
            setEditForm({
              club_name: fetchedClub.club_name || "",
              username: fetchedClub.username || "",
              category: fetchedClub.category || "General",
              description: fetchedClub.description || "",
              instagram: fetchedClub.social_links?.instagram || "",
              linkedin: fetchedClub.social_links?.linkedin || "",
              website: fetchedClub.social_links?.website || "",
              other_links: fetchedClub.social_links?.other || fetchedClub.social_links?.other_links || ""
            });

            // Fetch member count
            const { count: mCount } = await supabase
              .from("club_members")
              .select("*", { count: "exact", head: true })
              .eq("club_id", fetchedClub.club_id);
            setMemberCount(mCount || 0);

            // Fetch follower count if table exists
            try {
              const { count: fCount } = await supabase
                .from("club_followers")
                .select("*", { count: "exact", head: true })
                .eq("club_id", fetchedClub.club_id);
              setFollowerCount(fCount || 0);
            } catch (e) {
              setFollowerCount(0);
            }
          }

          // Fetch event / post stats
          const [eventsRes, postsRes] = await Promise.all([
            supabase.from("events").select("event_id", { count: "exact" }).eq("host_id", user_id),
            supabase.from("posts").select("id", { count: "exact" }).eq("author_id", user_id)
          ]);

          setStats({
            events: eventsRes.count || 0,
            posts: postsRes.count || 0
          });
        } catch (err) {
          console.error("Error fetching club dashboard data:", err);
        } finally {
          setLoading(false);
        }
      }

      fetchClubData();
    }
  }, [role, isAuthLoading, router, user_id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;

    setSaving(true);
    try {
      const social_links = {
        instagram: editForm.instagram.trim(),
        linkedin: editForm.linkedin.trim(),
        website: editForm.website.trim(),
        other: editForm.other_links.trim()
      };

      const payload: any = {
        club_name: editForm.club_name.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        social_links
      };

      if (editForm.username.trim()) {
        payload.username = editForm.username.trim().toLowerCase();
      }

      const { error: updateErr } = await supabase
        .from("clubs")
        .update(payload)
        .eq("club_id", club.club_id);

      if (updateErr) {
        // Fallback for schema compatibility
        if (updateErr.code === 'PGRST204' || updateErr.message.includes("column")) {
          await supabase
            .from("clubs")
            .update({
              club_name: editForm.club_name.trim(),
              description: editForm.description.trim()
            })
            .eq("club_id", club.club_id);
        } else {
          throw updateErr;
        }
      }

      setClub(prev => prev ? {
        ...prev,
        club_name: editForm.club_name.trim(),
        username: editForm.username.trim().toLowerCase(),
        category: editForm.category,
        description: editForm.description.trim(),
        social_links
      } : null);

      toast.success("Club profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update club profile.");
    } finally {
      setSaving(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <p className="text-xs font-semibold text-neutral-400">Loading Club Interface...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 bg-white border border-neutral-200/60 rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-2xl overflow-hidden shrink-0 border border-neutral-200">
            {club?.logo_url ? (
              <img src={club.logo_url} alt={club.club_name} className="w-full h-full object-cover" />
            ) : (
              (club?.club_name || name || "C").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f0f10]">
                {club?.club_name || name || "My Club"}
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Official
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              @{club?.username || "club"} • {club?.category || "General"}
            </p>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-1 max-w-lg">
              {club?.description || "Welcome to your club management portal."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-black text-white hover:bg-[#505f78] rounded-full text-xs font-bold px-5 h-10 shadow-sm">
            <PlusIcon className="w-4 h-4 mr-1.5" /> Create Event
          </Button>
          <Button
            variant="outline"
            onClick={() => { setActiveTab("profile"); setIsEditing(true); }}
            className="rounded-full text-xs font-bold border-[#c5c6cd] hover:bg-neutral-100 px-5 h-10"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200/80 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === "dashboard" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === "profile" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
        >
          <UserCircle className="w-4 h-4" /> Club Profile
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === "members" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
        >
          <UsersIcon className="w-4 h-4" /> Members ({memberCount})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === "requests" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
        >
          <UserPlus className="w-4 h-4" /> Join Requests
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === "settings" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
        >
          <SettingsIcon className="w-4 h-4" /> Settings
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <Card className="bg-white border-neutral-200/60 rounded-[24px] shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-neutral-400 uppercase font-bold tracking-wider flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-black" /> Events Hosted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0f0f10]">{stats.events}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200/60 rounded-[24px] shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-neutral-400 uppercase font-bold tracking-wider flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-blue-600" /> Active Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0f0f10]">{memberCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200/60 rounded-[24px] shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-neutral-400 uppercase font-bold tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> Followers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0f0f10]">{followerCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200/60 rounded-[24px] shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-neutral-400 uppercase font-bold tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" /> Posts Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0f0f10]">{stats.posts}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white border-neutral-200/60 rounded-[24px] shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#0f0f10]">Recent Club Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400">No active events scheduled yet. Click Create Event to publish one!</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200/60 rounded-[24px] shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#0f0f10]">Community Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400">No pending announcements for members.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. CLUB PROFILE PAGE */}
      {activeTab === "profile" && (
        <Card className="bg-white border-neutral-200/60 rounded-[32px] p-6 sm:p-8 shadow-sm">
          {!isEditing ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-[#0f0f10]">{club?.club_name}</h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">@{club?.username || "handle"}</p>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-black hover:bg-[#505f78] text-white rounded-full text-xs font-bold px-6 h-10"
                >
                  Edit Profile
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Category</h4>
                  <p className="text-xs font-bold text-[#0f0f10]">{club?.category || "General"}</p>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Members & Followers</h4>
                  <p className="text-xs font-bold text-[#0f0f10]">{memberCount} Members • {followerCount} Followers</p>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Description</h4>
                  <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">{club?.description || "No description provided."}</p>
                </div>

                <div className="md:col-span-2 space-y-2 pt-4 border-t border-neutral-100">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Social Links</h4>
                  <div className="flex flex-wrap gap-4 text-xs font-medium">
                    {club?.social_links?.instagram && (
                      <a href={club.social_links.instagram.startsWith("http") ? club.social_links.instagram : `https://${club.social_links.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-pink-600 font-bold hover:underline">
                        <Share2 className="w-4 h-4" /> Instagram
                      </a>
                    )}
                    {club?.social_links?.linkedin && (
                      <a href={club.social_links.linkedin.startsWith("http") ? club.social_links.linkedin : `https://${club.social_links.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline">
                        <LinkIcon className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                    {club?.social_links?.website && (
                      <a href={club.social_links.website.startsWith("http") ? club.social_links.website : `https://${club.social_links.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-600 font-bold hover:underline">
                        <Globe className="w-4 h-4" /> Website
                      </a>
                    )}
                    {(club?.social_links?.other || club?.social_links?.other_links) && (
                      <a href={`https://${club.social_links.other || club.social_links.other_links}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-amber-600 font-bold hover:underline">
                        <LinkIcon className="w-4 h-4" /> Other Links
                      </a>
                    )}
                    {!club?.social_links?.instagram && !club?.social_links?.linkedin && !club?.social_links?.website && !(club?.social_links?.other || club?.social_links?.other_links) && (
                      <p className="text-xs text-neutral-400">No social links added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <h3 className="text-lg font-bold text-[#0f0f10]">Edit Club Profile</h3>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="text-xs font-bold text-neutral-400">
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="club_name" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Club Display Name</Label>
                  <Input
                    id="club_name"
                    value={editForm.club_name}
                    onChange={(e) => setEditForm(p => ({ ...p, club_name: e.target.value }))}
                    className="bg-white border-[#c5c6cd] rounded-xl h-11 text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Club Handle / Username</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => setEditForm(p => ({ ...p, username: e.target.value }))}
                    className="bg-white border-[#c5c6cd] rounded-xl h-11 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Category</Label>
                <Input
                  id="category"
                  value={editForm.category}
                  onChange={(e) => setEditForm(p => ({ ...p, category: e.target.value }))}
                  className="bg-white border-[#c5c6cd] rounded-xl h-11 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Description</Label>
                <textarea
                  id="description"
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-white border border-[#c5c6cd] rounded-xl p-3 focus:border-black focus:outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="instagram" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Instagram</Label>
                  <Input
                    id="instagram"
                    value={editForm.instagram}
                    onChange={(e) => setEditForm(p => ({ ...p, instagram: e.target.value }))}
                    className="bg-white border-[#c5c6cd] rounded-xl h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="linkedin" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm(p => ({ ...p, linkedin: e.target.value }))}
                    className="bg-white border-[#c5c6cd] rounded-xl h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Website</Label>
                  <Input
                    id="website"
                    value={editForm.website}
                    onChange={(e) => setEditForm(p => ({ ...p, website: e.target.value }))}
                    className="bg-white border-[#c5c6cd] rounded-xl h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="other_links" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Other Link</Label>
                  <Input
                    id="other_links"
                    value={editForm.other_links}
                    onChange={(e) => setEditForm(p => ({ ...p, other_links: e.target.value }))}
                    className="bg-white border-[#c5c6cd] rounded-xl h-10 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-full text-xs font-bold px-5 h-10">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-black text-white hover:bg-[#505f78] rounded-full text-xs font-bold px-7 h-10">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* 3. MEMBERS */}
      {activeTab === "members" && (
        <Card className="bg-white border-neutral-200/60 rounded-[32px] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#0f0f10]">Club Members</h3>
              <p className="text-xs text-neutral-400">Total active members: {memberCount}</p>
            </div>
          </div>
          <p className="text-xs text-neutral-400">No additional member details found. Students can join when member registrations are open.</p>
        </Card>
      )}

      {/* 4. JOIN REQUESTS */}
      {activeTab === "requests" && (
        <Card className="bg-white border-neutral-200/60 rounded-[32px] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#0f0f10]">Membership Join Requests</h3>
              <p className="text-xs text-neutral-400">Review pending membership requests from students.</p>
            </div>
          </div>
          <p className="text-xs text-neutral-400">No pending join requests.</p>
        </Card>
      )}

      {/* 5. SETTINGS */}
      {activeTab === "settings" && (
        <Card className="bg-white border-neutral-200/60 rounded-[32px] p-6 sm:p-8 shadow-sm">
          <div className="border-b border-neutral-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-[#0f0f10]">Club Settings</h3>
            <p className="text-xs text-neutral-400">Manage permissions, notifications, and club administration settings.</p>
          </div>
          <p className="text-xs text-neutral-400">Club permission level: Owner. Account verified.</p>
        </Card>
      )}
    </div>
  );
}
