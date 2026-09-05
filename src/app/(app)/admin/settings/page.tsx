"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 relative z-10">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-dmserif font-bold tracking-tight text-[#0f0f10] mb-3">
          Settings
        </h1>
        <p className="text-neutral-500 text-lg font-medium">
          Configure global platform parameters.
        </p>
      </header>

      <Card className="bg-white border border-black/5 rounded-[2rem] overflow-hidden shadow-sm">
        <CardContent className="p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#f3f1eb] flex items-center justify-center text-neutral-400 mb-2">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0f0f10]">Coming Soon</h2>
          <p className="text-neutral-500 font-medium max-w-md">
            This module will be implemented during the Admin functionality phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
