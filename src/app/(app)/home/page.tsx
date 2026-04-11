"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUpIcon, MessageCircleIcon, BookmarkIcon, PlusIcon, XIcon, LockIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";
import { PersonalityPrompt } from "@/components/PersonalityPrompt";

export default function HomePage() {
  const { user_id, has_completed_personality, setHasCompletedPersonality, role, isAuthLoading } = useUser();
  const [activeTab, setActiveTab] = useState("All");
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [postTag, setPostTag] = useState("QUESTION"); // Default to Question
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
// ... existing code ...
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchFeaturedEvents = async () => {
    try {
      setEventsLoading(true);
      // Fetch events along with club details
      const { data, error } = await supabase
        .from('events')
        .select(`
          event_id,
          title,
          poster_url,
          clubs (
            club_name,
            logo_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setFeaturedEvents(data || []);
    } catch (err) {
      console.error("Error fetching featured events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchFeaturedEvents();
  }, [user_id]);

  const handleCreatePost = async () => {
    if (!postContent.trim() || !postTag) return;

    try {
      setIsPosting(true);
      const response = await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: postContent,
          post_type: postTag,
          title: postTitle || "New Post",
          is_anonymous: isAnonymous
        }),
      });

      if (response && response.post) {
        setPostContent("");
        setPostTitle("");
        setIsAnonymous(false);
        setIsFabOpen(false);
        fetchPosts(); // Refresh feed
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = p.user_has_liked;
        return {
          ...p,
          user_has_liked: !isLiked,
          likes_count: (p.likes_count || 0) + (isLiked ? -1 : 1)
        };
      }
      return p;
    }));

    try {
      await apiFetch(`/posts/${postId}/like`, { method: 'POST' });
    } catch (error) {
      console.error("Failed to like post:", error);
      // Rollback if failed
      fetchPosts();
    }
  };

  const toggleComments = async (postId: string) => {
    const isExpanded = expandedComments.has(postId);
    const newExpanded = new Set(expandedComments);
    
    if (isExpanded) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      // Fetch data if not already fetched
      if (!postComments[postId]) {
        fetchComments(postId);
      }
    }
    setExpandedComments(newExpanded);
  };

  const fetchComments = async (postId: string) => {
    try {
      setCommentLoading(prev => ({ ...prev, [postId]: true }));
      const data = await apiFetch(`/comments/${postId}`);
      setPostComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;

    try {
      const response = await apiFetch("/comments", {
        method: "POST",
        body: JSON.stringify({ postId, comment: text })
      });

      if (response && response.comment) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        fetchComments(postId); // Refresh comment list
        // Update comment count locally
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, post_comments: [{ count: (p.post_comments?.[0]?.count || 0) + 1 }] } : p));
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment.");
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "EVENT": return "bg-brand/10 text-brand border border-brand/20";
      case "QUESTION": return "bg-accent/10 text-accent border border-accent/20";
      case "TIP": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "UTILITY": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "OPINION": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredPosts = activeTab === "All" ? posts : posts.filter(p => p.post_type === activeTab.toUpperCase().replace(/S$/, ''));

  return (
    <div className="min-h-screen bg-background relative flex flex-col md:flex-row">
      {showPersonalityPrompt && (
        <PersonalityPrompt 
          user_id={user_id} 
          onComplete={() => setHasCompletedPersonality(true)} 
        />
      )}
      <div className="flex-1 max-w-2xl mx-auto w-full border-x border-border/40 min-h-screen relative pb-24">
        {/* Top Header - Mobile */}
        <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 pt-[calc(env(safe-area-inset-top)+64px)] px-4 pb-3 overflow-x-auto hide-scrollbar flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-brand text-white shadow-[0_0_15px_rgba(194,105,42,0.3)]' : 'bg-card text-muted-foreground hover:bg-card/80 border border-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Top Header - Desktop */}
        <div className="hidden md:flex sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 px-6 py-4 gap-3 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-brand text-white shadow-[0_0_15px_rgba(194,105,42,0.3)]' : 'bg-card/50 text-muted-foreground hover:text-white border border-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Pinned Posts Section (Clubs/Events) - Dynamic Form */}
          <div className="mb-6 space-y-2">
             <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Featured Events</span>
                <Badge variant="outline" className="text-[9px] border-emerald-500/20 bg-emerald-500/5 text-emerald-400 px-1.5 py-0">LIVE</Badge>
             </div>
             <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {eventsLoading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="min-w-[180px] h-[80px] bg-card/50 border border-border/40 rounded-xl animate-pulse" />
                  ))
                ) : featuredEvents.length === 0 ? (
                  <div className="w-full py-6 bg-card/30 border border-dashed border-border/40 rounded-xl flex items-center justify-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">No featured events today</p>
                  </div>
                ) : featuredEvents.map((evt, i) => (
                   <Link key={evt.event_id} href={`/events/${evt.event_id}`}>
                     <div className="min-w-[180px] max-w-[180px] bg-card border border-border/40 rounded-xl p-3 flex flex-col gap-2 relative group cursor-pointer hover:border-brand/40 transition-all shadow-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-md bg-brand/10 flex items-center justify-center text-[10px] grayscale group-hover:grayscale-0 transition-all overflow-hidden border border-border/30">
                              {evt.clubs?.logo_url ? (
                                <img src={evt.clubs.logo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                "📅"
                              )}
                           </div>
                           <span className="text-[10px] font-bold text-white/70 group-hover:text-brand transition-colors truncate">
                              {evt.clubs?.club_name || "Campus Event"}
                           </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug group-hover:text-white transition-colors">
                          {evt.title}
                        </p>
                     </div>
                   </Link>
                ))}
             </div>
          </div>

          <div className="mb-8 md:block flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-dmserif font-semibold text-white">Campus Pulse</h1>
               <p className="text-muted-foreground">What&apos;s happening on campus right now.</p>
            </div>
            {activeTab !== "All" && (
                <Badge className="bg-accent/10 text-accent border-accent/20">Showing {activeTab}s</Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading your campus pulse...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>No posts yet. Be the first to post something!</p>
            </div>
          ) : filteredPosts.map((post) => (
            <Card key={post.id} className="p-4 sm:p-5 bg-card border-border/50 glow-hover">
              <div className="flex gap-3 mb-3">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                    {post.is_anonymous ? "A" : ((post.profiles?.name || "U")[0])}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{post.is_anonymous ? "Anonymous" : (post.profiles?.name || "Student")}</h4>
                      <p className="text-xs text-muted-foreground">
                        {post.is_anonymous ? "Hidden Identity" : (post.profiles?.department || "General")} &middot; {post.is_anonymous ? "Unknown" : (post.profiles?.year_of_study ? `${post.profiles.year_of_study}${post.profiles.year_of_study === 1 ? 'st' : post.profiles.year_of_study === 2 ? 'nd' : post.profiles.year_of_study === 3 ? 'rd' : 'th'} Year` : "Member")}
                      </p>
                    </div>
                    <Badge className={getTagColor(post.post_type)} variant="outline">
                      {post.post_type}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-foreground text-[15px] leading-relaxed mb-4 ml-[52px]">
                {post.content}
              </p>
              
              <div className="flex items-center gap-6 ml-[52px] text-muted-foreground">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors group ${post.user_has_liked ? 'text-brand' : 'hover:text-brand'}`}
                >
                  <div className={`p-1.5 rounded-full transition-colors ${post.user_has_liked ? 'bg-brand/10' : 'group-hover:bg-brand/10'}`}>
                    <ThumbsUpIcon className={`w-4 h-4 ${post.user_has_liked ? 'fill-brand text-brand' : ''}`} />
                  </div>
                  {post.likes_count || 0}
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors group ${expandedComments.has(post.id) ? 'text-accent' : 'hover:text-accent'}`}
                >
                  <div className={`p-1.5 rounded-full transition-colors ${expandedComments.has(post.id) ? 'bg-accent/10' : 'group-hover:bg-accent/10'}`}>
                    <MessageCircleIcon className="w-4 h-4" />
                  </div>
                  {post.post_comments?.[0]?.count || 0}
                </button>
                <div className="flex-1"></div>
                <div className="text-xs">{new Date(post.created_at).toLocaleDateString()}</div>
                <button className="p-1.5 rounded-full hover:bg-muted hover:text-white transition-colors">
                  <BookmarkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Comment Section */}
              {expandedComments.has(post.id) && (
                <div className="mt-4 ml-[52px] space-y-4 pt-4 border-t border-border/40 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex gap-2">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                       <input 
                        type="text" 
                        placeholder="Add a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand/40 transition-colors"
                       />
                       <Button 
                        size="sm" 
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="bg-brand hover:opacity-90 h-8 px-4 text-xs font-bold"
                       >
                        Post
                       </Button>
                    </div>
                  </div>

                  {commentLoading[post.id] ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : postComments[post.id]?.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Start the conversation!</p>
                  ) : (
                    <div className="space-y-4">
                      {/* @ts-ignore */}
                      {postComments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-7 h-7 border border-border">
                            <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                              {comment.profiles?.name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted/20 rounded-xl p-2 px-3">
                              <h5 className="text-[11px] font-bold text-white/90">{comment.profiles?.name || "Anonymous"}</h5>
                              <p className="text-sm text-foreground/90">{comment.comment}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground ml-2">Just now</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button 
        onClick={() => setIsFabOpen(true)}
        className="fixed bottom-[100px] md:bottom-8 right-4 md:right-8 w-14 h-14 bg-brand hover:opacity-90 active:scale-95 transition-all text-white rounded-full shadow-[0_0_20px_rgba(194,105,42,0.5)] flex items-center justify-center z-40"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      {isFabOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl safe-area-bottom animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-lg font-dmserif font-semibold">Create Post</h3>
              <button onClick={() => { setIsFabOpen(false); setIsAnonymous(false); }} className="p-2 text-muted-foreground hover:text-white hover:bg-muted rounded-full transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {["TIP", "QUESTION", "EVENT", "UTILITY", "OPINION"].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setPostTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      postTag === tag ? getTagColor(tag) + ' shadow-[0_0_10px_currentColor]' : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <Textarea 
                placeholder="What's on your mind?" 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="min-h-[150px] bg-background border-none focus-visible:ring-0 text-base resize-none placeholder:text-muted-foreground"
              />

              {/* Media Upload for Clubs */}
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-2">
                    <button className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold transiton-all ${role === 'club' ? 'border-brand/40 bg-brand/5 text-brand hover:bg-brand/10' : 'border-border bg-muted/20 text-muted-foreground cursor-not-allowed grayscale'}`}>
                       <PlusIcon className="w-4 h-4" /> Add Photo/Video
                    </button>
                    {role !== 'club' && (
                        <p className="text-[10px] text-muted-foreground italic">Only clubs can post media for now.</p>
                    )}
                 </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${isAnonymous ? 'bg-brand text-white border border-brand/20' : 'text-brand hover:bg-brand/10'}`}
                >
                  <LockIcon className="w-4 h-4" /> {isAnonymous ? 'Posting Anonymously' : 'Anonymous'}
                </button>
                <Button 
                  className={`px-6 rounded-xl font-semibold ${
                    postTag && postContent.trim() ? 'bg-brand hover:opacity-90 text-white' : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                  disabled={!postTag || !postContent.trim() || isPosting}
                  onClick={handleCreatePost}
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
