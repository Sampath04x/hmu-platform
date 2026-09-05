"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminButton } from "./AdminButton";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Lock, Eye, EyeOff } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Change Password Modal State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setSubmittingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Administrator password updated successfully!");
      setChangePasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background md:pl-[80px] lg:pl-[240px] relative overflow-x-hidden font-sans antialiased text-[#0f0f10]">
      {/* Background blobs matching Student Layout */}
      <div className="absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute -right-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute top-[35%] left-[-150px] w-[400px] h-[400px] rounded-full bg-[#f3f1eb] blur-[120px] opacity-40 pointer-events-none" />
      <div className="absolute top-[60%] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#f0ede6] blur-[110px] opacity-35 pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar onOpenChangePassword={() => setChangePasswordOpen(true)} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-[240px] h-full animate-in slide-in-from-left duration-200">
            <AdminSidebar
              onClose={() => setMobileMenuOpen(false)}
              onOpenChangePassword={() => {
                setMobileMenuOpen(false);
                setChangePasswordOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        <AdminHeader
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border border-black/5 rounded-[24px] p-6 shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-[#0f0f10] mb-2">
              <Lock className="w-5 h-5 text-[#505f78]" />
            </div>
            <DialogTitle className="text-lg font-dmserif font-bold text-[#0f0f10]">
              Change Password
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 font-medium">
              Update password credentials for Administrator account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0f0f10]">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pr-10 rounded-xl border-black/10 text-xs bg-white/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0f0f10]">Confirm New Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="rounded-xl border-black/10 text-xs bg-white/60"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setChangePasswordOpen(false)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submittingPassword}
              >
                Update Password
              </AdminButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
