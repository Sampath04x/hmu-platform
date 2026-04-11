"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coffee, Star, MapPin, Search, Filter, TrendingUp, Info, AlertCircle } from "lucide-react";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/apiClient";
import { useUser } from "@/context/UserContext";

export default function CanteensPage() {
  const { role: currentUserRole } = useUser();
  const [canteens, setCanteens] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const data = await apiFetch("/canteens");
        
        setCanteens(data.map((c: any) => ({
          ...c,
          id: c.id,
          rating: c.average_rating,
          reviews: c.review_count,
          image: c.image_url || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400",
          status: c.average_rating > 4 ? "open" : "busy", 
          specialty: c.category || "Snacks & Drinks"
        })));
      } catch (err) {
        console.error("Failed to fetch canteens:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCanteens();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-10 space-y-12">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <Badge className="bg-brand/10 text-brand border-brand/20 rounded-full px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
             Campus Utility
          </Badge>
          <h1 className="text-5xl md:text-7xl font-dmserif font-bold tracking-tight text-white leading-[1.1]">
            Canteen <span className="text-brand italic drop-shadow-[0_0_15px_rgba(194,105,42,0.3)]">Truths</span>.
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl font-medium">
            Which Biryani actually hits? Where is the queue the shortest? Student-sourced ratings for every outlet on campus.
          </p>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-4 items-center bg-card/30 p-2 rounded-[2.5rem] border border-border/40 backdrop-blur-md">
           <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a canteen..." 
                className="w-full bg-transparent border-none rounded-full h-14 pl-14 pr-6 outline-none text-white font-medium"
              />
           </div>
           <Button className="rounded-full h-14 w-14 bg-brand hover:bg-accent text-white shrink-0">
             <Filter className="w-6 h-6" />
           </Button>
        </div>
      </div>

      {currentUserRole === 'super_admin' || currentUserRole === 'founder' || currentUserRole === 'moderator' ? (
        <div className="flex justify-end mt-4">
          <Button className="bg-brand text-white hover:bg-accent font-bold gap-2 rounded-xl">
            + Add Canteen
          </Button>
        </div>
      ) : null}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div>Loading canteens...</div>
        ) : (
          canteens.map((canteen) => (
            <Card key={canteen.id} className="rounded-[2.5rem] bg-card/30 border-border/40 overflow-hidden hover:border-brand/40 transition-all duration-500 hover:-translate-y-2 flex flex-col group">
               <div className="h-64 relative overflow-hidden">
                  <img 
                    src={canteen.image} 
                    alt={canteen.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="absolute top-6 left-6 flex gap-2">
                     <Badge className="bg-background/80 backdrop-blur-md rounded-full border border-border/40 text-white font-bold h-10 px-5 flex items-center gap-2">
                        <Star className="w-4 h-4 text-brand fill-brand" /> {canteen.rating}
                     </Badge>
                  </div>
                  <div className="absolute top-6 right-6">
                    <Badge className={`rounded-full h-10 px-5 flex items-center gap-2 border shadow-lg ${
                      canteen.status === 'open' ? 'bg-green-500/90 text-white border-green-400' : 'bg-amber-500/90 text-white border-amber-400'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="font-bold uppercase tracking-widest text-[10px]">{canteen.status}</span>
                    </Badge>
                  </div>
               </div>
               <CardContent className="p-10 flex-1 flex flex-col justify-between space-y-8 relative">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-widest text-[10px]">
                       <Coffee className="w-4 h-4" /> {canteen.specialty}
                    </div>
                    <h3 className="text-3xl font-dmserif font-bold text-white">{canteen.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                       <MapPin className="w-4 h-4 text-rose-500" /> {canteen.location}
                    </div>
                  </div>
                  <div className="pt-8 border-t border-border/40 flex items-center justify-between">
                     <div className="text-sm font-medium text-muted-foreground">
                        <span className="text-white font-bold">{canteen.reviews}+</span> reviews
                     </div>
                     <Link href={`/canteens/${canteen.id}`} className="block">
                        <Button variant="ghost" className="rounded-full h-14 group/btn hover:bg-brand transition-all font-bold px-8 gap-3">
                           View Menu & Rate
                           <TrendingUp className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                     </Link>
                  </div>
               </CardContent>               
            </Card>
          ))
        )}
      </div>

      {/* Safety Section */}
      <div className="pt-16 grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="bg-rose-500/5 rounded-[3rem] p-12 border border-rose-500/10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-2">
               <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-4xl font-dmserif font-bold">See something <span className="text-rose-500">unhygienic?</span></h3>
            <p className="text-muted-foreground text-lg px-8 font-medium">Report hygiene issues anonymously. Our moderators escalate these issues to administrative channels instantly.</p>
            <Button variant="outline" className="rounded-full h-14 px-10 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-bold">Report Anonymously</Button>
         </div>
         <div className="bg-brand/5 rounded-[3rem] p-12 border border-brand/10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-brand mb-2">
               <Info className="w-10 h-10" />
            </div>
            <h3 className="text-4xl font-dmserif font-bold">Help your <span className="text-brand italic">mains.</span></h3>
            <p className="text-muted-foreground text-lg px-8 font-medium">Found a secret item? Know a tip for better combos? Share it on the ratings page to help others.</p>
            <Button className="bg-brand text-white rounded-full h-14 px-10 hover:bg-accent font-bold">Contribute Tips</Button>
         </div>
      </div>
    </div>
  );
}
