import { createClient } from "@/lib/supabase/server"
import { 
  FileText, Youtube, Briefcase, Plus, Clock, 
  ArrowUpRight, Zap, Target, BookOpen, Telescope,
  ArrowRight, Shield, ZapOff, CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import * as motion from "framer-motion/client"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

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
  let lastActivity: any[] = []

  try {
    const { data: authData } = await supabase.auth.getUser()
    user = authData?.user
    
    if (user) {
      // Parallel fetch for stats and activity
      const [notesRes, ytRes, jobsRes, logRes] = await Promise.all([
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('yt_summaries').select('*', { count: 'exact', head: true }),
        supabase.from('saved_jobs').select('*', { count: 'exact', head: true }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(5)
      ])

      stats = { 
        notes: notesRes.count || 0, 
        youtube: ytRes.count || 0, 
        jobs: jobsRes.count || 0,
        research: 0 // Will be added once research table is integrated
      }
      lastActivity = logRes.data || []
    }
  } catch (err) {
    console.error("Dashboard data load failure:", err)
  }

  if (!user) return null

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Welcome Hero - Production Grade */}
      <motion.div variants={item} className="relative overflow-hidden p-8 rounded-2xl border border-border bg-card shadow-lg group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <Shield className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <Zap className="h-4 w-4 text-primary fill-primary animate-pulse" />
               <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60">System Synchronized</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Access Granted, <span className="text-primary">{name}</span></h1>
            <p className="text-sm text-muted-foreground font-medium max-w-lg">
              Your technical sanctuary is active. You have {stats.notes} fragments inscribed and {stats.jobs} opportunities identified in this session.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button asChild className="h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/10">
              <Link href="/dashboard/notes/new"><Plus className="h-4 w-4 mr-2" /> New Inscription</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Primary Intelligence Stats */}
      <motion.div variants={item} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fragments" value={stats.notes} icon={BookOpen} description="Knowledge Base" />
        <StatCard label="Syntheses" value={stats.youtube} icon={Youtube} description="Video Intel" />
        <StatCard label="Identified" value={stats.jobs} icon={Target} description="Career Targets" />
        <StatCard label="Scrutiny" value={stats.research} icon={Telescope} description="Deep Research" />
      </motion.div>

      {/* Operational Feed & Controls */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Activity Feed */}
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Operational Feed</h3>
              <p className="text-[9px] font-medium text-muted-foreground/40 uppercase">Real-time action history</p>
            </div>
            <Link href="/dashboard/notes" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Full Ledger</Link>
          </div>

          <div className="grid gap-3">
            {lastActivity.length > 0 ? lastActivity.map((log) => (
              <div key={log.id} className="group p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    log.action_type.includes('created') ? 'bg-emerald-500/10 text-emerald-500' :
                    log.action_type.includes('deleted') ? 'bg-red-500/10 text-red-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    <ActivityIcon type={log.action_type} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{log.action_title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            )) : (
              <div className="p-12 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-4">
                 <ZapOff className="h-8 w-8 text-muted/20" />
                 <p className="text-xs text-muted-foreground font-medium max-w-[200px]">The Operational Feed is currently silent. Build your technical legacy.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Protocols */}
        <motion.div variants={item} className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Quick Protocols</h3>
            <p className="text-[9px] font-medium text-muted-foreground/40 uppercase">Direct access utility</p>
          </div>

          <div className="grid gap-3">
            {[
              { label: "New Fragment", href: "/dashboard/notes/new", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/5" },
              { label: "Scan Video", href: "/dashboard/youtube", icon: Youtube, color: "text-red-500", bg: "bg-red-500/5" },
              { label: "Intelligence Search", href: "/dashboard/research", icon: Telescope, color: "text-purple-500", bg: "bg-purple-500/5" },
              { label: "Career Discovery", href: "/dashboard/jobs", icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/5" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className={`p-2.5 rounded-lg ${action.bg} ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest group-hover:text-primary transition-colors">{action.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-4">
             <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Security Notice</span>
             </div>
             <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">All knowledge fragments and research queries are encrypted and stored in your private sanctuary.</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  if (type.includes('created')) return <CheckCircle2 className="h-4 w-4" />
  return <Zap className="h-4 w-4" />
}
