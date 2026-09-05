"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const buttonClickInteraction = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98, y: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 15 }
};

export default function ClubRequestSubmittedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#faf9f6] text-[#0f0f10] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
        <div className="absolute -right-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className="w-full border border-black/5 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.03)] p-8 text-center space-y-6 rounded-[32px]">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-[#855300]/10 border border-[#855300]/20 flex items-center justify-center text-[#855300]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-dmserif font-bold text-[#0f0f10]">Request Submitted!</h1>
            <div className="text-neutral-500 text-xs sm:text-sm leading-relaxed space-y-3">
              <p>Your request has been submitted successfully. You&apos;ll receive an email once your club has been reviewed. If approved, the email will contain a secure one-time setup link to activate your club account.</p>
              <p className="italic text-[10.5px] text-neutral-400 mt-2">No account has been created yet.</p>
            </div>
          </div>
          <div className="pt-6 border-t border-black/5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto">
              <motion.div {...buttonClickInteraction} className="w-full">
                <Button className="w-full rounded-full h-11 px-8 bg-black hover:bg-[#505f78] text-white font-bold">
                  Return Home
                </Button>
              </motion.div>
            </Link>
            <Link href="/signin" className="w-full sm:w-auto">
              <motion.div {...buttonClickInteraction} className="w-full">
                <Button variant="outline" className="w-full rounded-full h-11 px-8 border-[#c5c6cd] hover:bg-neutral-100 text-[#0f0f10] font-bold">
                  Back to Login
                </Button>
              </motion.div>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
