import { createClient } from "@/lib/supabase/server"
import { 
  FileText, Youtube, Briefcase, 
  Clock, ArrowRight, TrendingUp, 
  Activity, Zap, Plus, Wand2, Search, Telescope
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Parallel data fetching for maximum performance
  const [notesCount, ytCount, jobsCount, resCount, recentActivity] = await Promise.all([
    supabase.from("notes").select("*", { count: "exact", head: true }),
    supabase.from("yt_summaries").select("*", { count: "exact", head: true }),
    supabase.from("saved_jobs").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*", { count: "exact", head: true }).ilike("category", "technical"), // Representing research queries
    supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(4)
  ])

  const stats = [
    { label: "Total Notes", value: notesCount.count || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "YouTube Summaries", value: ytCount.count || 0, icon: Youtube, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Research Queries", value: resCount.count || 0, icon: Telescope, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Jobs Saved", value: jobsCount.count || 0, icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  const usageData = [
    { name: "Mon", value: 4 }, { name: "Tue", value: 7 }, { name: "Wed", value: 5 },
    { name: "Thu", value: 12 }, { name: "Fri", value: 8 }, { name: "Sat", value: 15 }, { name: "Sun", value: 10 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      {/* Welcome Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Welcome back, <span className="text-primary">{user.email?.split('@')[0]}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl">
            Streamline your productivity with cross-platform notes, intelligent video synthesis, and strategic job discovery.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { label: "Create Note", icon: Plus, href: "/dashboard/notes/new", color: "bg-blue-500/10 text-blue-500" },
             { label: "Summarize Video", icon: Wand2, href: "/dashboard/youtube", color: "bg-red-500/10 text-red-500" },
             { label: "Deep Research", icon: Search, href: "/dashboard/research", color: "bg-purple-500/10 text-purple-500" },
             { label: "Search Jobs", icon: Briefcase, href: "/dashboard/jobs", color: "bg-emerald-500/10 text-emerald-500" },
           ].map((action) => (
             <Button key={action.label} variant="outline" asChild className="h-16 rounded-2xl border-white/5 bg-card/40 hover:bg-accent active:scale-95 transition-all shadow-sm">
                <Link href={action.href} className="flex items-center gap-4 px-4">
                   <div className={`p-2 rounded-xl ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                   </div>
                   <span className="text-xs font-bold uppercase tracking-widest">{action.label}</span>
                </Link>
             </Button>
           ))}
        </div>
      </div>

      {/* Stats & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
           <div className="flex items-center gap-2 mb-2 px-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Snapshot Analysis</h3>
           </div>
           <div className="grid grid-cols-1 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="rounded-2xl border-white/5 bg-card/30 backdrop-blur-sm group hover:border-primary/20 transition-all">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                      <h4 className="text-2xl font-black italic tracking-tight">{stat.value}</h4>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </div>

        {/* Analytics Graph */}
        <Card className="lg:col-span-2 rounded-3xl border-white/5 bg-card/30 backdrop-blur-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
               <h3 className="text-lg font-bold tracking-tight">System Activity</h3>
               <p className="text-xs text-muted-foreground font-medium italic">Tactical engagement metrics over 7 days.</p>
            </div>
            <Activity className="h-5 w-5 text-primary opacity-20" />
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#dashboardArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activity Ledger */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
           <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Updates
           </h3>
           <Link href="/dashboard/notes" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentActivity.data?.length ? (
            recentActivity.data.map((item) => (
              <Link key={item.id} href={`/dashboard/notes/${item.id}`} className="group p-5 bg-card/20 border border-white/5 hover:border-primary/20 transition-all rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                   <Zap className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors line-clamp-1">{item.title || "Note Update"}</h4>
                    <ArrowRight className="h-3 w-3 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 font-medium leading-relaxed opacity-70 italic">{item.content?.replace(/<[^>]*>/g, '').substring(0, 80)}...</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-3xl group">
              <Zap className="h-8 w-8 text-primary/10 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Awaiting primary intake data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
