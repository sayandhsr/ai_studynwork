import { createClient } from "@/lib/supabase/server"
import { 
  FileText, Youtube, Briefcase, 
  Search, Plus, Sparkles, Clock, ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Optimized Fetching
  const [notes, yt, jobs] = await Promise.all([
    supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(4),
    supabase.from("yt_summaries").select("*", { count: "exact", head: true }),
    supabase.from("saved_jobs").select("*", { count: "exact", head: true }),
  ])

  const stats = [
    { label: "Total Notes", value: notes.data?.length || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Summaries", value: yt.count || 0, icon: Youtube, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Jobs Tracked", value: jobs.count || 0, icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Minimal Welcome */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Welcome back</h1>
        <p className="text-sm text-muted-foreground font-medium max-w-xl">
          Your centralized command for technical notes, video synthesis, and job discovery.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Create Note", icon: Plus, href: "/dashboard/notes/new", color: "text-blue-400" },
          { label: "Summarize", icon: Youtube, href: "/dashboard/youtube", color: "text-red-400" },
          { label: "Research", icon: Search, href: "/dashboard/research", color: "text-purple-400" },
          { label: "Job Search", icon: Briefcase, href: "/dashboard/jobs", color: "text-emerald-400" },
        ].map((action) => (
          <Button key={action.label} variant="outline" asChild className="h-16 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] active:scale-95 transition-all shadow-sm">
            <Link href={action.href} className="flex items-center gap-4 px-4">
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-[11px] font-bold uppercase tracking-widest">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-white/5 bg-white/[0.02] overflow-hidden group hover:border-white/10 transition-all">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-4xl font-black italic tracking-tighter text-white">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Notes (Activity) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Notes
          </h3>
          <Link href="/dashboard/notes" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.data?.length ? (
            notes.data.map((note) => (
              <Link key={note.id} href={`/dashboard/notes/${note.id}`} className="group p-6 bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all rounded-2xl flex justify-between items-center">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-white group-hover:text-primary transition-colors">{note.title || "Note Update"}</h4>
                  <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 opacity-50 uppercase tracking-widest">
                    Captured {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-all group-hover:translate-x-1" />
              </Link>
            ))
          ) : (
            <div className="col-span-full py-16 text-center border border-dashed border-white/5 rounded-3xl">
              <Sparkles className="h-8 w-8 text-white/5 mx-auto mb-4" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Begin captured your thoughts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
