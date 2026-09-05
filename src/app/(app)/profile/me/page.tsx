"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, ThumbsUpIcon, MessageCircleIcon, BookmarkIcon, Bell, Lock, Shield, UserIcon, Loader2, Users, GraduationCap, Building2, Eye, EyeOff } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { apiFetch } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { PostCard } from "@/components/PostCard";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { INTEREST_TAGS } from "@/constants/interestTags";

const DEPARTMENTS = [
  "CSE",
  "ECE",
  "Mechanical",
  "Civil",
  "EEE",
  "IT",
  "Chemical",
  "Biotech",
  "MBA",
  "Law",
  "Pharmacy",
  "Architecture",
];

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Ph.D.",
];

interface ProfileData {
  name?: string;
  bio?: string;
  department?: string;
  year_of_study?: number;
  profile_image_url?: string;
  role?: string;
  points?: number;
  daily_activity_count?: number;
  interests?: Array<{ interests: { interest: string } }>;
  privacy_settings?: any;
  is_approved?: boolean;
  club_metadata?: any;
}

interface UserPost {
  id: string;
  content: string;
  created_at: string;
  post_type?: string;
  post_likes?: any;
  post_comments?: any;
}

interface Connection {
  follower_id?: string;
  following_id?: string;
  profiles?: {
    name: string;
    profile_image_url: string;
    role: string;
  };
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${on ? "bg-black" : "bg-neutral-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function MyProfilePage() {
  const { user_id, name: contextName, interests: contextInterests, role: contextRole } = useUser();
  const router = useRouter(); // ← ADDED
  const { handleDeleteAccount, isDeleting } = useDeleteAccount(user_id);

  const [activeTab, setActiveTab] = useState("Posts");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<Connection[]>([]);
  const [savedPosts, setSavedPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  const [settings, setSettings] = useState({
    showPhoto: false,
    showDepartment: true,
    showYear: true,
    allowMessageRequests: false,
    girlsFirstProtection: true,
    matchNotifs: true,
    eventReminders: true,
  });

  const [clubNameInput, setClubNameInput] = useState("");
  const [clubBioInput, setClubBioInput] = useState("");
  const [selectedClubDomains, setSelectedClubDomains] = useState<string[]>([]);

  // Student Settings Form State
  const [studentNameInput, setStudentNameInput] = useState("");
  const [studentBioInput, setStudentBioInput] = useState("");
  const [studentDeptInput, setStudentDeptInput] = useState("");
  const [studentYearInput, setStudentYearInput] = useState("");
  const [studentInterestsInput, setStudentInterestsInput] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setClubNameInput(profile.name || "");
      setClubBioInput(profile.bio || "");
      setSelectedClubDomains(profile.club_metadata?.domains || []);

      setStudentNameInput(profile.name || "");
      setStudentBioInput(profile.bio || "");
      setStudentDeptInput(profile.department || "");
      const yearStr = profile.year_of_study === 6 ? "Ph.D." :
                      profile.year_of_study ? `${profile.year_of_study}${profile.year_of_study === 1 ? 'st' : profile.year_of_study === 2 ? 'nd' : profile.year_of_study === 3 ? 'rd' : 'th'} Year` : "";
      setStudentYearInput(yearStr);
      setStudentInterestsInput(profile.interests?.map(i => i.interests.interest) || []);
    }
  }, [profile]);

  const fetchData = useCallback(async () => {
    if (!user_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [prof, postsRes, followersRes, followingRes] = await Promise.all([
        apiFetch(`/profiles/${user_id}`),
        apiFetch(`/posts?user_id=${user_id}`),
        apiFetch(`/profiles/${user_id}/followers`),
        apiFetch(`/profiles/${user_id}/following`)
      ]);

      setProfile(prof);
      setUserPosts(postsRes.posts || []);
      setFollowers(followersRes || []);
      setFollowing(followingRes || []);

      if (prof.privacy_settings) {
        setSettings(prev => ({ ...prev, ...prof.privacy_settings }));
      }
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  // const fetchSavedPosts = async () => {
  //   if (!user_id) return;
  //   console.log("Fetching saved posts for:", user_id);

  //   try {
  //     const { data, error } = await supabase
  //       .from("saved_posts")
  //       .select(`
  //         post_id,
  //         posts (
  //           id,
  //           content,
  //           created_at,
  //           post_type
  //         )
  //       `)
  //       .eq("user_id", user_id);

  //     if (error) throw error;
  //     console.log("Saved posts raw:", data);
  //     console.log("Saved posts error:", error);

  //     setSavedPosts(
  //       data?.map((item: any) => item.posts).filter(Boolean) || []
  //     );
  //   } catch (err) {
  //     console.error("Failed to fetch saved posts:", err);
  //   }
  // };
  const fetchSavedPosts = async () => {
    if (!user_id) return;

    try {
      const { data: savedData, error: savedError } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user_id);

      if (savedError) throw savedError;

      if (!savedData?.length) {
        setSavedPosts([]);
        return;
      }

      const postIds = savedData.map(item => item.post_id);

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          created_at,
          post_type
        `)
        .in("id", postIds);

      if (postsError) throw postsError;

      console.log("Posts fetched:", postsData);

      setSavedPosts(postsData || []);
    } catch (err) {
      console.error("Failed to fetch saved posts:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSavedPosts();
  }, [fetchData, user_id]);

  const toggle = (k: keyof typeof settings) => {
    const newSettings = { ...settings, [k]: !settings[k] };
    setSettings(newSettings);
    apiFetch(`/profiles/${user_id}`, {
      method: "PUT",
      body: JSON.stringify({ privacy_settings: newSettings, name: profile?.name || contextName, })
    }).catch(console.error);
  };

  // ← ADDED: change password handler
  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg("");
    const timeout = setTimeout(() => {
      setPasswordLoading(false);
      setPasswordMsg("Request timed out. Please try again.");
    }, 8000);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimeout(timeout);
        setPasswordMsg("No active session. Please log out and log back in first.");
        setPasswordLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      clearTimeout(timeout);
      if (error) throw error;
      setPasswordMsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordLoading(false);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg("");
      }, 1500);
    } catch (err: any) {
      clearTimeout(timeout);
      setPasswordMsg(err.message || "Failed to update password");
      setPasswordLoading(false);
    }
  };

  // Student profile update helper
  const handleSaveStudentDetails = async () => {
    try {
      let parsedYear = parseInt(studentYearInput);
      if (studentYearInput === "Ph.D.") parsedYear = 6;
      if (isNaN(parsedYear)) parsedYear = 1;

      await apiFetch(`/profiles/${user_id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: studentNameInput,
          bio: studentBioInput,
          department: studentDeptInput,
          year_of_study: parsedYear,
          interests: studentInterestsInput
        })
      });
      toast.success("Profile updated successfully!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile");
    }
  };

  // ← ADDED: export data handler
  const handleExportData = async () => {
    try {
      const data = await apiFetch(`/profiles/${user_id}`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };


  //Sign out handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error(err);
    }
  };

  const name = profile?.name || contextName;
  const interests = profile?.interests?.map(i => i.interests.interest) || contextInterests;
  const role = profile?.role || contextRole;

  const TABS = role === "club" ?
    (["Posts", "Insights", "Settings"] as const) :
    (["Posts", "Saved", "Connections", "Clubs", "Settings"] as const);

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#505f78] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: "#faf9f6" }}>
      {/* Background Glow Decorations (Consistent with Landing Page) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
        <div className="absolute -right-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
        <div className="absolute top-[35%] left-[-150px] w-[400px] h-[400px] rounded-full bg-[#f3f1eb] blur-[120px] opacity-45" />
        <div className="absolute top-[60%] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#f0ede6] blur-[110px] opacity-40" />
      </div>

      <div className="relative z-10">
        {/* ← ADDED: Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-black/5 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl text-left">
              <h3 className="font-dmserif text-xl font-bold text-[#0f0f10]">Change Password</h3>

              {passwordMsg && (
                <p className={`text-xs font-semibold ${passwordMsg.includes("success") ? "text-emerald-600" : "text-red-600"}`}>
                  {passwordMsg}
                </p>
              )}

              {/* Current Password Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 pr-10 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 placeholder:text-neutral-300 font-medium bg-white"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                  >
                    {showCurrentPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password (min 6 characters)"
                    className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 pr-10 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 placeholder:text-neutral-300 font-medium bg-white"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                  >
                    {showNewPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 pr-10 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 placeholder:text-neutral-300 font-medium bg-white"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                  >
                    {showConfirmNewPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full border border-black/10 bg-white text-black font-bold hover:bg-[#f3f1eb] transition-all text-xs h-10"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setPasswordMsg("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-full bg-black hover:bg-neutral-800 text-white font-bold transition-all text-xs h-10 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleChangePassword}
                  disabled={passwordLoading || newPassword.length < 6 || confirmNewPassword.length < 6 || !currentPassword}
                >
                  {passwordLoading ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Profile Header ─── */}
      <div className="px-4 sm:px-6 pt-8 flex flex-col items-center text-center max-w-2xl mx-auto">
        <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
          <AvatarImage src={profile?.profile_image_url} alt={name} className="object-cover" />
          <AvatarFallback className="bg-[#efece6] text-[#0f0f10] text-4xl font-dmserif font-bold">{name?.[0]}</AvatarFallback>
        </Avatar>

        <div className="mt-4 space-y-2 w-full">
          <h1 className="text-2xl font-dmserif font-bold text-[#0f0f10]">{name}</h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm text-neutral-500 font-semibold">
              {profile?.department || "Student"} {profile?.year_of_study ? `· ${profile.year_of_study === 6 ? 'Ph.D.' : `${profile.year_of_study}${profile.year_of_study === 1 ? 'st' : profile.year_of_study === 2 ? 'nd' : profile.year_of_study === 3 ? 'rd' : 'th'} Year`}` : ""}
            </span>
            <Badge variant="outline" className="bg-[#505f78]/5 text-[#505f78] border-[#505f78]/10 gap-1 rounded-full text-xs px-2.5 shadow-none">
              <CheckCircle2Icon className="w-3 h-3 text-[#505f78]" /> Verified
            </Badge>
          </div>
          <p className="text-neutral-500 text-sm max-w-xs mx-auto leading-relaxed">
            {profile?.bio || (profile?.department ? "" : "Just trying to figure things out.")}
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {interests.map(tag => (
              <span key={tag} className="bg-[#505f78]/5 text-[#505f78] border border-[#505f78]/10 rounded-full px-3 py-1 text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-3 gap-3 mt-6 w-full">
          {[
            [followers.length.toString(), "Connections"],
            [userPosts.length.toString(), "Posts"],
            [(profile?.points || 0).toString(), "Points"]
          ].map(([val, label]) => (
            <div key={label} className="bg-white border border-black/5 rounded-2xl py-3.5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="text-xl font-dmserif font-bold text-[#0f0f10]">{val}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Daily Activity Progress */}
        <div className="w-full mt-6 px-2">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Daily Activity Limit</span>
            <span className="text-[10px] font-bold text-[#855300] uppercase tracking-widest">
              {profile?.daily_activity_count || 0} / {role === 'club' ? 100 : 20} Used
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((profile?.daily_activity_count || 0) / (role === 'club' ? 100 : 20)) * 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-neutral-500 mt-2 italic text-left">
            Limit resets daily. Points help unlock premium features.
          </p>
        </div>
      </div>

      {/* ─── Campus Utilities Section ─── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8 text-left">
        <h3 className="font-dmserif text-lg font-bold text-[#0f0f10] mb-4">Campus Utilities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Professor Reviews Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${(!profile?.is_approved || userPosts.length === 0)
            ? "bg-white/50 border-black/5 opacity-60 shadow-none"
            : "bg-white border border-black/5 hover:border-black/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            }`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Feedback Hub</span>
                {(!profile?.is_approved || userPosts.length === 0) ? (
                  <Badge variant="outline" className="bg-[#505f78]/10 text-[#505f78] border-[#505f78]/20 text-[9px] font-bold rounded-full px-2 py-0.5 shadow-none">Locked</Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] font-bold rounded-full px-2 py-0.5 shadow-none">Active</Badge>
                )}
              </div>
              <h4 className="font-dmserif font-bold text-base text-[#0f0f10]">Professor Reviews</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Anonymous rating system for faculty members. Access grading, homework load, and teaching scores.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
              {(!profile?.is_approved || userPosts.length === 0) ? (
                <span className="text-[10px] text-amber-700 font-bold leading-tight flex items-center gap-1">
                  🔒 Locked: Verification & 1 Post Required
                </span>
              ) : (
                <Link href="/communities/professor-reviews">
                  <Button size="sm" className="bg-black hover:bg-neutral-800 text-white rounded-full text-xs h-9 px-4 font-bold transition-all shadow-sm">
                    Access Reviews
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Vacant Class Reporting Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${(!profile?.is_approved || userPosts.length === 0)
            ? "bg-white/50 border-black/5 opacity-60 shadow-none"
            : "bg-white border border-black/5 hover:border-black/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            }`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Classroom Tracker</span>
                {(!profile?.is_approved || userPosts.length === 0) ? (
                  <Badge variant="outline" className="bg-[#505f78]/10 text-[#505f78] border-[#505f78]/20 text-[9px] font-bold rounded-full px-2 py-0.5 shadow-none">Locked</Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] font-bold rounded-full px-2 py-0.5 shadow-none">Active</Badge>
                )}
              </div>
              <h4 className="font-dmserif font-bold text-base text-[#0f0f10]">Vacant Classroom Locator</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Locate empty rooms in real time for study groups, project works, or self-study sessions.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
              {(!profile?.is_approved || userPosts.length === 0) ? (
                <span className="text-[10px] text-amber-700 font-bold leading-tight flex items-center gap-1">
                  🔒 Locked: Verification & 1 Post Required
                </span>
              ) : (
                <Link href="/communities/vacant-classrooms">
                  <Button size="sm" className="bg-black hover:bg-neutral-800 text-white rounded-full text-xs h-9 px-4 font-bold transition-all shadow-sm">
                    Locate Rooms
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8 pb-28">
        {/* Tab Switcher */}
        <div className="flex bg-white border border-black/5 rounded-full p-1 gap-1 mb-6 shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-200 ${activeTab === tab
                ? "bg-black text-white shadow-sm"
                : "text-neutral-500 hover:text-black hover:bg-[#f3f1eb]"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Posts" && (
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No posts yet.</p>
            ) : (
              userPosts.map((post) => (
                <Card key={post.id} className="p-5 sm:p-6 bg-white/80 backdrop-blur-sm border border-black/5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:bg-white hover:border-black/10 transition-all duration-300 text-left">
                  <div className="flex justify-between items-center mb-3">
                    <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      post.post_type === "EVENT" ? "bg-[#505f78]/10 text-[#505f78] border border-[#505f78]/20" :
                      post.post_type === "QUESTION" ? "bg-[#855300]/10 text-[#855300] border border-[#855300]/20" :
                      post.post_type === "TIP" ? "bg-emerald-600/10 text-emerald-700 border border-emerald-600/20" :
                      post.post_type === "UTILITY" ? "bg-blue-600/10 text-blue-700 border border-blue-600/20" :
                      post.post_type === "OPINION" ? "bg-rose-600/10 text-rose-700 border border-rose-600/20" :
                      "bg-neutral-100 text-neutral-600 border border-black/5"
                    }`} variant="outline">
                      {post.post_type || "General"}
                    </Badge>
                    <span className="text-xs text-neutral-400 font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[#0f0f10] text-[15px] leading-relaxed mb-4">{post.content}</p>
                  <div className="flex items-center gap-6 text-neutral-500">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <div className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors">
                        <ThumbsUpIcon className="w-4 h-4" />
                      </div>
                      {post.post_likes?.[0]?.count || (post.post_likes as any)?.count || 0}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <div className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors">
                        <MessageCircleIcon className="w-4 h-4" />
                      </div>
                      {post.post_comments?.[0]?.count || (post.post_comments as any)?.count || 0}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "Insights" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-white border border-black/5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Total Followers</div>
                <div className="text-4xl font-dmserif font-bold text-[#0f0f10]">428</div>
                <div className="text-xs text-emerald-600 font-bold mt-2">+12% from last week</div>
              </Card>

              <Card className="p-6 bg-white border border-black/5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Total Reach</div>
                <div className="text-4xl font-dmserif font-bold text-[#0f0f10]">1.8k</div>
                <div className="text-xs text-emerald-600 font-bold mt-2">+24% from last week</div>
              </Card>
            </div>

            <Card className="p-8 bg-white border border-black/5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-dmserif text-xl font-bold text-[#0f0f10]">
                  Engagement Trends
                </h3>
                <div className="text-xs font-bold uppercase tracking-widest text-[#855300]">
                  Last 7 Days
                </div>
              </div>

              <div className="h-48 flex items-end justify-between gap-3 px-2">
                {[45, 78, 56, 92, 45, 67, 88].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div
                      className="w-full bg-[#505f78]/10 rounded-t-lg transition-all group-hover:bg-[#505f78] relative"
                      style={{ height: `${val}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-black">
                        {val}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-8 bg-white border border-black/5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
              <h3 className="font-dmserif text-xl font-bold text-[#0f0f10]">Top Interactions</h3>
              <div className="space-y-4">
                {[
                  { label: "Hearts & Likes", count: "1,240", icon: ThumbsUpIcon, color: "text-rose-600" },
                  { label: "Community Shares", count: "215", icon: Shield, color: "text-blue-600" },
                  { label: "Profile Views", count: "890", icon: UserIcon, color: "text-[#855300]" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-black/5">
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-sm font-medium text-[#0f0f10]">{item.label}</span>
                    </div>
                    <span className="font-dmserif font-bold text-[#0f0f10]">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "Connections" && (
          <div className="space-y-6">
            {/* Greyed-out Connections coming soon placeholder */}
            <Card className="p-8 bg-white/50 border border-dashed border-black/10 rounded-[24px] text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-200/60 flex items-center justify-center text-neutral-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0f0f10]">Connections & Networks</h3>
                <span className="inline-block bg-[#855300]/10 text-[#855300] border border-[#855300]/20 rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider">Connections – coming soon</span>
              </div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Peer-to-peer chats, following feeds, and visual campus network structures are currently under construction.
              </p>
            </Card>

            {/* Existing circle list below, but styled slightly muted */}
            <div className="opacity-50 pointer-events-none">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 text-left">Your Current Circle</h4>
              <div className="grid grid-cols-3 gap-3">
                {followers.map((conn, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 p-4 bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                  >
                    <Avatar className="w-14 h-14 border border-border">
                      <AvatarImage src={conn.profiles?.profile_image_url} alt={conn.profiles?.name} />
                      <AvatarFallback className="bg-neutral-100 text-neutral-600 font-bold">{conn.profiles?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-center text-neutral-500 leading-tight line-clamp-1">
                      {conn.profiles?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Clubs" && (
          <div className="space-y-3">
            {following.filter(f => f.profiles?.role === 'club').map((f, i) => (
              <Link
                key={i}
                href={`/profile/${f.following_id}`}
                className="p-4 bg-white border border-black/5 flex items-center gap-4 hover:border-black/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all rounded-2xl shadow-sm"
              >
                <Avatar className="w-12 h-12 rounded-xl">
                  <AvatarImage src={f.profiles?.profile_image_url} />
                  <AvatarFallback className="bg-black text-white font-bold text-lg rounded-xl">
                    {f.profiles?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-[#0f0f10] text-sm">{f.profiles?.name}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Following</p>
                </div>
              </Link>
            ))}
            {following.filter((f: any) => f.profiles?.role === 'club').length === 0 && (
              <div className="py-12 text-center">
                <p className="text-neutral-500 text-sm">You haven&apos;t followed any clubs yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "Saved" && (
          <div className="space-y-4">
            {savedPosts.length === 0 ? (
              <div className="text-center py-10 text-neutral-500">
                No saved posts yet.
              </div>
            ) : (
              savedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user_id={user_id}
                  isSaved={true}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="space-y-8">
            {/* Student Settings (Only for non-Club role) */}
            {role !== 'club' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="w-4 h-4 text-[#505f78]" />
                  <h3 className="font-dmserif font-semibold text-[#0f0f10]">Edit Profile</h3>
                </div>
                <Card className="bg-white border border-black/5 p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Display Name</label>
                      <input
                        type="text"
                        value={studentNameInput || ""}
                        onChange={(e) => setStudentNameInput(e.target.value)}
                        className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#505f78] text-[#0f0f10] font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Bio</label>
                      <textarea
                        value={studentBioInput || ""}
                        onChange={(e) => setStudentBioInput(e.target.value)}
                        maxLength={200}
                        className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#505f78] text-[#0f0f10] min-h-[80px] font-medium resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Department</label>
                        <select
                          value={studentDeptInput || ""}
                          onChange={(e) => setStudentDeptInput(e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl h-11 px-4 text-sm text-[#0f0f10] outline-none font-medium cursor-pointer"
                        >
                          <option value="" disabled hidden>Select Department</option>
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Year of Study</label>
                        <select
                          value={studentYearInput || ""}
                          onChange={(e) => setStudentYearInput(e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl h-11 px-4 text-sm text-[#0f0f10] outline-none font-medium cursor-pointer"
                        >
                          <option value="" disabled hidden>Select Year</option>
                          {YEARS.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Interests (Select up to 10)</label>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1.5 border border-black/5 rounded-xl bg-neutral-50/50">
                        {INTEREST_TAGS.map(({ tag }) => {
                          const isSelected = studentInterestsInput.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setStudentInterestsInput(studentInterestsInput.filter(t => t !== tag));
                                } else if (studentInterestsInput.length < 10) {
                                  setStudentInterestsInput([...studentInterestsInput, tag]);
                                } else {
                                  toast.error("You can select up to 10 interests.");
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isSelected
                                ? "bg-black text-white border-black shadow-sm"
                                : "bg-white text-neutral-500 border-black/10 hover:border-neutral-300"
                                }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveStudentDetails}
                    className="bg-black hover:bg-neutral-800 text-white rounded-full px-6 h-10 text-xs font-bold shadow-sm transition-all"
                  >
                    Save Profile Details
                  </Button>
                </Card>
              </div>
            )}

            {/* Club Settings & Domains (Only for Club role) */}
            {role === 'club' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="w-4 h-4 text-[#505f78]" />
                  <h3 className="font-dmserif font-semibold text-[#0f0f10]">Club Settings & Domains</h3>
                </div>
                <Card className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Club Name</label>
                      <input
                        type="text"
                        value={clubNameInput || ""}
                        onChange={(e) => setClubNameInput(e.target.value)}
                        className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#505f78] text-[#0f0f10]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Club Bio</label>
                      <textarea
                        value={clubBioInput || ""}
                        onChange={(e) => setClubBioInput(e.target.value)}
                        className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#505f78] text-[#0f0f10] min-h-[80px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Club Domains (Select up to 3)</label>
                      <div className="flex flex-wrap gap-2">
                        {["Technical", "Cultural", "Sports", "Literary", "Social Service", "Media", "Arts", "Coding", "Music"].map((domain) => {
                          const isSelected = selectedClubDomains.includes(domain);
                          return (
                            <button
                              key={domain}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedClubDomains(selectedClubDomains.filter(d => d !== domain));
                                } else if (selectedClubDomains.length < 3) {
                                  setSelectedClubDomains([...selectedClubDomains, domain]);
                                } else {
                                  toast.error("You can select up to 3 domains.");
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isSelected
                                ? "bg-black text-white border-black"
                                : "bg-neutral-50 text-neutral-500 border-black/5 hover:border-neutral-300"
                                }`}
                            >
                              {domain}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      toast.success("Club details updated successfully!");
                      apiFetch(`/profiles/${user_id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                          name: clubNameInput,
                          bio: clubBioInput,
                          club_metadata: {
                            ...profile?.club_metadata,
                            domains: selectedClubDomains
                          }
                        })
                      }).catch(console.error);
                    }}
                    className="bg-black hover:bg-[#505f78] text-white rounded-full px-6 h-10 text-xs font-bold shadow-sm"
                  >
                    Save Club Details
                  </Button>
                </Card>
              </div>
            )}

            {/* Privacy */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-[#505f78]" />
                <h3 className="font-dmserif font-semibold text-[#0f0f10]">Privacy Settings</h3>
              </div>
              <Card className="bg-white border border-black/5 rounded-[24px] divide-y divide-black/5 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                {[
                  { key: "showPhoto" as const, label: "Show my photo to non-connections" },
                  { key: "showDepartment" as const, label: "Show my department" },
                  { key: "girlsFirstProtection" as const, label: "Girls-first protection", desc: "Only people who've interacted with your content can message you first." },
                  { key: "allowMessageRequests" as const, label: "Message requests" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex justify-between items-start p-5 hover:bg-neutral-50/50 transition-colors">
                    <div className="flex-1 pr-4 text-left">
                      <p className="font-bold text-[#0f0f10] text-sm">{label}</p>
                      {desc && <p className="text-xs text-neutral-500 mt-1 leading-relaxed font-medium">{desc}</p>}
                    </div>
                    <Toggle on={settings[key]} onToggle={() => toggle(key)} />
                  </div>
                ))}
              </Card>
            </div>

            {/* Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-[#505f78]" />
                <h3 className="font-dmserif font-semibold text-[#0f0f10]">Notification Settings</h3>
              </div>
              <Card className="bg-white border border-black/5 rounded-[24px] divide-y divide-black/5 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                {[
                  { key: "matchNotifs" as const, label: "Match notifications" },
                  { key: "eventReminders" as const, label: "Event reminders" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex justify-between items-center p-5 hover:bg-neutral-50/50 transition-colors text-left">
                    <p className="font-bold text-[#0f0f10] text-sm">{label}</p>
                    <Toggle on={settings[key]} onToggle={() => toggle(key)} />
                  </div>
                ))}
              </Card>
            </div>

            {/* Club Admin Management */}
            {role === 'club' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-[#505f78]" />
                  <h3 className="font-dmserif font-semibold text-[#0f0f10]">Manage Club Admins</h3>
                </div>
                <Card className="bg-white border border-black/5 p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <p className="text-xs text-neutral-500 mb-4 font-medium italic text-left">
                    Add other Gitam emails to allow them to manage this club account.
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="admin@student.gitam.edu"
                        className="flex-1 bg-white border border-black/10 h-10 px-3.5 rounded-full text-sm focus:outline-none focus:border-black text-[#0f0f10]"
                      />
                      <Button className="bg-black text-white hover:bg-neutral-800 rounded-full px-5 font-bold text-xs h-10 shadow-sm transition-all">
                        Add
                      </Button>
                    </div>

                    {/* Placeholder for list of admins */}
                    <div className="pt-3 border-t border-black/5">
                      <div className="flex items-center justify-between py-2 text-left">
                        <span className="text-sm font-bold text-[#0f0f10]">You (Owner)</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-[#505f78]/5 text-[#505f78] border-[#505f78]/10 rounded-full px-2.5 shadow-none">
                          Owner
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Account */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[#505f78]" />
                <h3 className="font-dmserif font-semibold text-[#0f0f10]">Account</h3>
              </div>
              <div className="bg-white border border-black/5 rounded-[24px] overflow-hidden divide-y divide-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                {role === 'super_admin' && (
                  <Link href="/admin" className="w-full block text-left px-5 py-4 text-sm text-black font-bold hover:bg-neutral-50 transition-colors">
                    Access Super Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full text-left px-5 py-4 text-sm text-[#0f0f10] font-bold hover:bg-neutral-50 transition-colors"
                >
                  Change Password
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-5 py-4 text-sm text-[#0f0f10] font-bold hover:bg-neutral-50 transition-colors"
                >
                  Sign Out
                </button>

                <button
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  className={`w-full text-left px-5 py-4 text-sm text-red-600 font-bold hover:bg-red-50 transition-colors ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
