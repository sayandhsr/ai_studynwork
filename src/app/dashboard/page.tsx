import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  FileText, Youtube, Briefcase, Plus, Clock, 
  ArrowUpRight, Zap, Target, BookOpen 
} from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import { AnalyticsCharts } from "./analytics-charts"
import * as motion from "framer-motion/client"
import { Button } from "@/components/ui/button"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  let user = null
  let stats = { notes: 0, youtube: 0, jobs: 0 }
  let recent = { notes: [], youtube: [], jobs: [] }

  try {
    const { data: authData } = await supabase.auth.getUser()
    user = authData?.user

    if (user) {
      const [{ count: nC }, { count: yC }, { count: jC }] = await Promise.all([
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('yt_summaries').select('*', { count: 'exact', head: true }),
        supabase.from('saved_jobs').select('*', { count: 'exact', head: true })
      ])
      stats = { notes: nC || 0, youtube: yC || 0, jobs: jC || 0 }

      const [{ data: rN }, { data: rY }, { data: rJ }] = await Promise.all([
        supabase.from('notes').select('id, title, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('yt_summaries').select('id, video_url, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('saved_jobs').select('id, job_title, company, created_at').order('created_at', { ascending: false }).limit(3)
      ])
      recent = { notes: rN || [], youtube: rY || [], jobs: rJ || [] }
    }
  } catch (err) {
    console.error("Dashboard error", err)
  }

  if (!user) return null

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  const avatar_url = user.user_metadata?.avatar_url || ""

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto px-4 py-8 space-y-8"
    >
      {/* Welcome Hero */}
      <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <Zap className="w-32 h-32" />
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <Avatar className="h-16 w-16 ring-4 ring-primary/10">
            <AvatarImage src={avatar_url} alt={name} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Good day, <span className="text-primary">{name}</span>.</h1>
            <p className="text-sm text-muted-foreground font-medium">Your strategic workspace is synced and ready.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <Button className="flex-1 md:flex-none h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10">
              <Plus className="h-4 w-4 mr-2" /> Quick Action
           </Button>
        </div>
      </motion.div>

      {/* High Performance Stats */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Knowledge Base" value={stats.notes} icon={BookOpen} description="Documented insights" trend={{ value: 12, isUp: true }} />
        <StatCard label="Video Intelligence" value={stats.youtube} icon={Youtube} description="Synthesized hours" trend={{ value: 5, isUp: true }} />
        <StatCard label="Strategic Roles" value={stats.jobs} icon={Target} description="Tracked opportunities" trend={{ value: 2, isUp: false }} />
      </motion.div>

      {/* Main Operational Layer */}
      <div className="grid gap-8 lg:grid-cols-2">
         {/* System Analytics */}
         <motion.div variants={item} className="card-premium p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Intelligence Flow</h3>
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Synthetic processing trends</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/5 text-primary">
                <Zap className="h-4 w-4" />
              </div>
            </div>
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
                  { name: 'Apr', applications: stats.jobs },
                ]
              }}
            />
         </motion.div>

         {/* Activity & Feed */}
         <motion.div variants={item} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Operational Feed</h3>
              <Link href="/dashboard/notes" className="text-[9px] font-bold text-primary hover:underline uppercase tracking-widest">Full History</Link>
            </div>
            
            <div className="grid gap-3">
              {recent.notes.slice(0, 3).map((note) => (
                <Link 
                  href={`/dashboard/notes/${note.id}`} 
                  key={note.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2.5 rounded-lg bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                       <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{note.title || "Untitled"}</h4>
                       <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(note.created_at || Date.now()), { addSuffix: true })}</span>
                       </div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
              ))}
              
              {stats.youtube > 0 && recent.youtube.slice(0, 2).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/40 hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2.5 rounded-lg bg-red-500/5 text-red-500/60">
                      <Youtube className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                       <h4 className="text-sm font-bold text-foreground truncate">Video Synthesis Recorded</h4>
                       <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">Automated Intelligence</p>
                    </div>
                  </div>
                  <Link href="/dashboard/youtube" className="text-[9px] font-bold text-primary hover:underline uppercase tracking-widest">View</Link>
                </div>
              ))}

              {stats.notes === 0 && (
                <div className="p-8 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-4">
                   <Zap className="h-8 w-8 text-muted/20" />
                   <p className="text-xs text-muted-foreground font-medium max-w-[200px]">The Operational Feed is currently silent. Build your sanctuary.</p>
                </div>
              )}
            </div>
         </motion.div>
      </div>
    </motion.div>
  )
}

function formatDistanceToNow(date: Date, options: { addSuffix: boolean }) {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
