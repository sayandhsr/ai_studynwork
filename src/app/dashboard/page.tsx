import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Youtube, Briefcase, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import { AnalyticsCharts } from "./analytics-charts"

export default async function DashboardPage() {
  const supabase = await createClient()

  let user = null
  let stats = { notes: 0, youtube: 0, jobs: 0 }
  let recent = { notes: [], youtube: [], jobs: [] }

  try {
    const { data: authData } = await supabase.auth.getUser()
    user = authData?.user

    if (user) {
      // Safe data fetching with fallbacks to prevent 500 errors
      const [notesRes, ytRes, jobsRes] = await Promise.all([
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('yt_summaries').select('*', { count: 'exact', head: true }),
        supabase.from('saved_jobs').select('*', { count: 'exact', head: true })
      ])

      stats = {
        notes: notesRes.count || 0,
        youtube: ytRes.count || 0,
        jobs: jobsRes.count || 0
      }

      const [rNotesRes, rYtRes, rJobsRes] = await Promise.all([
        supabase.from('notes').select('id, title, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('yt_summaries').select('id, video_url, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('saved_jobs').select('id, job_title, company, created_at').order('created_at', { ascending: false }).limit(3)
      ])

      recent = {
        notes: rNotesRes.data || [],
        youtube: rYtRes.data || [],
        jobs: rJobsRes.data || []
      }
    }
  } catch (err) {
    console.error("Critical: Dashboard data fetch error", err)
    // Fallback stays as default empty state
  }

  if (!user) return null

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Explorer"
  const avatar_url = user.user_metadata?.avatar_url || ""
  const initials = name.substring(0, 2).toUpperCase()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header Panel - Professional Clean */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-8 rounded-2xl border border-primary/10 bg-card shadow-sm">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src={avatar_url} alt={name} />
          <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, <span className="text-primary">{name}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Manage your high-performance career sanctuary.
          </p>
        </div>
      </div>

      {/* Stats - Grid 3 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Technical Notes" value={stats.notes} icon={FileText} />
        <StatCard label="Video Insights" value={stats.youtube} icon={Youtube} />
        <StatCard label="Strategic Roles" value={stats.jobs} icon={Briefcase} />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-8 lg:grid-cols-2">
         {/* Analytics Layer */}
         <div className="p-6 rounded-2xl border border-border bg-card/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Intelligence Flow</h3>
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
         </div>

         {/* Recent Actions List */}
         <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Fragments</h3>
            
            <div className="space-y-3">
              {recent.notes.map((note) => (
                <Link 
                  href={`/dashboard/notes/${note.id}`} 
                  key={note.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/5 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                       <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{note.title}</h4>
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-0.5">
                          {new Date(note.created_at).toLocaleDateString()}
                       </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </Link>
              ))}
              
              {recent.notes.length === 0 && (
                <p className="text-xs text-muted-foreground italic px-2">No wisdom captured yet.</p>
              )}
            </div>

            <Button asChild variant="ghost" className="w-full h-10 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5">
              <Link href="/dashboard/notes">Access All Records <ArrowRight className="h-3 w-3 ml-2" /></Link>
            </Button>
         </div>
      </div>
    </div>
  )
}
