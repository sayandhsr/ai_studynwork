import { createClient } from "@/lib/supabase/server"
import { 
  FileText, Youtube, Briefcase, 
  Sparkles, Clock, ArrowRight,
  TrendingUp, Activity, Zap
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Parallel data fetching for sub-1s performance
  const [notesCount, ytCount, jobsCount, recentNotes] = await Promise.all([
    supabase.from("notes").select("*", { count: "exact", head: true }),
    supabase.from("yt_summaries").select("*", { count: "exact", head: true }),
    supabase.from("saved_jobs").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(3)
  ])

  const stats = [
    { label: "Intel Fragments", value: notesCount.count || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Video Synthesis", value: ytCount.count || 0, icon: Youtube, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Market Vectors", value: jobsCount.count || 0, icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
          <Activity className="h-3 w-3" />
          System Operational
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">Command Center</h1>
            <p className="text-muted-foreground font-medium text-sm">Strategic overview of your intellectual property and market positioning.</p>
          </div>
          <Button asChild className="rounded-none px-8 font-bold uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-primary/20">
            <Link href="/dashboard/notes/new">Initialize New Fragment</Link>
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="rounded-none border-border/10 bg-card/30 backdrop-blur-sm hover:border-primary/20 transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 ${stat.color}`}>
              <stat.icon className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${stat.bg} border border-current`} />
                {stat.label}
              </CardDescription>
              <CardTitle className="text-4xl font-black italic">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase opacity-40">
                <Zap className="h-3 w-3" /> Live Telemetry
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Analysis/Updates */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/10 pb-4">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Analysis
             </h3>
             <Link href="/dashboard/notes" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {recentNotes.data?.length ? (
              recentNotes.data.map((note) => (
                <Link key={note.id} href={`/dashboard/notes/${note.id}`} className="group block p-6 bg-card/20 border border-border/50 hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{note.title || "Untitled Fragment"}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 italic font-medium">{note.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-10 text-center border border-dashed border-border/20 rounded-lg">
                <p className="text-xs text-muted font-bold uppercase tracking-widest">Awaiting intake data</p>
              </div>
            )}
          </div>
        </div>

        {/* System Usage / Analysis */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/10 pb-4">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Growth Velocity
             </h3>
          </div>
          <div className="p-8 bg-primary/5 border border-primary/10 space-y-8 relative overflow-hidden">
             <div className="absolute -bottom-4 -right-4 opacity-[0.05]">
                <Activity className="h-32 w-32" />
             </div>
             <div className="space-y-2 relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Intelligence Saturation</p>
                <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min(((notesCount.count || 0) + (ytCount.count || 0)) * 2, 100)}%` }} 
                   />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                   <span>Initial Phase</span>
                   <span>Massive Saturation</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="space-y-1">
                   <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Market Readiness</p>
                   <p className="text-xl font-black italic">{(jobsCount.count || 0) > 0 ? "OPTIMAL" : "MINIMAL"}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Synthesis Rate</p>
                   <p className="text-xl font-black italic">{(ytCount.count || 0) > 5 ? "ELEVATED" : "STABLE"}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
