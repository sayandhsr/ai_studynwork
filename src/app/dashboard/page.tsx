import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Youtube, Briefcase, Plus, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import { AnalyticsCharts } from "./analytics-charts"

export default async function DashboardPage() {
  const supabase = await createClient()

  let user = null
  let stats = { notesCount: 0, ytCount: 0, jobsCount: 0 }
  let activities = { recentNotes: [], recentSummaries: [], recentJobs: [] }

  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user

    if (user) {
      const [
        { count: nC },
        { count: yC },
        { count: jC }
      ] = await Promise.all([
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('yt_summaries').select('*', { count: 'exact', head: true }),
        supabase.from('saved_jobs').select('*', { count: 'exact', head: true })
      ])
      
      stats = { notesCount: nC || 0, ytCount: yC || 0, jobsCount: jC || 0 }

      const [
        { data: rN },
        { data: rS },
        { data: rJ }
      ] = await Promise.all([
        supabase.from('notes').select('id, title, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('yt_summaries').select('id, video_url, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('saved_jobs').select('id, job_title, company, created_at').order('created_at', { ascending: false }).limit(3)
      ])
      
      activities = { 
        recentNotes: rN || [], 
        recentSummaries: rS || [], 
        recentJobs: rJ || [] 
      }
    }
  } catch (err) {
    console.error("Dashboard data fetch error:", err)
  }

  if (!user) return null

  const name = user.user_metadata?.full_name || "User"
  const avatar_url = user.user_metadata?.avatar_url || ""
  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Section */}
      <div className="p-6 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-6">
          <Avatar className="h-16 w-16 border border-primary/20">
            <AvatarImage src={avatar_url} alt={name} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, <span className="text-primary">{name.split(" ")[0]}</span>
            </h1>
            <p className="text-muted-foreground text-xs font-medium">
              Your professional technical sanctuary is ready.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Notes" value={stats.notesCount} icon={FileText} />
        <StatCard label="Videos" value={stats.ytCount} icon={Youtube} />
        <StatCard label="Jobs" value={stats.jobsCount} icon={Briefcase} />
      </div>

      {/* Analytics */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-xs text-primary uppercase tracking-widest font-bold mb-6">Activity Intelligence</h3>
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
              { name: 'Jan', applications: 12 },
              { name: 'Feb', applications: 18 },
              { name: 'Mar', applications: 15 },
              { name: 'Apr', applications: stats.jobsCount },
            ]
          }}
        />
      </div>

      {/* Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Recent Notes</h3>
            <Link href="/dashboard/notes" className="text-[9px] text-primary hover:underline font-bold">VIEW ALL</Link>
          </div>
          <div className="space-y-2">
            {activities.recentNotes.length > 0 ? (
               activities.recentNotes.map((note: any) => (
                 <Link href={`/dashboard/notes/${note.id}`} key={note.id} className="block p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-all">
                   <h4 className="font-semibold text-sm line-clamp-1">{note.title}</h4>
                   <p className="text-[10px] text-muted-foreground mt-1">{new Date(note.created_at).toLocaleDateString()}</p>
                 </Link>
               ))
            ) : (
               <p className="text-xs text-muted-foreground italic p-2">No notes recorded.</p>
            )}
          </div>
        </div>
        {/* YouTube */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Recent Videos</h3>
            <Link href="/dashboard/youtube" className="text-[9px] text-primary hover:underline font-bold">VIEW ALL</Link>
          </div>
          <div className="space-y-2">
            {activities.recentSummaries.length > 0 ? (
               activities.recentSummaries.map((s: any) => (
                 <a href={s.video_url} target="_blank" rel="noreferrer" key={s.id} className="block p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-all">
                   <h4 className="font-semibold text-sm line-clamp-1">Video Insight</h4>
                   <p className="text-[10px] text-muted-foreground mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
                 </a>
               ))
            ) : (
               <p className="text-xs text-muted-foreground italic p-2">No summaries recorded.</p>
            )}
          </div>
        </div>
        {/* Jobs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Career Flow</h3>
            <Link href="/dashboard/jobs" className="text-[9px] text-primary hover:underline font-bold">MANAGE</Link>
          </div>
          <div className="space-y-2">
            {activities.recentJobs.length > 0 ? (
               activities.recentJobs.map((j: any) => (
                 <div key={j.id} className="p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-all">
                   <h4 className="font-semibold text-sm line-clamp-1">{j.job_title}</h4>
                   <p className="text-[10px] text-muted-foreground mt-1">{j.company}</p>
                 </div>
               ))
            ) : (
               <p className="text-xs text-muted-foreground italic p-2">No jobs saved.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
