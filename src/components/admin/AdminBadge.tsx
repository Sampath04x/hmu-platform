"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type AdminBadgeStatus =
  | "pending"
  | "approved"
  | "active"
  | "rejected"
  | "inactive"
  | "under_review"
  | "warning"
  | "info";

interface AdminBadgeProps {
  status?: AdminBadgeStatus;
  children?: React.ReactNode;
  className?: string;
}

export function AdminBadge({ status = "pending", children, className }: AdminBadgeProps) {
  let badgeStyles = "bg-amber-50 text-amber-800 border-amber-200/80";
  let defaultLabel = "Pending";

  switch (status) {
    case "pending":
      badgeStyles = "bg-amber-50 text-amber-800 border-amber-200/80";
      defaultLabel = "Pending";
      break;
    case "approved":
    case "active":
      badgeStyles = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
      defaultLabel = status === "approved" ? "Approved" : "Active";
      break;
    case "rejected":
    case "inactive":
      badgeStyles = "bg-rose-50 text-rose-800 border-rose-200/80";
      defaultLabel = status === "rejected" ? "Rejected" : "Inactive";
      break;
    case "under_review":
      badgeStyles = "bg-slate-100 text-slate-800 border-slate-200";
      defaultLabel = "Under Review";
      break;
    case "warning":
      badgeStyles = "bg-amber-100 text-amber-900 border-amber-300";
      defaultLabel = "Warning";
      break;
    case "info":
      badgeStyles = "bg-sky-50 text-sky-800 border-sky-200/80";
      defaultLabel = "Info";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors shrink-0",
        badgeStyles,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children || defaultLabel}
    </span>
  );
}
