"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  UserIcon,
  Lock,
  LogOut
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
import { ADMIN_NAV_ITEMS } from "./AdminSidebar";
import { toast } from "sonner";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
  onOpenChangePassword?: () => void;
}

export function AdminHeader({ onMenuToggle, onOpenChangePassword }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, username, profileImageUrl } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ clubs: any[]; users: any[]; events: any[] }>({
    clubs: [],
    users: [],
    events: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  const displayName = name || "Administrator";
  const displayHandle = username ? `@${username}` : "@admin";

  const currentItem = ADMIN_NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const breadcrumbTitle = currentItem ? currentItem.name : "Dashboard";

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("read_status", false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (e) {
        console.error("Failed to fetch notification count", e);
      }
    };
    fetchNotifications();
  }, []);

  const handleGlobalSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults({ clubs: [], users: [], events: [] });
      return;
    }
    setIsSearching(true);
    try {
      const { data: usersData } = await supabase
        .from("profiles")
        .select("user_id, name, username, email, role")
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(5);

      const { data: eventsData } = await supabase
        .from("events")
        .select("event_id, title, location, status")
        .ilike("title", `%${query}%`)
        .limit(5);

      setSearchResults({
        clubs: (usersData || []).filter((u: any) => u.role === "club"),
        users: (usersData || []).filter((u: any) => u.role !== "club"),
        events: eventsData || [],
      });
    } catch (e) {
      console.error("Admin search query failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/signin");
    } catch (err: any) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/40 backdrop-blur-xl border-b border-black/5 px-8 py-3 h-16 flex items-center justify-between">
        {/* Left: Mobile Menu & Subtle Section Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-neutral-600 hover:text-black hover:bg-white/60 transition-colors"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
            <span className="text-neutral-400 font-semibold">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-[#0f0f10] font-bold">{breadcrumbTitle}</span>
          </div>
        </div>

        {/* Center: Search Field Matching Student Home */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="relative w-full max-w-md cursor-pointer group hidden sm:block"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
          <div className="w-full bg-white/60 border border-black/5 rounded-full h-10 pl-11 pr-4 flex items-center text-xs text-neutral-400 font-medium shadow-[0_1px_8px_rgba(0,0,0,0.01)] hover:bg-white hover:border-black/10 transition-all">
            Search admin records, users, clubs...
          </div>
        </div>

        {/* Right Actions: Notifications & Avatar Dropdown */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden text-neutral-500 hover:text-black transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/admin/reports")}
            className="relative text-neutral-500 hover:text-black transition-colors p-2 rounded-full border border-transparent hover:border-black/5 hover:bg-white/60 transition-all shadow-none hover:shadow-sm"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border border-white"></span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative w-8 h-8 rounded-full overflow-hidden border border-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 transition-all hover:border-black/20 flex shrink-0 items-center justify-center bg-white/50">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <Avatar className="w-full h-full flex items-center justify-center bg-[#505f78]/10 text-[#505f78]">
                    <AvatarFallback className="font-bold text-xs flex items-center justify-center h-full w-full bg-transparent">
                      {displayName[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white/90 backdrop-blur-xl border border-black/5 rounded-xl shadow-lg mt-2 p-1 z-50"
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
                onClick={handleSignOut}
                className="cursor-pointer gap-2 py-2 px-3 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 focus:bg-red-50 outline-none transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-[#faf9f6]/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl border border-black/5 rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            <div className="relative border-b border-black/5 p-4 flex items-center gap-3 bg-white/40">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search admin records, users, clubs..."
                value={searchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#0f0f10] placeholder:text-neutral-400"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-500 font-bold px-2 py-0.5 rounded-md transition-colors"
              >
                ESC
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {isSearching ? (
                <div className="text-center py-8 text-xs text-neutral-400 font-medium">Searching...</div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="text-center py-8 text-xs text-neutral-400 font-medium">
                  Type at least 2 characters to search...
                </div>
              ) : searchResults.users.length === 0 && searchResults.clubs.length === 0 && searchResults.events.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-400 font-medium">
                  No matching records found.
                </div>
              ) : (
                <>
                  {searchResults.users.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-[#505f78] uppercase tracking-wider px-1">Users</div>
                      {searchResults.users.map((u) => (
                        <div
                          key={u.user_id}
                          onClick={() => {
                            router.push(`/admin/user-management?search=${u.email || u.name}`);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/60 cursor-pointer border border-transparent hover:border-black/5 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-[10px] font-bold bg-slate-100 text-slate-700">
                                {u.name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-xs font-semibold text-[#0f0f10]">{u.name}</div>
                              <div className="text-[11px] text-neutral-400">{u.email}</div>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.clubs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-[#855300] uppercase tracking-wider px-1">Clubs</div>
                      {searchResults.clubs.map((c) => (
                        <div
                          key={c.user_id}
                          onClick={() => {
                            router.push(`/admin/clubs?search=${c.name}`);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/60 cursor-pointer border border-transparent hover:border-black/5 transition-all"
                        >
                          <div className="text-xs font-semibold text-[#0f0f10]">{c.name}</div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            Club
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.events.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider px-1">Events</div>
                      {searchResults.events.map((evt) => (
                        <div
                          key={evt.event_id}
                          onClick={() => {
                            router.push(`/admin/events?search=${evt.title}`);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/60 cursor-pointer border border-transparent hover:border-black/5 transition-all"
                        >
                          <div className="text-xs font-semibold text-[#0f0f10]">{evt.title}</div>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                            Event
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
