import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Youtube, Briefcase, FileEdit, Activity, Sparkles, Plus } from "lucide-react"
import Link from "next/link"

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
    <div className="space-y-12 pb-16 font-serif selection:bg-primary/20">
      {/* Welcome Section - Humanized Sanctuary */}
      <div className="relative overflow-hidden p-10 bg-card border border-border/40 group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:opacity-10 transition-all duration-1000">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <Avatar className="h-24 w-24 ring-2 ring-primary/20 shadow-2xl">
            <AvatarImage src={avatar_url} alt={name} />
            <AvatarFallback className="text-3xl font-heading italic bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="h-px w-8 bg-primary/40" />
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">Study Sanctuary</span>
              <div className="h-px w-8 bg-primary/40 md:hidden" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading tracking-tight italic">
              Welcome back, {name}!
            </h1>
            <p className="text-foreground/70 text-lg font-light leading-relaxed">
              "Every note is a grain of wisdom; Every summary, a path to mastery."
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards - Refined & Symmetrical */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Notes Saved", count: notesCount, icon: FileText, color: "primary" },
          { label: "YT Summaries", count: ytCount, icon: Youtube, color: "primary" },
          { label: "Saved Jobs", count: jobsCount, icon: Briefcase, color: "primary" },
          { label: "Resumes Built", count: resumesCount, icon: FileEdit, color: "primary" }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-8 group border-border/30 hover:border-primary/40">
            <div className="flex flex-row items-center justify-between pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">
                {stat.label}
              </span>
              <stat.icon className="h-4 w-4 opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all" />
            </div>
            <div className="text-5xl font-heading tracking-tighter">{stat.count || 0}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity - Minimalist Parchment Style */}
      <div className="grid gap-12 lg:grid-cols-3 pt-4">
        {/* Latest Notes */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-border/30 pb-4">
            <h3 className="text-sm font-bold tracking-[0.3em] uppercase opacity-60">Latest Notes</h3>
            <Link href="/dashboard/notes" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-6">
            {recentNotes && recentNotes.length > 0 ? (
               recentNotes.map((note) => (
                 <div key={note.id} className="group cursor-pointer space-y-1">
                   <h4 className="font-heading text-xl italic tracking-tight group-hover:text-primary transition-colors truncate">{note.title}</h4>
                   <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{new Date(note.created_at).toLocaleDateString()}</span>
                 </div>
               ))
            ) : (
               <p className="text-sm italic opacity-40 font-light">No wisdom captured yet.</p>
            )}
          </div>
        </div>
        
        {/* Recent Summaries */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-border/30 pb-4">
            <h3 className="text-sm font-bold tracking-[0.3em] uppercase opacity-60">Recent Summaries</h3>
            <Link href="/dashboard/youtube" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-6">
             {recentSummaries && recentSummaries.length > 0 ? (
               recentSummaries.map((summary) => (
                 <div key={summary.id} className="group cursor-pointer space-y-1">
                   <a href={summary.video_url} target="_blank" rel="noreferrer" className="font-heading text-xl italic tracking-tight group-hover:text-primary transition-colors truncate block">
                      Visual Insights 
                   </a>
                   <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{new Date(summary.created_at).toLocaleDateString()}</span>
                 </div>
               ))
            ) : (
               <p className="text-sm italic opacity-40 font-light">The screen is yet to speak.</p>
            )}
          </div>
        </div>
        
        {/* Active Applications */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-border/30 pb-4">
            <h3 className="text-sm font-bold tracking-[0.3em] uppercase opacity-60">Active Journey</h3>
            <Link href="/dashboard/jobs" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-6">
            {recentJobs && recentJobs.length > 0 ? (
               recentJobs.map((job) => (
                 <div key={job.id} className="group space-y-1">
                   <h4 className="font-heading text-xl italic tracking-tight group-hover:text-primary transition-colors truncate">{job.job_title}</h4>
                   <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{job.company}</span>
                 </div>
               ))
            ) : (
               <p className="text-sm italic opacity-40 font-light">Your career path is waitng.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
