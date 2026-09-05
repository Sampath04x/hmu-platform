"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AdminCard, AdminCardContent } from "./AdminCard";
import { AdminButton } from "./AdminButton";

interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  insideCard?: boolean;
}

export function AdminErrorState({
  title = "Failed to load data",
  message = "An error occurred while communicating with the server. Please try again.",
  onRetry,
  className,
  insideCard = true,
}: AdminErrorStateProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 md:p-12 space-y-4", className)}>
      <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-sm">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-base md:text-lg font-semibold text-[#0f0f10] font-dmserif">{title}</h4>
        <p className="text-xs md:text-sm text-neutral-500 font-normal leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Request
          </AdminButton>
        </div>
      )}
    </div>
  );

  if (insideCard) {
    return (
      <AdminCard className="border-rose-100">
        <AdminCardContent className="p-0">{content}</AdminCardContent>
      </AdminCard>
    );
  }

  return content;
}
