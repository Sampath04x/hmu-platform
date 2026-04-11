"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Star, 
  MapPin, 
  ArrowLeft, 
  Clock, 
  Menu, 
  MessageSquare, 
  ChevronRight,
  Send,
  Quote,
  TrendingUp,
  AlertCircle,
  Trash2,
  Edit2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

export default function CanteenDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { role: userRole, user_id } = useUser();
  const [canteen, setCanteen] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const canManageCanteen = userRole === 'super_admin' || userRole === 'founder' || userRole === 'junior_moderator' || userRole === 'moderator';

  const fetchCanteen = async () => {
    try {
      const data = await apiFetch(`/canteens/${id}`);
      setCanteen(data);
      setEditForm({ name: data.name, description: data.description, location: data.location });
    } catch (err) {
      console.error("Failed to fetch canteen:", err);
      toast.error("Error loading canteen details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCanteen();
  }, [id]);

  const handleSubmitReview = async () => {
    if (rating === 0) return toast.error("Please select a rating");
    if (!review.trim()) return toast.error("Please add a comment");

    setIsSubmitting(true);
    try {
      await apiFetch(`/canteens/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: review,
          is_anonymous: isAnonymous
        })
      });
      toast.success("Review submitted! You earned 1 point.");
      setReview("");
      setRating(0);
      fetchCanteen();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await apiFetch(`/canteens/review/${reviewId}`, { method: 'DELETE' });
      toast.success("Review deleted successfully");
      fetchCanteen();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    }
  };

  const handleDeleteCanteen = async () => {
    if (!confirm("Are you sure you want to delete this canteen? This action cannot be undone.")) return;
    try {
      await apiFetch(`/admin/canteens/${id}`, { method: 'DELETE' });
      toast.success("Canteen deleted successively");
      router.push("/canteens");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete canteen");
    }
  };

  const handleEditCanteen = async () => {
    try {
      await apiFetch(`/admin/canteens/${id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      toast.success("Canteen updated successfully");
      setIsEditing(false);
      fetchCanteen();
    } catch (err: any) {
      toast.error(err.message || "Failed to update canteen");
    }
  };


  if (isLoading) return <div className="p-20 text-center animate-pulse text-brand font-dmserif italic text-2xl">Loading the truth...</div>;
  if (!canteen) return <div className="p-20 text-center">Canteen not found</div>;

  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-10 space-y-12 animate-in fade-in duration-700">
      {/* Back Button & Header */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="w-fit rounded-full h-12 px-6 group flex items-center gap-3 transition-all hover:bg-brand hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Back to Listings
          </Button>

          {canManageCanteen && (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline" className="border-brand/40 hover:bg-brand/10">
                <Edit2 className="w-4 h-4 mr-2" /> Edit Details
              </Button>
              <Button onClick={handleDeleteCanteen} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          )}
        </div>


        <div className="flex flex-col lg:flex-row justify-between gap-12">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4">
               <Badge className="bg-brand text-white rounded-full px-4 h-8 uppercase tracking-widest text-[10px] font-bold">
                  {canteen.average_rating > 4 ? "Student Favorite" : "Daily Classic"}
               </Badge>
               <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                  <MapPin className="w-4 h-4 text-brand" /> {canteen.location}
               </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-dmserif font-bold tracking-tight text-white leading-none">
              {canteen.name}
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl font-medium leading-relaxed">
              {canteen.description || "The heart of campus dining. Authenticated student reviews and the most accurate menus for this outlet."}
            </p>
          </div>

          {/* Edit Canteen Modal */}
          {isEditing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
              <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl relative">
                <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-muted-foreground">✖</button>
                <h3 className="text-xl font-bold mb-4">Edit Canteen</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase text-left block w-full">Name</label>
                    <input 
                      className="w-full bg-background border border-border rounded-md px-3 py-2 mt-1"
                      value={editForm.name || ""}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase text-left block w-full">Location</label>
                    <input 
                      className="w-full bg-background border border-border rounded-md px-3 py-2 mt-1"
                      value={editForm.location || ""}
                      onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase text-left block w-full">Description</label>
                    <textarea 
                      className="w-full bg-background border border-border rounded-md px-3 py-2 mt-1 h-20"
                      value={editForm.description || ""}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleEditCanteen} className="w-full bg-brand hover:brightness-110">Save Changes</Button>
                </div>
              </div>
            </div>
          )}

          <div className="w-full lg:w-96 flex flex-col gap-6">
             <Card className="rounded-[2.5rem] bg-card/40 border-border/40 p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                   <div className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">Truth Rating</div>
                   <TrendingUp className="w-6 h-6 text-brand" />
                </div>
                <div className="flex items-end gap-3 mb-6">
                   <span className="text-7xl font-dmserif font-bold text-brand leading-none">{canteen.average_rating || 0}</span>
                   <span className="text-2xl font-dmserif text-muted-foreground mb-2">/5.0</span>
                </div>
                <div className="space-y-4 pt-4 border-t border-border/20">
                    <div className="flex justify-between items-center text-sm">
                       <span className="font-medium text-muted-foreground">Student Satisfaction</span>
                       <span className="font-bold text-white">{(canteen.average_rating * 20).toFixed(0)}%</span>
                    </div>
                    <Progress value={canteen.average_rating * 20} className="h-2 bg-brand/10" />
                    <div className="text-xs text-muted-foreground pt-2">Based on {canteen.review_count || 0} verified reviews</div>
                </div>
             </Card>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Menu & Info */}
        <div className="lg:col-span-2 space-y-12">
           <Card className="rounded-[3rem] bg-card/20 border-border/40 overflow-hidden">
              <CardHeader className="p-10 border-b border-border/20 bg-gradient-to-r from-brand/10 to-transparent">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-brand/20 text-brand">
                       <Menu className="w-8 h-8" />
                    </div>
                    <div>
                       <CardTitle className="text-4xl font-dmserif">The Menu Highlights</CardTitle>
                       <CardDescription className="text-lg">Student recommended items and price points.</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {canteen.menu && canteen.menu.length > 0 ? (
                      canteen.menu.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-brand/40 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">{idx + 1}</div>
                              <span className="font-bold text-lg">{item}</span>
                           </div>
                           <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-brand" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-10 text-muted-foreground font-medium italic">Menu data is being finalized by students</div>
                    )}
                 </div>
              </CardContent>
           </Card>

           {/* Review Section */}
           <div className="space-y-8">
              <div className="flex items-center gap-4">
                 <MessageSquare className="w-8 h-8 text-brand" />
                 <h2 className="text-4xl font-dmserif font-bold">Student Voices</h2>
              </div>

              {/* Add Review Box */}
              <Card className="rounded-[2.5rem] bg-brand/5 border-brand/20 overflow-hidden">
                 <CardContent className="p-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <h3 className="text-2xl font-bold">How was your meal?</h3>
                       <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button 
                              key={s} 
                              onClick={() => setRating(s)}
                              className="focus:outline-none transition-transform active:scale-90"
                            >
                              <Star className={`w-8 h-8 ${rating >= s ? 'text-brand fill-brand' : 'text-brand/20'}`} />
                            </button>
                          ))}
                       </div>
                    </div>
                    
                    <textarea 
                       value={review}
                       onChange={(e) => setReview(e.target.value)}
                       placeholder="Tell the truth... how was the wait? the taste? the hygiene?"
                       className="w-full bg-background/50 border border-brand/20 rounded-[2rem] p-8 h-40 outline-none focus:border-brand/60 transition-colors text-white text-lg font-medium resize-none shadow-inner"
                    />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => setIsAnonymous(!isAnonymous)}
                             className={`w-12 h-6 rounded-full transition-colors relative ${isAnonymous ? 'bg-brand' : 'bg-muted-foreground/30'}`}
                           >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnonymous ? 'left-7' : 'left-1'}`} />
                           </button>
                           <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Post Anonymously</span>
                        </div>
                        <Button 
                          onClick={handleSubmitReview}
                          disabled={isSubmitting}
                          className="bg-brand text-white rounded-full px-12 h-16 text-lg font-bold hover:bg-accent transition-all shadow-xl shadow-brand/20 gap-3 group"
                        >
                           {isSubmitting ? "Submitting..." : "Drop the Review"}
                           <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                    </div>
                 </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="space-y-6">
                 {canteen.canteen_reviews && canteen.canteen_reviews.length > 0 ? (
                   canteen.canteen_reviews.map((rev: any) => {
                     const isAuthor = user_id === rev.user_id;
                     const isPrivileged = userRole === 'super_admin' || userRole === 'founder' || userRole === 'moderator';
                     const canDelete = isAuthor || isPrivileged;

                     return (
                      <Card key={rev.id} className="rounded-[2.5rem] bg-card/40 border-border/40 hover:border-brand/20 transition-all p-10 space-y-6 relative group">
                        {canDelete && (
                            <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                            title="Delete Review"
                            >
                            <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <Avatar className="w-14 h-14 border-2 border-brand/10">
                                  {rev.is_anonymous ? (
                                    <AvatarFallback className="bg-brand text-white font-dmserif italic font-bold">A</AvatarFallback>
                                  ) : (
                                    <>
                                      <AvatarImage src={rev.profiles?.profile_image_url} />
                                      <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-bold uppercase">{rev.profiles?.name?.[0] || '?'}</AvatarFallback>
                                    </>
                                  )}
                               </Avatar>
                               <div>
                                  <div className="font-bold text-lg text-white">{rev.is_anonymous ? "Anonymous Student" : rev.profiles?.name}</div>
                                  <div className="text-sm text-muted-foreground font-medium">{new Date(rev.created_at).toLocaleDateString()}</div>
                               </div>
                            </div>
                            <div className="flex items-center gap-1 bg-brand/10 px-4 py-2 rounded-full border border-brand/20 mr-12">
                               <Star className="w-4 h-4 text-brand fill-brand" />
                               <span className="font-bold text-brand">{rev.rating}</span>
                            </div>
                         </div>
                         <div className="relative">
                            <Quote className="absolute -left-6 -top-4 w-12 h-12 text-brand/5 rotate-180" />
                            <p className="text-xl text-white/90 leading-relaxed font-dmserif italic pl-4 pr-8">
                               {rev.comment}
                            </p>
                         </div>
                         {rev.tips && (
                           <div className="pt-6 border-t border-border/20 flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                 <TrendingUp className="w-4 h-4" />
                              </div>
                              <p className="text-sm font-medium text-green-400/80"><span className="font-bold text-green-400 uppercase tracking-widest text-[10px] mr-2">Top Tip</span> {rev.tips}</p>
                           </div>
                         )}
                      </Card>
                     );
                   })
                 ) : (
                   <div className="text-center py-20 bg-card/10 rounded-[3rem] border border-dashed border-border/40">
                      <div className="text-muted-foreground font-medium text-lg">No reviews yet. Be the first to tell the truth!</div>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
            <Card className="rounded-[2.5rem] bg-indigo-500/5 border-indigo-500/10 p-8 space-y-6 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
               <div className="flex items-center gap-3 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                  <Clock className="w-5 h-5" /> Operational Hours
               </div>
               <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-medium text-muted-foreground">Mon - Fri</span>
                     <span className="font-bold text-white">8:30 AM - 7:30 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-sm opacity-60">
                     <span className="font-medium text-muted-foreground">Saturday</span>
                     <span className="font-bold text-white">9:30 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-rose-400">
                     <span className="font-medium">Sunday</span>
                     <span className="font-bold uppercase tracking-widest text-[10px]">Closed</span>
                  </div>
               </div>
            </Card>

            <Card className="rounded-[2.5rem] bg-rose-500/5 border-rose-500/10 p-8 space-y-6">
               <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold">Hygiene Report</h3>
               <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Notice anything off? Reporting hygiene issues anonymously sends an instant alert to the platform curators.
               </p>
               <Button variant="outline" className="w-full rounded-2xl h-14 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-bold">Report Anonymously</Button>
            </Card>


        </div>
      </div>
    </div>
  );
}
