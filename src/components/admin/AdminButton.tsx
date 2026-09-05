"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type AdminButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "success"
  | "accent"
  | "ghost";

export type AdminButtonSize = "sm" | "md" | "lg" | "icon";

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    let variantStyles = "bg-[#0f0f10] text-white hover:bg-neutral-800 shadow-sm";

    switch (variant) {
      case "primary":
        variantStyles = "bg-[#0f0f10] text-white hover:bg-neutral-800 shadow-sm";
        break;
      case "secondary":
        variantStyles =
          "bg-white text-[#0f0f10] border border-black/10 hover:bg-neutral-50 shadow-[0_1px_4px_rgba(0,0,0,0.01)]";
        break;
      case "destructive":
        variantStyles =
          "bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 shadow-none";
        break;
      case "success":
        variantStyles =
          "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 shadow-none";
        break;
      case "accent":
        variantStyles =
          "bg-[#505f78]/10 text-[#505f78] border border-[#505f78]/20 hover:bg-[#505f78]/20 shadow-none";
        break;
      case "ghost":
        variantStyles = "bg-transparent text-[#0f0f10] hover:bg-black/5 shadow-none border-transparent";
        break;
    }

    let sizeStyles = "px-4 py-2 text-sm rounded-xl";
    switch (size) {
      case "sm":
        sizeStyles = "px-3 py-1.5 text-xs rounded-lg gap-1.5";
        break;
      case "md":
        sizeStyles = "px-4 py-2 text-sm rounded-xl gap-2";
        break;
      case "lg":
        sizeStyles = "px-5 py-2.5 text-base rounded-xl gap-2.5";
        break;
      case "icon":
        sizeStyles = "w-9 h-9 p-0 flex items-center justify-center rounded-xl";
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shrink-0",
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

AdminButton.displayName = "AdminButton";
