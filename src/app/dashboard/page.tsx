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
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">
      {/* Editorial Welcome */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
           <div className="h-[1px] w-8 bg-primary/30" />
           <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/60">System Status: Active</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
          Welcome to the <br/>
          <span className="text-primary italic">Sanctuary.</span>
        </h1>
        <p className="text-base text-muted-foreground font-medium max-w-xl leading-relaxed">
          Your centralized intelligence hub for technical notes, video synthesis, and strategic job discovery.
        </p>
      </div>

      {/* Quick Actions - Floating Premium Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Create Note", icon: Plus, href: "/dashboard/notes/new", color: "text-blue-500", bg: "bg-blue-500/5" },
          { label: "Youtube Scribe", icon: Youtube, href: "/dashboard/youtube", color: "text-red-500", bg: "bg-red-500/5" },
          { label: "Deep Research", icon: Search, href: "/dashboard/research", color: "text-purple-500", bg: "bg-purple-500/5" },
          { label: "Career Search", icon: Briefcase, href: "/dashboard/jobs", color: "text-emerald-500", bg: "bg-emerald-500/5" },
        ].map((action) => (
          <Button key={action.label} variant="outline" asChild className="h-28 rounded-3xl ios-card ios-shadow border-border/50 bg-card hover:bg-secondary/50 group premium-hover transition-all">
            <Link href={action.href} className="flex flex-col items-center justify-center gap-3 px-4">
              <div className={`p-3 rounded-2xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Stats Cards - Enhanced Depth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="ios-card ios-shadow p-8 flex items-center justify-between group hover:border-primary/20 transition-all cursor-default">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">{stat.label}</p>
              <p className="text-5xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">{stat.value}</p>
            </div>
            <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center ios-shadow group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-7 w-7" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Notes - Activity Flow */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground">Recent Intel</h3>
          </div>
          <Link href="/dashboard/notes" className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:opacity-70 transition-opacity">Expand All</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes.data?.length ? (
            notes.data.map((note) => (
              <Link key={note.id} href={`/dashboard/notes/${note.id}`} className="group p-8 ios-card ios-shadow hover:border-primary/30 transition-all premium-hover flex justify-between items-center">
                <div className="space-y-3">
                  <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{note.title || "Observation Update"}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                      Captured {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-border" />
                    <Sparkles className="h-3 w-3 text-primary opacity-50" />
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center ios-shadow border border-dashed border-border rounded-[32px] bg-secondary/10">
              <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-5 w-5 text-primary opacity-40" />
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em]">Begin capturing your intelligence</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
