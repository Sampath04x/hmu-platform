"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  action,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("space-y-3 pb-2 border-b border-black/5 mb-6 md:mb-8", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-dmserif font-bold tracking-tight text-[#0f0f10]">
            {title}
          </h1>
          {description && (
            <p className="text-xs md:text-sm text-neutral-500 font-medium max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}
