import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Youtube, Briefcase, FileEdit, Sparkles, Plus, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import { AnalyticsCharts } from "./analytics-charts"
import { ScrollReveal } from "@/components/scroll-reveal"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch user data
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch real stats
  const [
    { count: notesCount },
    { count: ytCount },
    { count: jobsCount },
    { count: resumesCount }
  ] = await Promise.all([
    supabase.from('notes').select('*', { count: 'exact', head: true }),
    supabase.from('yt_summaries').select('*', { count: 'exact', head: true }),
    supabase.from('saved_jobs').select('*', { count: 'exact', head: true }),
    supabase.from('resumes').select('*', { count: 'exact', head: true })
  ])

  // Fetch recent activity
  const [
    { data: recentNotes },
    { data: recentSummaries },
    { data: recentJobs }
  ] = await Promise.all([
    supabase.from('notes').select('id, title, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('yt_summaries').select('id, video_url, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('saved_jobs').select('id, job_title, company, created_at').order('created_at', { ascending: false }).limit(3)
  ])

  const name = user.user_metadata?.full_name || "User"
  const avatar_url = user.user_metadata?.avatar_url || ""
  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <div className="space-y-16 pb-16 font-serif selection:bg-primary/20">
      {/* Welcome Section - Premium Humanized Sanctuary */}
      <div className="relative overflow-hidden p-12 bg-[#0B0F14] border border-border/10 group shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12 group-hover:opacity-10 transition-all duration-[2000ms]">
          <Sparkles className="w-64 h-64" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <Avatar className="h-28 w-28 border-2 border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            <AvatarImage src={avatar_url} alt={name} />
            <AvatarFallback className="text-4xl font-heading italic bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="h-px w-10 bg-primary/30" />
              <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-muted">Architect Profile</span>
              <div className="h-px w-10 bg-primary/30 md:hidden" />
            </div>
            <h1 className="text-5xl md:text-6xl font-heading tracking-tight italic text-foreground leading-tight">
              Welcome back, <span className="text-primary">{name.split(" ")[0]}</span>
            </h1>
            <p className="text-muted text-xl font-light leading-relaxed max-w-xl italic">
              "Mastery is not a destination, but a state of perpetual refinement. Your sanctuary awaits."
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Premium Animated Cards */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Wisdom Notes" value={notesCount || 0} icon={FileText} trend={{ value: 12, isUp: true }} />
        <StatCard label="Visual Insights" value={ytCount || 0} icon={Youtube} trend={{ value: 8, isUp: true }} />
        <StatCard label="Strategic Roles" value={jobsCount || 0} icon={Briefcase} trend={{ value: 5, isUp: true }} />
        <StatCard label="Professional Assets" value={resumesCount || 0} icon={FileEdit} trend={{ value: 2, isUp: true }} />
      </div>

      {/* Visual Intelligence Layer */}
      <AnalyticsCharts 
        data={{
          productivity: [
            { name: 'Mon', notes: 4, summaries: 2 },
            { name: 'Tue', notes: 3, summaries: 5 },
            { name: 'Wed', notes: 6, summaries: 3 },
            { name: 'Thu', notes: 8, summaries: 4 },
            { name: 'Fri', notes: 5, summaries: 6 },
            { name: 'Sat', notes: 2, summaries: 1 },
            { name: 'Sun', notes: 3, summaries: 2 },
          ],
          career: [
            { name: 'Jan', applications: 12, resumes: 4 },
            { name: 'Feb', applications: 18, resumes: 7 },
            { name: 'Mar', applications: 15, resumes: 5 },
            { name: 'Apr', applications: notesCount || 0, resumes: resumesCount || 0 },
          ]
        }}
      />

      {/* Recent Activity - Minimalist Parchment Style */}
      <div className="grid gap-12 lg:grid-cols-3 pt-8">
        {/* Latest Notes */}
        <ScrollReveal delay={0.1} className="space-y-8 group">
          <div className="flex items-center justify-between border-b border-border/10 pb-4">
            <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
               Recent Wisdom
            </h3>
            <Link href="/dashboard/notes" className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2">
              View Scroll <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-5">
            {recentNotes && recentNotes.length > 0 ? (
               recentNotes.map((note: any) => (
                 <Link href={`/dashboard/notes/${note.id}`} key={note.id} className="block group/item cursor-pointer p-4 glass-card border border-border/5 rounded-sm hover:-translate-y-1 transition-all duration-300 space-y-2">
                   <h4 className="font-heading text-xl italic tracking-tight group-hover/item:text-primary transition-colors truncate">{note.title}</h4>
                   <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted/50 group-hover/item:text-muted/80 transition-colors">
                      <Clock className="h-3 w-3" />
                      {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </div>
                 </Link>
               ))
            ) : (
               <p className="text-sm italic text-muted/40 font-light px-2">No wisdom captured yet.</p>
            )}
          </div>
        </ScrollReveal>
        
        {/* Recent Summaries */}
        <ScrollReveal delay={0.2} className="space-y-8 group">
          <div className="flex items-center justify-between border-b border-border/10 pb-4">
            <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
               Visual Ledger
            </h3>
            <Link href="/dashboard/youtube" className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2">
              All Insights <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-5">
             {recentSummaries && recentSummaries.length > 0 ? (
               recentSummaries.map((summary: any) => (
                 <a href={summary.video_url} target="_blank" rel="noreferrer" key={summary.id} className="block group/item p-4 glass-card border border-border/5 rounded-sm hover:-translate-y-1 transition-all duration-300 space-y-2">
                   <h4 className="font-heading text-xl italic tracking-tight group-hover/item:text-primary transition-colors truncate block">
                      Video Insight Archive
                   </h4>
                   <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted/50 group-hover/item:text-muted/80 transition-colors">
                      <Clock className="h-3 w-3" />
                      {new Date(summary.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </div>
                 </a>
               ))
            ) : (
               <p className="text-sm italic text-muted/40 font-light px-2">The screen is yet to speak.</p>
            )}
          </div>
        </ScrollReveal>
        
        {/* Active Applications */}
        <ScrollReveal delay={0.3} className="space-y-8 group">
          <div className="flex items-center justify-between border-b border-border/10 pb-4">
            <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
               Strategic Path
            </h3>
            <Link href="/dashboard/jobs" className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2">
              Career Flow <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-5">
            {recentJobs && recentJobs.length > 0 ? (
               recentJobs.map((job: any) => (
                 <div key={job.id} className="group/item p-4 glass-card border border-border/5 rounded-sm hover:-translate-y-1 transition-all duration-300 space-y-2">
                   <h4 className="font-heading text-xl italic tracking-tight group-hover/item:text-primary transition-colors truncate">{job.job_title}</h4>
                   <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted/50 group-hover/item:text-muted/80 transition-colors">
                      <Briefcase className="h-3 w-3" />
                      {job.company}
                   </div>
                 </div>
               ))
            ) : (
               <p className="text-sm italic text-muted/40 font-light px-2">Your career path is waiting.</p>
            )}
          </div>
        </ScrollReveal>
      </div>

    </div>
  )
}
