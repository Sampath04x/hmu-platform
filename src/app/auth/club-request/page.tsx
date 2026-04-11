"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Send, CheckCircle2, ArrowLeft, Trophy, Users, Star } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";

export default function ClubRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    club_name: "",
    club_email: "",
    president_name: "",
    category: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (!formData.club_name || !formData.club_email || !formData.president_name) {
      setError("Club name, email, and president name are required.");
      setLoading(false);
      return;
    }

    try {
      await apiFetch("/auth/club-request", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
        
        <Card className="w-full max-w-lg z-10 border-emerald-500/30 bg-zinc-950/50 backdrop-blur-xl shadow-2xl p-8 text-center space-y-8 rounded-[3rem]">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
          <div className="space-y-4">
             <h1 className="text-4xl font-dmserif font-bold text-white">Application Received!</h1>
             <p className="text-zinc-400 text-lg leading-relaxed">
               Thank you for your interest in joining the HMU community. Our team will review your application for <strong>{formData.club_name}</strong> and get back to you at <strong>{formData.club_email}</strong>.
             </p>
          </div>
          <div className="pt-4 border-t border-emerald-500/10">
             <Link href="/signin">
               <Button className="rounded-full h-14 px-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold group">
                 Back to Login
               </Button>
             </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100">
      {/* Left side: branding/info */}
      <div className="w-full md:w-1/2 lg:w-2/5 p-8 md:p-16 flex flex-col justify-center space-y-12 relative overflow-hidden border-r border-white/5">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-[150%] h-[150%] bg-gradient-radial from-brand/20 to-transparent blur-[120px]"></div>
        </div>

        <Link href="/" className="inline-flex items-center gap-2 group text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-semibold uppercase tracking-widest">Back Home</span>
        </Link>
        
        <div className="space-y-6 relative">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-8 box-shadow-[0_0_30px_rgba(194,105,42,0.2)]">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-5xl lg:text-7xl font-dmserif font-bold tracking-tight leading-[1.1]">
            Elevate Your <br />
            <span className="text-brand italic">Club's Presence.</span>
          </h1>
          <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-md">
            The HMU Platform is exclusive Gitam community for clubs to host events, engage with members, and grow their influence.
          </p>
        </div>

        <div className="space-y-8 pt-8 border-t border-white/5 relative">
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                 <Users className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-1">Engage Students</h3>
                 <p className="text-sm text-zinc-500">Reach a wider audience and get more registrations for your events.</p>
              </div>
           </div>
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                 <Star className="w-5 h-5 fill-brand" />
              </div>
              <div>
                 <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-1">Official Verification</h3>
                 <p className="text-sm text-zinc-500">Get the blue checkmark and official status on campus.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Right side: Request Form */}
      <div className="w-full md:w-1/2 lg:w-3/5 p-8 md:p-16 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-y-auto">
        <Card className="w-full max-w-xl border-zinc-800 bg-zinc-900/40 backdrop-blur-xl shadow-2xl p-6 sm:p-10 rounded-[2.5rem]">
           <CardHeader className="p-0 mb-8">
              <CardTitle className="text-3xl font-dmserif font-bold text-white mb-2">Request Access</CardTitle>
              <CardDescription className="text-zinc-400">Please provide your club details for manual verification.</CardDescription>
           </CardHeader>
           <CardContent className="p-0">
              <form onSubmit={handleRequest} className="space-y-6">
                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="club_name" className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Club Name</Label>
                    <Input
                      id="club_name"
                      name="club_name"
                      placeholder="e.g. Code Wizards"
                      value={formData.club_name}
                      onChange={handleChange}
                      className="bg-zinc-950 border-zinc-800 rounded-xl h-12 h-14"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club_email" className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Contact Email</Label>
                    <Input
                      id="club_email"
                      name="club_email"
                      type="email"
                      placeholder="club@gitam.in"
                      value={formData.club_email}
                      onChange={handleChange}
                      className="bg-zinc-950 border-zinc-800 rounded-xl h-14"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="president_name" className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">President / Representative Name</Label>
                  <Input
                    id="president_name"
                    name="president_name"
                    placeholder="Full Name"
                    value={formData.president_name}
                    onChange={handleChange}
                    className="bg-zinc-950 border-zinc-800 rounded-xl h-14"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Club Category</Label>
                  <select 
                    id="category" 
                    name="category"
                    value={formData.category}
                    onChange={(e: any) => setFormData({...formData, category: e.target.value})}
                    className="flex h-14 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 outline-none ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a category</option>
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Literary">Literary</option>
                    <option value="Social Service">Social Service</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Short Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Briefly describe your club's mission and regular activities..."
                    value={formData.description}
                    onChange={handleChange}
                    className="bg-zinc-950 border-zinc-800 rounded-xl min-h-[120px]"
                  />
                </div>

                <Button
                  className="w-full bg-brand hover:bg-accent text-white font-bold h-14 rounded-xl transition-all shadow-lg hover:shadow-brand/20 group"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      Send Join Request <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
           </CardContent>
           <CardFooter className="p-0 mt-8 justify-center">
              <p className="text-sm text-zinc-500">
                 Already verified? <Link href="/signin" className="text-brand font-bold underline hover:text-white transition-colors">Sign in here</Link>
              </p>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}
