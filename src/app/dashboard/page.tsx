import { createClient } from "@/lib/supabase/server"
import { 
  FileText, Youtube, Briefcase, 
  Sparkles, Clock, ArrowRight,
  TrendingUp, Activity, Zap
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts"

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
    { label: "Total Notes", value: notesCount.count || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Video Summaries", value: ytCount.count || 0, icon: Youtube, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Job Opportunities", value: jobsCount.count || 0, icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  // Mock data for the graph (would ideally be aggregated from Supabase)
  const usageData = [
    { name: "Mon", value: 4 },
    { name: "Tue", value: 7 },
    { name: "Wed", value: 5 },
    { name: "Thu", value: 12 },
    { name: "Fri", value: 8 },
    { name: "Sat", value: 15 },
    { name: "Sun", value: 10 },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Welcome Hero */}
      <div className="relative p-10 rounded-3xl bg-secondary/30 border border-border/50 overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <Zap className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Welcome back, <span className="text-primary">{user.email?.split('@')[0]}</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl">
              Your personal intelligence engine is ready. Explore your saved insights and market opportunities.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
             <Button asChild className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Link href="/dashboard/notes/new">Inscribe New Note</Link>
             </Button>
             <Button variant="outline" asChild className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[11px] bg-background/50 hover:bg-accent active:scale-[0.98] transition-all">
                <Link href="/dashboard/youtube">Summarize Video</Link>
             </Button>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Usage Analytics Graph */}
        <Card className="lg:col-span-2 rounded-3xl border-border/10 bg-card/30 backdrop-blur-sm p-6 space-y-6">
          <div className="space-y-1">
             <h3 className="text-lg font-bold tracking-tight">Usage Analysis</h3>
             <p className="text-xs text-muted-foreground font-medium">Activity trends over the last 7 tactical days.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Options / Analysis */}
        <div className="space-y-6">
           <Card className="rounded-3xl border-border/10 bg-card/30 backdrop-blur-sm p-6 space-y-6">
              <div className="space-y-1 border-b border-border/10 pb-4">
                 <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Growth Sync
                 </h3>
              </div>
              <div className="space-y-8">
                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes Density</p>
                       <p className="text-xs font-black text-primary">{(notesCount.count || 0) * 5}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min((notesCount.count || 0) * 5, 100)}%` }} />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Video Intake</p>
                       <p className="text-xs font-black text-primary">{(ytCount.count || 0) * 10}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                       <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${Math.min((ytCount.count || 0) * 10, 100)}%` }} />
                    </div>
                 </div>
                 <div className="pt-4 space-y-3">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">System Status</p>
                       <p className="text-sm font-bold text-foreground">Optimal Performance</p>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/10 pb-4">
           <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Latest Captured Insights
           </h3>
           <Link href="/dashboard/notes" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View Ledger</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentNotes.data?.length ? (
            recentNotes.data.map((note) => (
              <Link key={note.id} href={`/dashboard/notes/${note.id}`} className="group p-6 bg-card/20 border border-border/50 hover:border-primary/20 transition-all rounded-3xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-bold text-base tracking-tight group-hover:text-primary transition-colors line-clamp-1">{note.title || "New Note"}</h4>
                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-medium leading-relaxed">{note.content?.replace(/<[^>]*>/g, '').substring(0, 120)}...</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-10 text-center border border-dashed border-border/20 rounded-3xl">
              <p className="text-xs text-muted font-bold uppercase tracking-widest">Your insight ledger is currently empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
