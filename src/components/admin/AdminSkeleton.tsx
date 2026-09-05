"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function AdminSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200/70 rounded-xl", className)} />;
}

export function AdminPageLoader({ text = "Loading admin workspace..." }: { text?: string }) {
  return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4 py-16">
      <div className="w-10 h-10 rounded-xl bg-white border border-black/10 shadow-sm flex items-center justify-center text-[#0f0f10]">
        <Loader2 className="w-5 h-5 animate-spin text-[#505f78]" />
      </div>
      <p className="text-xs md:text-sm font-medium text-neutral-500 tracking-wide">{text}</p>
    </div>
  );
}
