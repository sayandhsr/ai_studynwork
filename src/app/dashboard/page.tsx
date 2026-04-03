import { createClient } from "@/lib/supabase/server"
import { 
  FileText, Youtube, Briefcase, Plus, Clock, 
  ArrowUpRight, Zap, Target, BookOpen, Telescope,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import * as motion from "framer-motion/client"
import { Button } from "@/components/ui/button"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  let user = null
  let stats = { notes: 0, youtube: 0, jobs: 0, research: 0 }
  let recentNotes: any[] = []
  let recentJobs: any[] = []

  try {
    const { data: authData } = await supabase.auth.getUser()
    user = authData?.user
  } catch {
    // Auth failed - render fallback
  }

  if (user) {
    // Fetch each stat independently - never crash if a table doesn't exist
    try { const { count } = await supabase.from('notes').select('*', { count: 'exact', head: true }); stats.notes = count || 0 } catch {}
    try { const { count } = await supabase.from('yt_summaries').select('*', { count: 'exact', head: true }); stats.youtube = count || 0 } catch {}
    try { const { count } = await supabase.from('saved_jobs').select('*', { count: 'exact', head: true }); stats.jobs = count || 0 } catch {}

    // Fetch recent items independently
    try { const { data } = await supabase.from('notes').select('id, title, created_at').order('created_at', { ascending: false }).limit(3); recentNotes = data || [] } catch {}
    try { const { data } = await supabase.from('saved_jobs').select('id, job_title, company, created_at').order('created_at', { ascending: false }).limit(3); recentJobs = data || [] } catch {}
  }

  if (!user) return null

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Welcome Card */}
      <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, <span className="text-primary">{name}</span></h1>
          <p className="text-sm text-muted-foreground">Your workspace is synced. {stats.notes} notes · {stats.youtube} summaries · {stats.jobs} jobs tracked.</p>
        </div>
        <Button asChild className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-md">
          <Link href="/dashboard/notes/new"><Plus className="h-4 w-4 mr-2" /> New Note</Link>
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="Notes" value={stats.notes} icon={BookOpen} description="Saved notes" trend={{ value: 0, isUp: true }} />
        <StatCard label="Summaries" value={stats.youtube} icon={Youtube} description="Videos analyzed" trend={{ value: 0, isUp: true }} />
        <StatCard label="Jobs Tracked" value={stats.jobs} icon={Target} description="Opportunities" trend={{ value: 0, isUp: true }} />
        <StatCard label="Research" value={stats.research} icon={Telescope} description="Queries run" trend={{ value: 0, isUp: true }} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Create Note", href: "/dashboard/notes/new", icon: FileText, color: "bg-blue-500/10 text-blue-500" },
          { label: "Summarize Video", href: "/dashboard/youtube", icon: Youtube, color: "bg-red-500/10 text-red-500" },
          { label: "Start Research", href: "/dashboard/research", icon: Telescope, color: "bg-purple-500/10 text-purple-500" },
          { label: "Search Jobs", href: "/dashboard/jobs", icon: Briefcase, color: "bg-emerald-500/10 text-emerald-500" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className={`p-2 rounded-lg ${action.color}`}>
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold group-hover:text-primary transition-colors">{action.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </motion.div>

      {/* Recent Activity + Recent Data */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Recent Activity</h3>
            <Link href="/dashboard/notes" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">View All</Link>
          </div>

          <div className="space-y-2">
            {recentNotes.length > 0 ? recentNotes.map((note) => (
              <Link
                href={`/dashboard/notes/${note.id}`}
                key={note.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/5 text-primary">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{note.title || "Untitled"}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {timeAgo(note.created_at)}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0" />
              </Link>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No notes yet. Create your first one!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tracked Jobs Preview */}
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Tracked Jobs</h3>
            <Link href="/dashboard/jobs" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Search Jobs</Link>
          </div>

          <div className="space-y-2">
            {recentJobs.length > 0 ? recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/5 text-emerald-500">
                    <Briefcase className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{job.job_title}</p>
                    <p className="text-[10px] text-muted-foreground">{job.company}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  {timeAgo(job.created_at)}
                </p>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No tracked jobs yet. Start searching!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "just now"
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
