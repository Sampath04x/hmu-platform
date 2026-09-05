"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HomeIcon, UsersIcon, MessageSquareIcon, CalendarIcon, UserIcon, BellIcon, SearchIcon, CoffeeIcon, ShieldCheckIcon, LayoutDashboardIcon, XIcon, LogOutIcon, LockIcon, Trash2Icon, ClipboardListIcon, CheckCircle2Icon, SettingsIcon, ScrollTextIcon, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";
import { ApprovalGuard } from "@/components/ApprovalGuard";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { FaInstagram, FaGithub } from "react-icons/fa";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";

import { RoleGuard } from "@/components/RoleGuard";

function ProfileMenu({ profileImageUrl, name, username, user_id }: { profileImageUrl: string | null, name: string, username: string, user_id?: string }) {
  const router = useRouter();
  const { handleDeleteAccount, isDeleting } = useDeleteAccount(user_id);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative w-8 h-8 rounded-full overflow-hidden border border-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 transition-all hover:border-black/20 flex shrink-0 items-center justify-center bg-white/50">
        {profileImageUrl ? (
          <img src={profileImageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Avatar className="w-full h-full flex items-center justify-center bg-[#505f78]/10 text-[#505f78]">
            <AvatarFallback className="font-bold text-xs flex items-center justify-center h-full w-full bg-transparent">
              {name ? name[0].toUpperCase() : (username ? username[0].toUpperCase() : "U")}
            </AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white/90 backdrop-blur-xl border border-black/5 rounded-xl shadow-lg mt-2 p-1 z-50">
        <DropdownMenuItem onClick={() => router.push('/profile/me')} className="cursor-pointer gap-2 py-2 px-3 text-sm font-medium rounded-lg hover:bg-black/5 focus:bg-black/5 outline-none transition-colors">
          <UserIcon className="w-4 h-4" /> View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings/password')} className="cursor-pointer gap-2 py-2 px-3 text-sm font-medium rounded-lg hover:bg-black/5 focus:bg-black/5 outline-none transition-colors">
          <LockIcon className="w-4 h-4" /> Change Password
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-black/5 my-1" />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 py-2 px-3 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 focus:bg-red-50 outline-none transition-colors">
          <LogOutIcon className="w-4 h-4" /> Sign Out
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isDeleting} onClick={handleDeleteAccount} className={`cursor-pointer gap-2 py-2 px-3 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 focus:bg-red-50 outline-none transition-colors ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
          <Trash2Icon className="w-4 h-4" /> {isDeleting ? "Deleting..." : "Delete Account"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { name, username, aiProfile, role, user_id, profileImageUrl } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdminRoute = pathname.startsWith("/admin");
  const displayProfileImageUrl = isAdminRoute ? null : profileImageUrl;
  const displayName = isAdminRoute ? "Administrator" : name;
  const displayUsername = isAdminRoute ? "admin" : username;


  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ clubs: any[]; events: any[]; posts: any[] }>({ clubs: [], events: [], posts: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults({ clubs: [], events: [], posts: [] });
      return;
    }
    setIsSearching(true);
    try {
      const { data: clubsData } = await supabase
        .from('profiles')
        .select('user_id, name, profile_image_url, role, bio')
        .eq('role', 'club')
        .ilike('name', `%${query}%`)
        .limit(5);

      const { data: eventsData } = await supabase
        .from('events')
        .select('event_id, title, location, started_at')
        .ilike('title', `%${query}%`)
        .limit(5);

      const { data: postsData } = await supabase
        .from('posts')
        .select('id, content, post_type')
        .ilike('content', `%${query}%`)
        .limit(5);

      setSearchResults({
        clubs: clubsData || [],
        events: eventsData || [],
        posts: postsData || []
      });
    } catch (e) {
      console.error("Search query failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('read_status', false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (e) {
        console.error("Error fetching notification count", e);
      }
    };

    fetchUnreadCount();

    // Subscribe to new notifications
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  interface NavItem {
    name: string;
    href: string;
    icon: any;
    special?: boolean;
    roleRequired?: string[];
  }

  let studentNavItems: NavItem[] = [
    { name: "Home", href: "/home", icon: HomeIcon },
    { name: "Communities", href: "/communities", icon: UsersIcon },
    { name: "Connect", href: "/connect", icon: MessageSquareIcon, special: true },
    { name: "Canteens", href: "/canteens", icon: CoffeeIcon },
    { name: "Events", href: "/events", icon: CalendarIcon },
  ];

  if (role === "club") {
    studentNavItems = [
      { name: "Dashboard", href: "/club-dashboard", icon: LayoutDashboardIcon },
      { name: "Events", href: "/events", icon: CalendarIcon },
      { name: "Canteens", href: "/canteens", icon: CoffeeIcon },
    ];
  }

  // Add Admin item if role matches
  const isAdmin = ['super_admin', 'founder', 'moderator', 'junior_moderator'].includes(role);
  if (isAdmin && !isAdminRoute) {
    studentNavItems.push({ name: "Admin", href: "/admin", icon: ShieldCheckIcon });
  }


  const adminNavItems: NavItem[] = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboardIcon },
    { name: "Clubs", href: "/admin/clubs", icon: ClipboardListIcon },
    { name: "Events", href: "/admin/events", icon: CalendarIcon },
    { name: "Classrooms", href: "/admin/classrooms", icon: Building2 },
    { name: "User Management", href: "/admin/user-management", icon: UsersIcon },
    { name: "Reports", href: "/admin/reports", icon: ScrollTextIcon },
    { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
    { name: "Profile", href: "/admin/profile", icon: UserIcon },
  ];
  const navItems = isAdminRoute ? adminNavItems : studentNavItems;

  if (isAdminRoute) {
    return (
      <RoleGuard>
        <ApprovalGuard>{children}</ApprovalGuard>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard>
      <div className="min-h-screen bg-background pb-[80px] md:pb-0 md:pl-[80px] lg:pl-[240px] relative overflow-x-hidden">
      {/* Background blobs (soft beige) */}
      <div className="pointer-events-none absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30" />
      <div className="pointer-events-none absolute -right-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30" />
      <div className="pointer-events-none absolute top-[35%] left-[-150px] w-[400px] h-[400px] rounded-full bg-[#f3f1eb] blur-[120px] opacity-40" />
      <div className="pointer-events-none absolute top-[60%] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#f0ede6] blur-[110px] opacity-35" />
      {/* Top Bar for Mobile */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/40 backdrop-blur-xl border-b border-black/5 z-40 flex items-center justify-between px-4 md:hidden">
        <Link href={role === "club" ? "/club-dashboard" : "/home"} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-dmserif font-bold text-white tracking-widest text-xs">
            intrst
          </div>
          <span className="font-dmserif font-semibold text-lg">intrst</span>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-muted-foreground hover:text-black transition-colors"
          >
            <SearchIcon className="w-6 h-6" />
          </button>
          <Link href="/notifications" className="relative text-muted-foreground hover:text-black transition-colors">
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
            )}
          </Link>
          <ProfileMenu profileImageUrl={displayProfileImageUrl} name={displayName} username={displayUsername} user_id={isAdminRoute ? undefined : user_id} />
        </div>
      </header>

      {/* Side Nav for Desktop */}
      <aside className="fixed top-0 left-0 bottom-0 w-[80px] lg:w-[240px] bg-white/40 backdrop-blur-xl border-r border-black/5 z-40 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-black/5 shrink-0">
          <Link href={role === "club" ? "/club-dashboard" : "/home"} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand shrink-0 flex items-center justify-center font-dmserif font-bold text-white tracking-widest text-xs">
              i
            </div>
            <span className="font-dmserif font-semibold text-xl hidden lg:block tracking-tight">intrst</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && (item.href !== '/connect' || pathname === '/connect' || pathname.startsWith('/connect/'));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all border ${isActive
                  ? 'bg-white/60 text-black border-black/5 shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-black hover:bg-white/40 border-transparent'
                  } ${item.special ? 'lg:bg-brand/5 lg:border lg:border-brand/20 shadow-sm' : ''}`}
              >
                <div className={`relative flex items-center justify-center ${item.special ? 'w-10 h-10 -ml-1 rounded-full bg-brand text-white shadow-sm' : ''}`}>
                  <item.icon className={item.special ? "w-5 h-5" : "w-6 h-6"} />
                </div>
                <span className="text-base hidden lg:block">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-black/5">
          <Link href="/profile/me" className="flex items-center gap-3 w-full hover:bg-white/60 p-2 rounded-xl border border-transparent hover:border-black/5 hover:shadow-sm transition-all">
            {pathname.includes("/connect") ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/20 to-accent/20 flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 40 40" className="w-6 h-6 fill-black/30">
                    <polygon points="20,5 35,32 5,32" />
                  </svg>
                </div>
                <div className="hidden lg:block overflow-hidden">
                  <div className="font-medium text-sm text-[#0f0f10] truncate italic">{aiProfile?.matchCodename || "Anonymous"}</div>
                  <div className="text-[10px] text-accent font-semibold tracking-wider uppercase">Anonymous Mode</div>
                </div>
              </>
            ) : (
              <>
                {displayProfileImageUrl ? (
                  <img src={displayProfileImageUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-black/5 shrink-0" />
                ) : (
                  <Avatar className="w-10 h-10 border border-black/5 shrink-0">
                    <AvatarFallback className="bg-[#505f78]/10 text-[#505f78] font-bold">{displayName[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                )}
                <div className="hidden lg:block overflow-hidden">
                  <div className="font-medium text-sm text-[#0f0f10] truncate">{displayName}</div>
                  <div className="text-xs text-neutral-500 truncate">@{displayUsername || displayName.toLowerCase().replace(/\s+/g, '.')}</div>
                </div>
              </>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="w-full h-full pt-16 md:pt-0 flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen">
        {/* Desktop Top Nav Search Bar */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/40 backdrop-blur-xl border-b border-black/5 px-8 py-3 items-center justify-between">
          <div className="w-10 h-10" />
          <div
            onClick={() => setIsSearchOpen(true)}
            className="relative w-full max-w-md cursor-pointer group"
          >
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
            <div className="w-full bg-white/60 border border-black/5 rounded-full h-10 pl-11 pr-4 flex items-center text-xs text-neutral-400 font-medium shadow-[0_1px_8px_rgba(0,0,0,0.01)] hover:bg-white hover:border-black/10 transition-all">
              Search clubs, events, posts...
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative text-neutral-500 hover:text-black transition-colors p-2 rounded-full border border-transparent hover:border-black/5 hover:bg-white/60 transition-all shadow-none hover:shadow-sm">
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
              )}
            </Link>
            <ProfileMenu profileImageUrl={displayProfileImageUrl} name={displayName} username={displayUsername} user_id={isAdminRoute ? undefined : user_id} />
          </div>
        </header>
        <div className="flex-1">
          <ApprovalGuard>
            {children}
          </ApprovalGuard>
        </div>

        {/* Footer */}
        <footer className="w-full py-8 px-6 border-t border-black/10 mt-12 bg-transparent">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white font-bold text-xs">
                i
              </div>
              <span className="text-base font-bold tracking-tight text-[#0f0f10]">
                intrst
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-semibold text-neutral-400">
              <Link href={role === "club" ? "/club-dashboard" : "/home"} className="hover:text-black transition-colors">
                {role === "club" ? "Dashboard" : "Home"}
              </Link>

              <Link href="/canteens" className="hover:text-black transition-colors">
                Canteens
              </Link>

              <Link href="/events" className="hover:text-black transition-colors">
                Events
              </Link>

              <span className="text-neutral-200 hidden sm:inline">|</span>

              <Link href="/about" className="hover:text-black transition-colors">
                About Us
              </Link>

              <a
                href="mailto:intrst2026@gmail.com"
                className="hover:text-black transition-colors"
              >
                Contact
              </a>
            </div>

            {/* Socials + Copyright */}
            <div className="flex flex-col items-center lg:items-end gap-3">

              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/intrst.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border border-black/10 bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>

                <a
                  href="https://github.com/Sampath04x/hmu-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border border-black/10 bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center"
                >
                  <FaGithub className="w-5 h-5" />
                </a>
              </div>

              <p className="text-[10px] text-neutral-400 tracking-wide text-center lg:text-right">
                © 2026 intrst. GITAM Campus layer.
              </p>

            </div>

          </div>
        </footer>
      </main>


      {/* Bottom Nav for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-[#faf9f6]/95 backdrop-blur-xl border-t border-black/5 z-50 flex items-center justify-around px-2 pb-safe md:hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/connect' || pathname === '/connect' || pathname.startsWith('/connect/'));

          if (item.special) {
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center -mt-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95 ${isActive ? 'bg-accent' : 'bg-black'
                  }`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${isActive ? 'text-accent' : 'text-neutral-500'}`}>{item.name}</span>
              </Link>
            );
          }

          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-16 gap-1 group">
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-black/5 text-black' : 'text-neutral-500 group-hover:text-black'}`}>
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-black font-semibold' : 'text-neutral-500 group-hover:text-black'}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
      {/* Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-[#faf9f6]/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl border border-black/5 rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            {/* Search Input Box */}
            <div className="relative border-b border-black/5 p-4 flex items-center gap-3 bg-white/40">
              <SearchIcon className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search clubs, events, or posts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#0f0f10] placeholder:text-neutral-400"
                autoFocus
              />
              <button
                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults({ clubs: [], events: [], posts: [] }); }}
                className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-500 font-bold px-2 py-0.5 rounded-md transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Search Results Display Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
              {isSearching ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#505f78] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="text-center py-10 text-neutral-400 text-xs font-medium">
                  Type at least 2 characters to search clubs, events, and posts...
                </div>
              ) : searchResults.clubs.length === 0 && searchResults.events.length === 0 && searchResults.posts.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs font-medium">
                  No matching results found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <>
                  {/* Clubs Section */}
                  {searchResults.clubs.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold tracking-widest text-[#855300] uppercase px-1">Clubs</h4>
                      <div className="space-y-1.5">
                        {searchResults.clubs.map((club) => (
                          <Link
                            key={club.user_id}
                            href={`/profile/${club.user_id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-3 bg-white/40 border border-black/5 hover:border-black/10 rounded-xl hover:bg-white transition-all shadow-[0_1px_8px_rgba(0,0,0,0.01)] hover:shadow-sm"
                          >
                            <div className="w-8 h-8 rounded-lg bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {club.name?.[0] || 'C'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-[#0f0f10] truncate">{club.name}</div>
                              {club.bio && <div className="text-xs text-neutral-500 truncate">{club.bio}</div>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events Section */}
                  {searchResults.events.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold tracking-widest text-[#505f78] uppercase px-1">Events</h4>
                      <div className="space-y-1.5">
                        {searchResults.events.map((evt) => (
                          <Link
                            key={evt.event_id}
                            href={`/events`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center justify-between p-3 bg-white/40 border border-black/5 hover:border-black/10 rounded-xl hover:bg-white transition-all shadow-[0_1px_8px_rgba(0,0,0,0.01)] hover:shadow-sm"
                          >
                            <div className="min-w-0 flex-1 pr-4">
                              <div className="text-sm font-semibold text-[#0f0f10] truncate">{evt.title}</div>
                              <div className="text-xs text-neutral-500 truncate">📍 {evt.location || 'Campus'}</div>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase shrink-0">
                              {evt.started_at ? new Date(evt.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Upcoming'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts Section */}
                  {searchResults.posts.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase px-1">Posts</h4>
                      <div className="space-y-1.5">
                        {searchResults.posts.map((post) => (
                          <Link
                            key={post.id}
                            href={`/home`}
                            onClick={() => setIsSearchOpen(false)}
                            className="block p-3 bg-white/40 border border-black/5 hover:border-black/10 rounded-xl hover:bg-white transition-all shadow-[0_1px_8px_rgba(0,0,0,0.01)] hover:shadow-sm"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase">{post.post_type}</span>
                            </div>
                            <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">{post.content}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
