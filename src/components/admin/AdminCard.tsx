"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function AdminCard({ className, hoverable = false, ...props }: AdminCardProps) {
  return (
    <div
      className={cn(
        "bg-white/60 backdrop-blur-xl border border-black/5 rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.01)] transition-all overflow-hidden",
        hoverable && "hover:bg-white hover:border-black/10 hover:shadow-sm cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

export function AdminCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 md:p-6 border-b border-black/5 space-y-1.5", className)} {...props} />;
}

export function AdminCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base md:text-lg font-dmserif font-semibold tracking-tight text-[#0f0f10]", className)}
      {...props}
    />
  );
}

export function AdminCardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs md:text-sm text-muted-foreground font-normal leading-relaxed", className)} {...props} />;
}

export function AdminCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 md:p-6", className)} {...props} />;
}

export function AdminCardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 md:p-6 border-t border-black/5 bg-white/40 flex items-center justify-between gap-4", className)} {...props} />;
}
