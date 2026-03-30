"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CameraIcon, ChevronLeftIcon, SparkleIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";

const ALL_INTERESTS = [
  "Photography", "Music", "Gaming", "Anime", "Fitness", "Coding",
  "Chess", "Poetry", "Cooking", "Hiking", "Debate", "Film",
  "Books", "Startups", "Art", "Football", "Cricket", "Finance",
  "Psychology", "Philosophy", "Design", "Memes", "Cafe Hopping",
  "Open Mic", "Esports", "AI / ML", "Writing", "Robotics",
  "Cycling", "Yoga", "Dance", "Travel", "Journaling",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { name, setName, interests: selectedTags, setInterests: setSelectedTags, aiProfile, setIsLoggedIn } = useUser();
  const [bio, setBio] = useState("");

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 10) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-10 p-4">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Progress */}
        <header className="flex items-center gap-4 mb-8">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="p-2 bg-card rounded-full hover:bg-card/80 transition-colors border border-border">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-card rounded-full overflow-hidden border border-border/30">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </header>

        {/* AI Profile Banner */}
        {aiProfile && step === 1 && (
          <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-2">
            <SparkleIcon className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-indigo-300 text-sm font-semibold">AI profile ready: <span className="text-white">{aiProfile.personalityType}</span></p>
              <p className="text-indigo-400/70 text-xs mt-0.5">Interests pre-filled from your discovery session · Codename: {aiProfile.matchCodename}</p>
            </div>
          </div>
        )}

        {/* Step 1 — Your Profile */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-sora font-semibold">Your Profile</h1>
              <p className="text-muted-foreground">This is how you appear to connections.</p>
            </div>

            <div className="flex justify-center py-2">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full bg-card border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-indigo-500/50 transition-colors">
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-indigo-400 transition-colors">
                    <CameraIcon className="w-7 h-7" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Upload</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input 
                  placeholder="e.g. Priya S." 
                  className="h-12 bg-card rounded-xl border-border focus-visible:ring-indigo-500" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <select className="flex h-12 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {["CSE", "ECE", "Mechanical", "Civil", "EEE", "IT", "Chemical", "Biotech"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <select className="flex h-12 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Bio</label>
                <Textarea
                  placeholder="What's your vibe?"
                  className="min-h-24 bg-card rounded-xl resize-none focus-visible:ring-indigo-500"
                  maxLength={200}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
                <p className="text-xs text-right text-muted-foreground">{bio.length}/200</p>
              </div>
            </div>

            <Button className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-base font-semibold" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {/* Step 2 — Interests */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-left space-y-1">
              <h1 className="text-3xl font-sora font-semibold">What are you into?</h1>
              <p className="text-muted-foreground">
                Pick up to 10. {selectedTags.length > 0 && aiProfile
                  ? <span className="text-indigo-400 font-medium">Pre-filled from your AI session ✓</span>
                  : "This powers our AI matching."
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {ALL_INTERESTS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isSelected
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                        : "bg-card border-border text-foreground hover:border-indigo-500/30 hover:bg-card/80"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-base font-semibold"
              onClick={() => setStep(3)}
              disabled={selectedTags.length === 0}
            >
              Continue ({selectedTags.length}/10 selected)
            </Button>
          </div>
        )}

        {/* Step 3 — Three Questions */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-left space-y-1">
              <h1 className="text-3xl font-sora font-semibold">Three quick ones.</h1>
              <p className="text-muted-foreground">Only used for AI matching. Never shown publicly.</p>
            </div>

            <div className="space-y-5">
              {[
                { label: "What&apos;s something most people don&apos;t know about you?" },
                { label: "What are you actually trying to figure out right now?" },
                { label: "What kind of person do you click with?" },
              ].map((q, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-sm font-medium text-indigo-100" dangerouslySetInnerHTML={{ __html: q.label }} />
                  <Textarea className="min-h-[90px] bg-card rounded-xl border-border resize-none focus-visible:ring-indigo-500" maxLength={150} />
                </div>
              ))}
            </div>

            <Button className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-base font-semibold" onClick={() => setStep(4)}>
              Continue
            </Button>
          </div>
        )}

        {/* Step 4 — Privacy */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-left space-y-1">
              <h1 className="text-3xl font-sora font-semibold">Your privacy, your rules.</h1>
              <p className="text-muted-foreground">You can change these anytime in settings.</p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Show my photo to non-connections", default: false },
                { label: "Show my department", default: true },
                { label: "Show my year", default: true },
                { label: "Allow message requests from anyone", default: false },
                { label: "Enable girls-first protection", desc: "Only people who&apos;ve interacted with your content can message you first", default: true },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-start p-4 bg-card border border-border rounded-xl">
                  <div className="flex-1 pr-5">
                    <h3 className="font-medium text-foreground text-sm" dangerouslySetInnerHTML={{ __html: item.label }} />
                    {item.desc && <p className="text-xs text-muted-foreground mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.desc }} />}
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${item.default ? "bg-indigo-500" : "bg-muted"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.default ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </div>

            <Button
              className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-base font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              onClick={() => {
                setIsLoggedIn(true);
                router.push("/home");
              }}
            >
              Finish Setup →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
