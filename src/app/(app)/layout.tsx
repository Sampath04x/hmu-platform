"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UsersIcon, MessageSquareIcon, CalendarIcon, UserIcon, BellIcon, SearchIcon, CoffeeIcon, ShieldCheckIcon, LayoutDashboardIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";
import { ApprovalGuard } from "@/components/ApprovalGuard";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { name, username, aiProfile, role } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

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

  const navItems: NavItem[] = [
    { name: "Home", href: "/home", icon: HomeIcon },
    { name: "Communities", href: "/communities", icon: UsersIcon },
    { name: "Canteens", href: "/canteens", icon: CoffeeIcon },
    { name: "Events", href: "/events", icon: CalendarIcon },
    { name: "Profile", href: "/profile/me", icon: UserIcon },
  ].filter(item => {
    // Clubs can't see Communities/Connect
    if (role === 'club' && item.name === 'Communities') return false;
    return true;
  });

  // Add Admin item if role matches
  const isAdmin = ['super_admin', 'founder', 'moderator', 'junior_moderator'].includes(role);
  if (isAdmin) {
    navItems.push({ name: "Admin", href: "/admin", icon: ShieldCheckIcon });
  }

  return (
    <div className="min-h-screen bg-background pb-[80px] md:pb-0 md:pl-[80px] lg:pl-[240px]">
      {/* Top Bar for Mobile */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border/40 z-40 flex items-center justify-between px-4 md:hidden">
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-dmserif font-bold text-white tracking-widest text-xs">
            intrst
          </div>
          <span className="font-dmserif font-semibold text-lg">intrst</span>
        </Link>
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-white transition-colors">
            <SearchIcon className="w-6 h-6" />
          </button>
          <Link href="/notifications" className="relative text-muted-foreground hover:text-white transition-colors">
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
            )}
          </Link>
        </div>
      </header>

      {/* Side Nav for Desktop */}
      <aside className="fixed top-0 left-0 bottom-0 w-[80px] lg:w-[240px] bg-card/30 border-r border-border/40 z-40 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand shrink-0 flex items-center justify-center font-dmserif font-bold text-white tracking-widest text-xs">
              intrst
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
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${
                  isActive 
                  ? 'bg-brand/10 text-brand font-medium' 
                  : 'text-muted-foreground hover:text-white hover:bg-card'
                } ${item.special ? 'lg:bg-brand/5 lg:border lg:border-brand/20 shadow-[0_0_15px_rgba(194,105,42,0.05)]' : ''}`}
              >
                <div className={`relative flex items-center justify-center ${item.special ? 'w-10 h-10 -ml-1 rounded-full bg-brand text-white shadow-[0_0_15px_rgba(194,105,42,0.4)]' : ''}`}>
                  <item.icon className={item.special ? "w-5 h-5" : "w-6 h-6"} />
                </div>
                <span className="text-base hidden lg:block">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border/40">
          <Link href="/profile/me" className="flex items-center gap-3 w-full hover:bg-card p-2 rounded-xl transition-colors">
            {pathname.includes("/connect") ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(194,105,42,0.3)]">
                  <svg viewBox="0 0 40 40" className="w-6 h-6 fill-white/30">
                    <polygon points="20,5 35,32 5,32" />
                  </svg>
                </div>
                <div className="hidden lg:block overflow-hidden">
                  <div className="font-medium text-sm text-white truncate italic">{aiProfile?.matchCodename || "Anonymous"}</div>
                  <div className="text-[10px] text-brand font-semibold tracking-wider uppercase">Anonymous Mode</div>
                </div>
              </>
            ) : (
              <>
                <Avatar className="w-10 h-10 border border-border shrink-0">
                  <AvatarFallback className="bg-brand/10 text-brand font-bold">{name[0]}</AvatarFallback>
                </Avatar>
                <div className="hidden lg:block overflow-hidden">
                  <div className="font-medium text-sm text-white truncate">{name}</div>
                  <div className="text-xs text-muted-foreground truncate">@{username || name.toLowerCase().replace(/\s+/g, '.')}</div>
                </div>
              </>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="w-full h-full pt-16 md:pt-0 flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen">
        <div className="flex-1">
          <ApprovalGuard>
            {children}
          </ApprovalGuard>
        </div>
        
        {/* Footer */}
        <footer className="w-full py-12 px-6 border-t border-border/40 mt-12 bg-card/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-dmserif font-bold text-white tracking-widest text-xs shadow-[0_0_15px_rgba(194,105,42,0.3)]">
                  intrst
                </div>
                <span className="font-dmserif font-bold text-xl tracking-tight text-white">intrst</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                The honest campus layer for GITAM students. Built for impact, run with integrity.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Platform</h4>
                <ul className="space-y-2 text-sm text-muted-foreground flex flex-col items-center md:items-start font-medium underline-offset-4 decoration-brand/30">
                  <li className="hover:text-white transition-colors hover:underline"><Link href="/home">Home</Link></li>
                  <li className="hover:text-white transition-colors hover:underline"><Link href="/canteens">Canteens</Link></li>
                  <li className="hover:text-white transition-colors hover:underline"><Link href="/events">Events</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground flex flex-col items-center md:items-start font-medium underline-offset-4 decoration-brand/30">
                  <li className="hover:text-white transition-colors hover:underline"><Link href="/about">About Us</Link></li>
                  <li className="hover:text-white transition-colors hover:underline group">
                    <a href="mailto:intrst2026@gmail.com" className="flex items-center gap-2 justify-center md:justify-start">
                        <span>Contact Us</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 md:text-right">Socials</h4>
                <div className="flex items-center gap-4">
                    <a href="https://instagram.com/intrst.in" target="_blank" className="p-2.5 rounded-xl border border-border/40 hover:text-brand hover:border-brand/40 transition-all hover:bg-brand/5">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    <a href="https://github.com/Sampath04x/hmu-platform" target="_blank" className="p-2.5 rounded-xl border border-border/40 hover:text-brand hover:border-brand/40 transition-all hover:bg-brand/5">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold md:text-right">
                    © 2026 intrst.in
                </div>
            </div>
          </div>
        </footer>
      </main>


      {/* Bottom Nav for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-background/90 backdrop-blur-xl border-t border-border/40 z-50 flex items-center justify-around px-2 pb-safe md:hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/connect' || pathname === '/connect' || pathname.startsWith('/connect/'));
          
          if (item.special) {
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center -mt-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(194,105,42,0.4)] transition-transform active:scale-95 ${
                  isActive ? 'bg-accent' : 'bg-brand'
                }`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${isActive ? 'text-brand' : 'text-muted-foreground'}`}>{item.name}</span>
              </Link>
            );
          }

          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-16 gap-1 group">
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-brand/10 text-brand' : 'text-muted-foreground group-hover:text-white'}`}>
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-brand' : 'text-muted-foreground group-hover:text-white'}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
