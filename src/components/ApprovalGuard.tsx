"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlertIcon, ClockIcon, MailIcon, LogOutIcon, CheckCircle2Icon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export const ApprovalGuard = ({ children }: { children: React.ReactNode }) => {
  const { role, isApproved, isSuspended, isAuthLoading, isLoggedIn } = useUser();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"
        />
        <p className="text-xs font-medium text-muted-foreground animate-pulse uppercase tracking-[0.2em]">Authenticating...</p>
      </div>
    );
  }

  // If not logged in, just show children (likely the auth pages)
  if (!isLoggedIn) return <>{children}</>;

  // CASE: Suspended
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full relative z-10"
        >
          <Card className="p-10 border-rose-500/20 bg-card/40 backdrop-blur-3xl text-center space-y-8 shadow-[0_0_50px_-12px_rgba(244,63,94,0.15)] rounded-[2.5rem]">
            <div className="relative inline-block">
               <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-500/20 shadow-inner">
                  <ShieldAlertIcon className="w-12 h-12 text-rose-500" />
               </div>
               <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full blur-[2px]" 
               />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-dmserif font-bold text-white tracking-tight">Access Restricted</h1>
              <p className="text-muted-foreground leading-relaxed text-sm antialiased">
                Your account has been suspended for violating our campus guidelines. This measure ensures a safe and respectful environment for everyone.
              </p>
            </div>
            
            <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
               <Button 
                 variant="outline" 
                 className="w-full h-12 rounded-2xl flex items-center gap-2 hover:bg-rose-500/5 hover:text-rose-500 transition-all duration-300" 
                 onClick={() => window.location.href = "mailto:intrst2026@gmail.com"}
               >
                  <MailIcon className="w-4 h-4" /> Appeal Decision
               </Button>
               <Button 
                 variant="ghost" 
                 className="w-full text-muted-foreground/60 hover:text-white" 
                 onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
               >
                  <LogOutIcon className="w-4 h-4" /> Sign Out
               </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // CASE: Club Pending Approval
  if (role === 'club' && !isApproved) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 overflow-hidden relative">
        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
                opacity: [0.15, 0.2, 0.15]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand/30 blur-[150px] rounded-full"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -10, 0],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full"
            />
        </div>

        <motion.div
           initial={{ opacity: 0, y: 30, scale: 0.95 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           transition={{ duration: 0.6, cubicBezier: [0.22, 1, 0.36, 1] }}
           className="max-w-xl w-full relative z-10"
        >
          <Card className="p-12 border-white/5 bg-white/[0.03] backdrop-blur-[40px] text-center space-y-10 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 rounded-[3rem]">
            <div className="relative inline-block group">
               <motion.div 
                  animate={{ 
                    boxShadow: ["0 0 20px rgba(var(--brand-rgb), 0)", "0 0 40px rgba(var(--brand-rgb), 0.2)", "0 0 20px rgba(var(--brand-rgb), 0)"] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-28 h-28 bg-brand/10 rounded-[2.8rem] flex items-center justify-center mx-auto border border-brand/20 relative shadow-2xl"
               >
                 <ClockIcon className="w-14 h-14 text-brand group-hover:rotate-12 transition-transform duration-500" />
               </motion.div>
               
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.4 }}
                 className="absolute -bottom-2 -right-4"
               >
                 <Badge className="bg-brand text-white border-[3px] border-background px-4 py-1.5 text-[10px] font-black tracking-widest uppercase shadow-xl skew-x-[-12deg]">
                   Under Review
                 </Badge>
               </motion.div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-dmserif font-bold text-white tracking-tight leading-[1.1]">Your Club is in the <span className="text-brand">Spotlight</span></h1>
              <p className="text-muted-foreground/80 text-[15px] leading-relaxed max-w-sm mx-auto antialiased">
                Quality takes time. Our team is hand-verifying your application to ensure your club gets the best start possible on HMU.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left pt-2">
               {[
                 { title: "ID Verification", desc: "GITAM domain validation", status: "Finished", icon: CheckCircle2Icon },
                 { title: "Final Approval", desc: "Admin identity sweep", status: "In Progress", icon: ClockIcon }
               ].map((step, i) => (
                 <motion.div 
                   key={i} 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.5 + (i * 0.15) }}
                   className={`p-5 rounded-[1.5rem] border transition-all duration-300 ${
                     step.status === 'Finished' 
                       ? 'bg-brand/5 border-brand/20' 
                       : 'bg-white/[0.02] border-white/5'
                   }`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <div className={`p-2 rounded-xl scale-75 origin-top-left ${step.status === 'Finished' ? 'bg-brand/10 text-brand' : 'bg-white/5 text-white/40'}`}>
                          <step.icon className="w-5 h-5" />
                       </div>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                         step.status === 'Finished' ? 'bg-brand/20 text-brand' : 'bg-white/10 text-white/40'
                       }`}>
                         {step.status}
                       </span>
                    </div>
                    <div className="space-y-0.5 px-1">
                      <p className="text-xs font-bold text-white/90">{step.title}</p>
                      <p className="text-[10px] text-muted-foreground/60">{step.desc}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
               <div className="flex items-center justify-center gap-2 group">
                 <div className="w-1 h-1 bg-brand rounded-full group-hover:scale-150 transition-transform" />
                 <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest">Awaiting dispatch (24-48h)</p>
                 <div className="w-1 h-1 bg-brand rounded-full group-hover:scale-150 transition-transform" />
               </div>
               
               <div className="flex items-center gap-4">
                 <Button 
                   variant="outline" 
                   className="flex-1 h-12 rounded-2xl border-white/10 hover:bg-white/5 hover:border-brand/40 transition-all group" 
                   onClick={() => window.location.href = "mailto:intrst2026@gmail.com"}
                 >
                    <MailIcon className="w-4 h-4 mr-2 group-hover:text-brand transition-colors" /> Help Center
                 </Button>
                 <Button 
                   variant="ghost" 
                   className="px-6 h-12 rounded-2xl text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/5 transition-all" 
                   onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                 >
                    <LogOutIcon className="w-4 h-4" />
                 </Button>
               </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Approved users or non-clubs get through
  return <>{children}</>;
};
