import { createClient } from "@/lib/supabase/server"
import { 
  FileText, Youtube, Briefcase, Plus, Clock, 
  ArrowUpRight, Telescope, ArrowRight, Shield
} from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import * as motion from "framer-motion/client"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

export default async function DashboardPage() {
  const supabase = await createClient()

  let user = null
  let stats = { notes: 0, summaries: 0, research: 0 }
  let recentNotes: any[] = []

  try {
    const { data: authData } = await supabase.auth.getUser()
    user = authData?.user
    
    if (user) {
      // Parallel fetch for stats and recent notes - Optimized for speed
      const [notesCountRes, recentNotesRes] = await Promise.all([
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('id, title, created_at').order('created_at', { ascending: false }).limit(3)
      ])

      stats.notes = notesCountRes.count || 0
      recentNotes = recentNotesRes.data || []
    }
  } catch (err) {
    console.error("Dashboard minimal load failure:", err)
  }

  if (!user) return null

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground font-medium">Overview of your activity and quick access to tools.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard label="Total Fragments" value={stats.notes} icon={FileText} description="Knowledge Base" />
        <StatCard label="YouTube Intel" value={0} icon={Youtube} description="Summaries Created" />
        <StatCard label="Scrutiny" value={0} icon={Telescope} description="Research Queries" />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-primary rounded-full" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Quick Protocols</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Knowledge Base", href: "/dashboard/notes", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/5", desc: "Access your fragments" },
              { label: "Video Intel", href: "/dashboard/youtube", icon: Youtube, color: "text-red-500", bg: "bg-red-500/5", desc: "Summarize YouTube" },
              { label: "Deep Research", href: "/dashboard/research", icon: Telescope, color: "text-purple-500", bg: "bg-purple-500/5", desc: "AI-powered scrutiny" },
              { label: "Career Targets", href: "/dashboard/jobs", icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/5", desc: "Search and track jobs" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group p-5 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-primary/40 transition-all shadow-sm flex flex-col gap-3"
              >
                <div className={`p-2.5 w-fit rounded-xl ${action.bg} ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Fragments */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-primary rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Recent Fragments</h3>
            </div>
            <Link href="/dashboard/notes" className="text-[11px] font-bold text-primary hover:underline uppercase tracking-tighter">View All</Link>
          </div>

          <div className="space-y-3">
            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <Link 
                  key={note.id} 
                  href={`/dashboard/notes/${note.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/30 hover:bg-card transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-semibold truncate max-w-[200px]">{note.title || "Untitled"}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-10 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-3">
                <FileText className="h-8 w-8 text-muted/10" />
                <p className="text-xs text-muted-foreground font-medium">No fragments found yet.</p>
                <Button asChild variant="outline" size="sm" className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-widest">
                  <Link href="/dashboard/notes/new">Inscribe Now</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-primary/[0.02] border border-primary/5 flex items-center gap-4">
        <Shield className="h-5 w-5 text-primary/40" />
        <p className="text-xs text-muted-foreground font-medium">Platform status: <span className="text-emerald-500 font-bold uppercase tracking-tighter ml-1">Optimal</span> (Alpha v9.5)</p>
      </div>
    </div>
  )
}
