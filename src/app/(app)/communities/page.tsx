"use client";

import Link from "next/link";
import { SearchIcon, CheckCircle2Icon, UsersIcon, Building2, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function CommunitiesPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const data = await apiFetch('/profiles?role=club&is_approved=true');
      setClubs(data);
    } catch (error) {
      console.error("Failed to fetch clubs:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background relative pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-dmserif font-semibold text-white">Communities</h1>
        <p className="text-muted-foreground">Find where you belong on campus.</p>
        
        {/* Featured: Vacant Classrooms */}

      </div>

      <div className="relative mb-10 text-white focus-within:text-white group">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-brand transition-colors" />
        <Input 
          type="text" 
          placeholder="Search clubs, groups, interests..." 
          className="pl-12 h-14 bg-card border-border rounded-xl focus-visible:ring-brand font-medium placeholder:font-normal text-base shadow-[0_0_20px_rgba(0,0,0,0.2)] group-focus-within:shadow-[0_0_20px_rgba(139,139,67,0.1)] transition-all"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : (
        <>
          {/* Trending on Campus */}
          <section className="mb-12">
            <h2 className="text-xl font-dmserif font-semibold mb-4">Official Clubs & Communities</h2>
            {clubs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No communities found at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map(club => (
                  <Card key={club.user_id} className="overflow-hidden bg-card border-border/50 glow-hover group relative">
                    <Link href={`/profile/${club.user_id}`} className="absolute inset-0 z-10" aria-label={`View ${club.name}`}></Link>
                    
                    <div className="h-24 bg-gradient-to-br from-brand/20 to-accent/5 group-hover:from-brand/30 transition-colors relative">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    </div>
                    
                    <div className="px-5 pb-5 pt-0 relative z-20">
                      <div className="flex justify-between items-end mb-3">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand to-accent text-white font-bold text-2xl flex items-center justify-center -mt-8 border-[4px] border-card shadow-lg ring-1 ring-border overflow-hidden">
                          {club.profile_image_url ? (
                            <img src={club.profile_image_url} alt={club.name} className="w-full h-full object-cover" />
                          ) : (
                            club.name?.[0] || '?'
                          )}
                        </div>
                        <Button className="h-8 px-5 text-xs bg-brand hover:bg-brand/90 font-semibold z-30 pointer-events-auto shadow-[0_0_10px_rgba(139,139,67,0.3)] pointer-events-none">View</Button>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-dmserif font-semibold text-lg text-white group-hover:text-brand transition-colors leading-tight">{club.name}</h3>
                        <CheckCircle2Icon className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span className="bg-muted/50 px-2 py-1 rounded-md text-foreground font-medium">
                          {club.club_metadata?.category || "Community"}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-3.5 h-3.5" />
                          {/* Fetch real followers count or just a placeholder */}
                          {club.followers_count || 0}
                        </span>
                      </div>
                      
                      {club.bio && (
                         <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                           {club.bio}
                         </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>


        </>
      )}
    </div>
  );
}
