"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { AdminCard, AdminCardContent } from "./AdminCard";

interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  insideCard?: boolean;
}

export function AdminEmptyState({
  icon = <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
  title = "No pending approvals",
  description = "Everything is up to date.",
  action,
  className,
  insideCard = true,
}: AdminEmptyStateProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 md:p-12 space-y-3", className)}>
      <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 border border-black/5 shadow-inner">
        {icon}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-base font-semibold text-[#0f0f10] font-dmserif">{title}</h4>
        <p className="text-xs text-neutral-500 font-normal leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );

  if (insideCard) {
    return (
      <AdminCard>
        <AdminCardContent className="p-0">{content}</AdminCardContent>
      </AdminCard>
    );
  }

  return content;
}
