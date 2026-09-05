"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Building2,
  Users,
  ScrollText,
  Settings,
  LogOut,
  Lock,
  UserIcon,
  X,
  ChevronUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AdminSidebarProps {
  onClose?: () => void;
  onOpenChangePassword?: () => void;
}

export const ADMIN_NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Clubs", href: "/admin/clubs", icon: ClipboardList, exact: false },
  { name: "Events", href: "/admin/events", icon: Calendar, exact: false },
  { name: "Classrooms", href: "/admin/classrooms", icon: Building2, exact: false },
  { name: "User Management", href: "/admin/user-management", icon: Users, exact: false },
  { name: "Reports", href: "/admin/reports", icon: ScrollText, exact: false },
  { name: "Settings", href: "/admin/settings", icon: Settings, exact: false },
];

export function AdminSidebar({ onClose, onOpenChangePassword }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, username, profileImageUrl } = useUser();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = name || "Administrator";
  const displayHandle = username ? `@${username}` : "@admin";

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/signin");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    } finally {
      setLoggingOut(false);
    }
  };

  const isItemActive = (item: typeof ADMIN_NAV_ITEMS[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[80px] lg:w-[240px] bg-white/40 backdrop-blur-xl border-r border-black/5 z-40 flex flex-col justify-between select-none">
      {/* Top Header Logo */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-black/5 shrink-0 justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand shrink-0 flex items-center justify-center font-dmserif font-bold text-white tracking-widest text-xs">
              i
            </div>
            <span className="font-dmserif font-semibold text-xl hidden lg:block tracking-tight">
              intrst
            </span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto hide-scrollbar">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all border ${
                  active
                    ? "bg-white/60 text-black border-black/5 shadow-sm font-semibold"
                    : "text-neutral-500 hover:text-black hover:bg-white/40 border-transparent"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-base hidden lg:block truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Section Matching Student Sidebar */}
      <div className="p-4 border-t border-black/5">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 w-full hover:bg-white/60 p-2 rounded-xl border border-transparent hover:border-black/5 hover:shadow-sm transition-all text-left outline-none">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border border-black/5 shrink-0"
                />
              ) : (
                <Avatar className="w-10 h-10 border border-black/5 shrink-0">
                  <AvatarFallback className="bg-[#505f78]/10 text-[#505f78] font-bold">
                    {displayName[0]?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="hidden lg:block overflow-hidden min-w-0 flex-1">
                <div className="font-medium text-sm text-[#0f0f10] truncate">
                  {displayName}
                </div>
                <div className="text-xs text-neutral-500 truncate">
                  {displayHandle}
                </div>
              </div>
            </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-48 bg-white/90 backdrop-blur-xl border border-black/5 rounded-xl shadow-lg mt-2 p-1 z-50 mb-2"
          >
            <DropdownMenuItem
              onClick={() => router.push("/admin/settings")}
              className="cursor-pointer gap-2 py-2 px-3 text-sm font-medium rounded-lg hover:bg-black/5 focus:bg-black/5 outline-none transition-colors"
            >
              <UserIcon className="w-4 h-4" /> My Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (onOpenChangePassword) {
                  onOpenChangePassword();
                } else {
                  router.push("/admin/settings?tab=security");
                }
              }}
              className="cursor-pointer gap-2 py-2 px-3 text-sm font-medium rounded-lg hover:bg-black/5 focus:bg-black/5 outline-none transition-colors"
            >
              <Lock className="w-4 h-4" /> Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-black/5 my-1" />
            <DropdownMenuItem
              disabled={loggingOut}
              onClick={handleSignOut}
              className="cursor-pointer gap-2 py-2 px-3 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 focus:bg-red-50 outline-none transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Signing out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
