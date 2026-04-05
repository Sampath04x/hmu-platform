"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Compass, Users, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

interface Question {
  id: string;
  text: string;
  options: { label: string; value: string; icon: any }[];
}

const QUESTIONS: Question[] = [
  {
    id: "weekend",
    text: "How do you recharge after a chaotic week?",
    options: [
      { label: "Solitary flow state", value: "Introvert", icon: Brain },
      { label: "High intensity crowd", value: "Extrovert", icon: Users },
    ]
  },
  {
    id: "campus_spot",
    text: "Where are we most likely to find you?",
    options: [
      { label: "A quiet library corner", value: "Academic", icon: Compass },
      { label: "The loudest canteen", value: "Socialite", icon: Coffee },
    ]
  },
  {
    id: "decision_style",
    text: "When making a choice, you follow your...",
    options: [
      { label: "Logical patterns", value: "Rational", icon: Zap },
      { label: "Gut feeling", value: "Intuitive", icon: Sparkles },
    ]
  }
];

export function PersonalityPrompt({ user_id, onComplete }: { user_id: string, onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<any>({});
  const [isFinishing, setIsFinishing] = useState(false);

  const handleSelect = (value: string) => {
    const newResponses = { ...responses, [QUESTIONS[step].id]: value };
    setResponses(newResponses);
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      finishProfile(newResponses);
    }
  };

  const finishProfile = async (finalResponses: any) => {
    setIsFinishing(true);
    try {
      await apiFetch(`/profiles/${user_id}/personality`, {
        method: "POST",
        body: JSON.stringify({ responses: finalResponses })
      });
      toast.success("Character Profile Built!");
      onComplete();
    } catch (err) {
      toast.error("Failed to save personality data");
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-3xl">
      <div className="absolute inset-0 bg-brand/5 pointer-events-none" />
      
      <Card className="w-full max-w-2xl bg-card/40 border-border/40 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(194,105,42,0.15)] relative">
        <CardContent className="p-12 md:p-16">
          <AnimatePresence mode="wait">
            {!isFinishing ? (
              <motion.div 
                key={step} 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-brand/10 text-brand">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <span className="font-bold tracking-widest text-xs uppercase opacity-60">Character Discovery</span>
                   </div>
                   <div className="text-sm font-medium opacity-40">STEP {step + 1} / {QUESTIONS.length}</div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-dmserif font-bold leading-tight">
                    {QUESTIONS[step].text}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {QUESTIONS[step].options.map((opt) => (
                     <button
                       key={opt.value}
                       onClick={() => handleSelect(opt.value)}
                       className="group flex flex-col items-center justify-center p-8 rounded-[2rem] bg-card border border-border/40 hover:border-brand/60 hover:bg-brand/5 transition-all duration-300 relative overflow-hidden h-48"
                     >
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                        <opt.icon className="w-10 h-10 mb-4 text-muted-foreground group-hover:text-brand transition-colors" />
                        <span className="text-lg font-bold text-white group-hover:text-brand">{opt.label}</span>
                     </button>
                   ))}
                </div>

                <div className="pt-4 flex justify-center">
                   <div className="flex gap-2">
                      {QUESTIONS.map((_, i) => (
                        <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i == step ? 'bg-brand' : 'bg-white/10'}`} />
                      ))}
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-6 py-10"
              >
                 <div className="w-24 h-24 rounded-full bg-brand/20 flex items-center justify-center animate-pulse">
                    <Zap className="w-12 h-12 text-brand" />
                 </div>
                 <h2 className="text-4xl md:text-5xl font-dmserif font-bold">Analysing...</h2>
                 <p className="text-muted-foreground text-lg max-w-sm">Generating your campus identity based on your unique patterns.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to check if need to show
export function usePersonalityGuard(profile: any) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (profile && !profile.has_completed_personality) {
      // Small delay for UX
      setTimeout(() => setShow(true), 2000);
    }
  }, [profile]);

  return { show, setShow };
}

import { Coffee } from "lucide-react"; 
