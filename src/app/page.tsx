import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RadioIcon, GhostIcon, UsersIcon, SparkleIcon } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Nav */}
      <header className="py-5 px-6 sm:px-12 flex justify-between items-center z-10 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-dmserif font-bold text-bg-base tracking-widest text-xs">intrst</div>
          <span className="font-dmserif font-semibold text-xl tracking-tight">intrst</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/signup">
            <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-white">Sign In</Button>
          </Link>
          <Link href="/discover">
            <Button className="bg-brand hover:opacity-90 text-white font-semibold rounded-xl px-6">Find My People</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 z-10">
        {/* ─── Hero ─── */}
        <section className="px-6 py-24 sm:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-2 text-brand text-xs font-semibold tracking-wider mb-8">
            <SparkleIcon className="w-3.5 h-3.5" />
            AI-POWERED CAMPUS MATCHING
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold font-dmserif tracking-tight text-white mb-6">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">Actual</span> People.
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-4 max-w-2xl font-dmsans">
            Not proximity friends. Not orientation defaults.
            The ones who actually get you.
          </p>
          <p className="text-sm text-brand/80 mb-10 font-medium">
            Tell us your interests → our AI builds your match profile → connect anonymously
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <Link href="/discover">
              <Button size="lg" className="w-full sm:w-auto bg-brand hover:opacity-90 text-white text-lg px-8 h-14 rounded-xl font-semibold shadow-[0_0_30px_rgba(194,105,42,0.3)] transition-all">
                <SparkleIcon className="w-5 h-5 mr-2" />
                Discover My Vibe →
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-brand border-brand/30 hover:bg-brand/10 text-lg px-8 h-14 rounded-xl bg-transparent">
                Already have an account
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Verified students only. Your campus. Your people.
          </div>
        </section>

        {/* ─── How the AI works ─── */}
        <section className="px-6 py-16 bg-card/20 border-y border-border/30">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-dmserif font-bold mb-3">The AI does the heavy lifting</h2>
            <p className="text-muted-foreground text-lg">No algorithm noise. Just genuine compatibility.</p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Pick your interests", body: "Choose from 40+ interest tags across arts, tech, culture, sports, and lifestyle. More = better matches.", color: "text-brand" },
              { step: "02", title: "Answer 3 questions", body: "Optional but powerful. The AI reads between the lines to find your personality archetype.", color: "text-accent" },
              { step: "03", title: "Get your match profile", body: "Receive your codename, personality type, vibe score, and AI-generated icebreaker. Then sign up.", color: "text-emerald-400" },
            ].map(({ step, title, body, color }) => (
              <div key={step} className="p-6 bg-card border border-border/50 rounded-2xl hover:border-brand/30 transition-colors group">
                <div className={`text-4xl font-dmserif font-bold ${color} opacity-30 group-hover:opacity-60 transition-opacity mb-4`}>{step}</div>
                <h3 className="font-dmserif font-semibold text-white text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/discover">
              <Button size="lg" className="bg-brand hover:opacity-90 text-white px-8 h-12 rounded-xl font-semibold shadow-[0_0_20px_rgba(194,105,42,0.3)]">
                Try it now — it&apos;s free
              </Button>
            </Link>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section className="px-6 py-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 bg-card border-border/50 glow-hover group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-6 border border-brand/20">
                <RadioIcon className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-xl font-dmserif font-semibold mb-3">Campus Pulse</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">Canteen ratings, professor reviews, club events, senior tips. Everything your college forgot to tell you.</p>
            </Card>
            <Card className="p-8 bg-card border-border/50 glow-hover group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 border border-accent/20">
                <GhostIcon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-dmserif font-semibold mb-3">Anonymous Match</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">Get matched with someone who thinks like you. Exchange voice messages anonymously. Reveal when you&apos;re ready.</p>
            </Card>
            <Card className="p-8 bg-card border-border/50 glow-hover group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                <UsersIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-dmserif font-semibold mb-3">Real Communities</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">Every club. Every event. Every interest group. One place to find where you actually belong.</p>
            </Card>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section id="how-it-works" className="px-6 py-16 bg-card/20 border-t border-border/30 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-dmserif font-bold text-center mb-12">From stranger to friend in 5 steps</h2>
          <div className="space-y-4">
            {[
              "Tell us your interests — the AI starts building your profile",
              "Verify with your college email",
              "Explore your campus — feed, clubs, events",
              "Get your anonymous match (codename only, no photo)",
              "Talk. Exchange voice messages. Reveal when you both feel ready.",
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-5 bg-card border border-border p-5 rounded-2xl group hover:border-brand/30 transition-colors relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand/30 group-hover:bg-brand transition-colors" />
                <div className="text-3xl font-dmserif font-bold text-brand/20 group-hover:text-brand/80 transition-colors w-12 shrink-0 text-center">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="text-foreground font-medium text-sm sm:text-base">{step}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Social Proof ─── */}
        <section className="px-6 py-24 border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-dmserif font-bold text-center mb-12">Don&apos;t just take our word for it</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { quote: "I talked to someone for 2 weeks before we revealed. Now they&apos;re one of my closest friends.", name: "Priya", college: "GITAM University" },
                { quote: "The AI matched me with someone who had the exact same niche interests. Wild how accurate it was.", name: "Arjun", college: "GITAM University" },
                { quote: "Found my entire friend group through the Photography Club. The anonymity takes all the pressure off.", name: "Riya", college: "GITAM University" },
              ].map((t, i) => (
                <Card key={i} className="p-7 bg-card flex flex-col justify-between border-border/50 glow-hover">
                  <p className="text-base italic text-muted-foreground mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-brand/20">
                      <AvatarFallback className="bg-brand/10 text-brand font-bold text-sm">{t.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.college}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 px-6 border-t border-border/40 bg-card/10 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-brand flex items-center justify-center font-dmserif font-bold text-bg-base text-[8px] tracking-widest">intrst</div>
            <span className="font-dmserif font-medium">intrst</span>
            <span className="text-muted-foreground text-sm border-l border-border pl-4">Find Your Actual People</span>
          </div>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <a href="mailto:intrst2026@gmail.com" className="hover:text-white transition-colors">Contact</a>
            <a href="https://instagram.com/intrst.in" target="_blank" className="hover:text-white transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
