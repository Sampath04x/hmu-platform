"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { motion } from "framer-motion";

const ADMIN_ROLES = ["super_admin", "founder", "moderator", "junior_moderator"];

export const RoleGuard = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthLoading, isLoggedIn } = useUser();

  const isAdminRoute = pathname.startsWith("/admin");
  const isClubRoute = pathname.startsWith("/club-dashboard");
  const isAdmin = ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isAuthLoading) return;

    // 1. Unauthenticated -> Redirect to /signin for any protected (app) route
    if (!isLoggedIn) {
      router.replace("/signin");
      return;
    }

    // 2. Role-based authorization checks
    if (isAdminRoute && !isAdmin) {
      // User or Club attempting to access /admin
      if (role === "club") {
        router.replace("/club-dashboard");
      } else {
        router.replace("/home");
      }
      return;
    }

    if (isClubRoute && role !== "club") {
      // User or Admin attempting to access /club-dashboard
      if (isAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/home");
      }
      return;
    }
  }, [isAuthLoading, isLoggedIn, role, isAdminRoute, isClubRoute, isAdmin, router]);

  // Loading state while restoring session on refresh
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

  // Not logged in -> Render loading spinner while redirecting to /signin
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"
        />
        <p className="text-xs font-medium text-muted-foreground animate-pulse uppercase tracking-[0.2em]">Redirecting...</p>
      </div>
    );
  }

  // Unauthorized route -> Render loading spinner while redirecting to prevent UI flash
  if ((isAdminRoute && !isAdmin) || (isClubRoute && role !== "club")) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"
        />
        <p className="text-xs font-medium text-muted-foreground animate-pulse uppercase tracking-[0.2em]">Redirecting...</p>
      </div>
    );
  }

  return <>{children}</>;
};
