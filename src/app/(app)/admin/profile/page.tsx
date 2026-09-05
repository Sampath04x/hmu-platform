"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserIcon,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2Icon,
  Shield,
  Upload,
  Link as LinkIcon
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { apiFetch } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminProfilePage() {
  const { user_id, name: contextName } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  const fetchProfile = useCallback(async () => {
    if (!user_id) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/profiles/${user_id}`);
      setProfile(data);
      setDisplayName(data.name || "");
      setUsername(data.username || "");
      setEmail(data.email || "");
      setAvatarUrl(data.profile_image_url || "");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch profile details");
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, user_id]);

  // Handle local image file upload & Canvas compression to compact Base64
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (limit raw select to 5MB before processing)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large. Choose an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to scale image down (e.g. max 180x180 px for database efficiency)
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 180;
        const MAX_HEIGHT = 180;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to compressed jpeg format base64
          const base64 = canvas.toDataURL("image/jpeg", 0.7);
          setAvatarUrl(base64);
          toast.success("Profile picture loaded!");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDetails = async () => {
    if (!displayName.trim() || !username.trim() || !email.trim()) {
      toast.error("Name, username, and email fields are required.");
      return;
    }
    setSaving(true);
    try {
      // 1. If email has changed, update in Supabase Auth first
      if (email.toLowerCase().trim() !== profile?.email?.toLowerCase().trim()) {
        const { error: authErr } = await supabase.auth.updateUser({ email: email.toLowerCase().trim() });
        if (authErr) throw authErr;
        toast.info("A verification link has been sent to your new email address.");
      }

      // 2. Save profile details in DB
      await apiFetch(`/profiles/${user_id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: displayName,
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          profile_image_url: avatarUrl
        })
      });

      toast.success("Profile details updated successfully!");
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPasswordMsg("No active session. Please log out and back in.");
        setPasswordLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
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
      setPasswordMsg(err.message || "Failed to change password");
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f0f10]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#faf9f6] text-[#0f0f10] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
        <div className="absolute -right-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10 space-y-8 pb-20">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-dmserif font-bold tracking-tight text-[#0f0f10]">
            Admin Profile
          </h1>
          <p className="text-neutral-500 font-medium mt-1">
            Manage your administrator display identity and security credentials.
          </p>
        </header>

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <Avatar className="w-28 h-28 border-4 border-white shadow-lg relative overflow-hidden">
              <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-[#efece6] text-[#0f0f10] text-4xl font-dmserif font-bold">
                {displayName?.[0] || "A"}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
              <Upload className="w-5 h-5 mb-1" />
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
            </label>
          </div>

          <div className="mt-4 space-y-1.5">
            <h2 className="text-2xl font-dmserif font-bold text-[#0f0f10]">{displayName}</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-neutral-500 font-semibold">@{username}</span>
              <Badge variant="outline" className="bg-[#505f78]/5 text-[#505f78] border-[#505f78]/10 gap-1 rounded-full text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-none">
                <CheckCircle2Icon className="w-3 h-3 text-[#505f78]" /> {profile?.role || "Admin"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-left mb-1">
            <UserIcon className="w-4 h-4 text-[#505f78]" />
            <h3 className="font-dmserif font-semibold text-[#0f0f10] text-lg">Edit Administrator Info</h3>
          </div>

          <Card className="bg-white border border-black/5 p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5 text-left">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#505f78] text-[#0f0f10] font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#505f78] text-[#0f0f10] font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#505f78] text-[#0f0f10] font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Profile Picture URL (Optional fallback)
                </label>
                <input
                  type="text"
                  value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#505f78] text-[#0f0f10] font-medium"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveDetails}
              disabled={saving}
              className="bg-black hover:bg-neutral-800 text-white rounded-full px-6 h-10 text-xs font-bold shadow-sm transition-all"
            >
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </Button>
          </Card>
        </div>

        {/* Security & Credentials settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-left mb-1">
            <Shield className="w-4 h-4 text-[#505f78]" />
            <h3 className="font-dmserif font-semibold text-[#0f0f10] text-lg">Security & Authentication</h3>
          </div>

          <div className="bg-white border border-black/5 rounded-[24px] overflow-hidden divide-y divide-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-left">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full text-left px-6 py-4.5 text-sm text-[#0f0f10] font-bold hover:bg-neutral-50 transition-colors"
            >
              Change Account Password
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-6 py-4.5 text-sm text-[#0f0f10] font-bold hover:bg-neutral-50 transition-colors"
            >
              Sign Out from Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD DIALOG MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                  className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 pr-10 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-[#0f0f10] placeholder:text-neutral-300 font-medium bg-white"
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
    </main>
  );
}
