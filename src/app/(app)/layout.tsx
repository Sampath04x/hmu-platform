"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UsersIcon, MessageSquareIcon, CalendarIcon, UserIcon, BellIcon, SearchIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { name, aiProfile } = useUser();

  const navItems = [
    { name: "Home", href: "/home", icon: HomeIcon },
    { name: "Communities", href: "/communities", icon: UsersIcon },
    { name: "Connect", href: "/connect", icon: MessageSquareIcon, special: true },
    { name: "Events", href: "/events", icon: CalendarIcon },
    { name: "Profile", href: "/profile/me", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-background pb-[80px] md:pb-0 md:pl-[80px] lg:pl-[240px]">
      {/* Top Bar for Mobile */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border/40 z-40 flex items-center justify-between px-4 md:hidden">
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-sora font-bold text-white tracking-widest text-xs">
            HMU
          </div>
          <span className="font-sora font-semibold text-lg">HMU</span>
        </Link>
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-white transition-colors">
            <SearchIcon className="w-6 h-6" />
          </button>
          <Link href="/notifications" className="relative text-muted-foreground hover:text-white transition-colors">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
          </Link>
        </div>
      </header>

      {/* Side Nav for Desktop */}
      <aside className="fixed top-0 left-0 bottom-0 w-[80px] lg:w-[240px] bg-card/30 border-r border-border/40 z-40 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 shrink-0 flex items-center justify-center font-sora font-bold text-white tracking-widest text-xs">
              HMU
            </div>
            <span className="font-sora font-semibold text-xl hidden lg:block tracking-tight">HMU</span>
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
                  ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
                  : 'text-muted-foreground hover:text-white hover:bg-card'
                } ${item.special ? 'lg:bg-indigo-500/5 lg:border lg:border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : ''}`}
              >
                <div className={`relative flex items-center justify-center ${item.special ? 'w-10 h-10 -ml-1 rounded-full bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : ''}`}>
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                  <svg viewBox="0 0 40 40" className="w-6 h-6 fill-white/30">
                    <polygon points="20,5 35,32 5,32" />
                  </svg>
                </div>
                <div className="hidden lg:block overflow-hidden">
                  <div className="font-medium text-sm text-white truncate italic">{aiProfile?.matchCodename || "Anonymous"}</div>
                  <div className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Anonymous Mode</div>
                </div>
              </>
            ) : (
              <>
                <Avatar className="w-10 h-10 border border-border shrink-0">
                  <AvatarFallback className="bg-indigo-500/10 text-indigo-400 font-bold">{name[0]}</AvatarFallback>
                </Avatar>
                <div className="hidden lg:block overflow-hidden">
                  <div className="font-medium text-sm text-white truncate">{name}</div>
                  <div className="text-xs text-muted-foreground truncate">@{name.toLowerCase().replace(/\s+/g, '.')}</div>
                </div>
              </>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="w-full h-full pt-16 md:pt-0">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-background/90 backdrop-blur-xl border-t border-border/40 z-50 flex items-center justify-around px-2 pb-safe md:hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/connect' || pathname === '/connect' || pathname.startsWith('/connect/'));
          
          if (item.special) {
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center -mt-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-transform active:scale-95 ${
                  isActive ? 'bg-indigo-400' : 'bg-indigo-500'
                }`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${isActive ? 'text-indigo-400' : 'text-muted-foreground'}`}>{item.name}</span>
              </Link>
            );
          }

          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-16 gap-1 group">
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-muted-foreground group-hover:text-white'}`}>
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-white'}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
