import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Youtube, Briefcase, Plus, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import { AnalyticsCharts } from "./analytics-charts"
import { ScrollReveal } from "@/components/reveal"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch user data
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch real stats
  const [
    { count: notesCount },
    { count: ytCount },
    { count: jobsCount }
  ] = await Promise.all([
    supabase.from('notes').select('*', { count: 'exact', head: true }),
    supabase.from('yt_summaries').select('*', { count: 'exact', head: true }),
    supabase.from('saved_jobs').select('*', { count: 'exact', head: true })
  ])

  // Fetch recent activity
  const [
    { data: recentNotes },
    { data: recentSummaries },
    { data: recentJobs }
  ] = await Promise.all([
    supabase.from('notes').select('id, title, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('yt_summaries').select('id, video_url, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('saved_jobs').select('id, job_title, company, created_at').order('created_at', { ascending: false }).limit(3)
  ])

  const name = user.user_metadata?.full_name || "User"
  const avatar_url = user.user_metadata?.avatar_url || ""
  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section - Clean SaaS Style */}
      <div className="p-8 bg-black/30 border border-yellow-500/10 rounded-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-20 w-20 border border-yellow-500/20">
            <AvatarImage src={avatar_url} alt={name} />
            <AvatarFallback className="text-2xl font-semibold bg-yellow-500/10 text-yellow-500">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-3xl font-semibold text-white">
              Welcome, <span className="text-yellow-500">{name.split(" ")[0]}</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-xl">
              Manage your technical notes, video insights, and career growth in one professional sanctuary.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Notes Saved" value={notesCount || 0} icon={FileText} />
        <StatCard label="Video Insights" value={ytCount || 0} icon={Youtube} />
        <StatCard label="Jobs Saved" value={jobsCount || 0} icon={Briefcase} />
      </div>

      {/* Analytics */}
      <div className="rounded-xl border border-yellow-500/10 bg-black/20 p-6">
        <h3 className="text-xs text-yellow-500 uppercase tracking-widest font-semibold mb-6">Activity Intelligence</h3>
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
              { name: 'Apr', applications: jobsCount || 0 },
            ]
          }}
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Notes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Latest Notes</h3>
            <Link href="/dashboard/notes" className="text-[10px] text-yellow-500 hover:underline uppercase font-bold tracking-widest">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentNotes && recentNotes.length > 0 ? (
               recentNotes.map((note: any) => (
                 <Link href={`/dashboard/notes/${note.id}`} key={note.id} className="block p-4 rounded-lg border border-yellow-500/5 bg-black/30 hover:border-yellow-500/20 transition-all duration-200">
                   <h4 className="font-medium text-white text-sm line-clamp-1">{note.title}</h4>
                   <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(note.created_at).toLocaleDateString()}
                   </div>
                 </Link>
               ))
            ) : (
               <p className="text-xs text-gray-600 italic">No notes yet.</p>
            )}
          </div>
        </div>
        
        {/* Recent Summaries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Video Insights</h3>
            <Link href="/dashboard/youtube" className="text-[10px] text-yellow-500 hover:underline uppercase font-bold tracking-widest">
              View All
            </Link>
          </div>
          <div className="space-y-3">
             {recentSummaries && recentSummaries.length > 0 ? (
               recentSummaries.map((summary: any) => (
                 <a href={summary.video_url} target="_blank" rel="noreferrer" key={summary.id} className="block p-4 rounded-lg border border-yellow-500/5 bg-black/30 hover:border-yellow-500/20 transition-all duration-200">
                   <h4 className="font-medium text-white text-sm line-clamp-1">Video Summary</h4>
                   <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(summary.created_at).toLocaleDateString()}
                   </div>
                 </a>
               ))
            ) : (
               <p className="text-xs text-gray-600 italic">No summaries yet.</p>
            )}
          </div>
        </div>
        
        {/* Jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Career Path</h3>
            <Link href="/dashboard/jobs" className="text-[10px] text-yellow-500 hover:underline uppercase font-bold tracking-widest">
              Manage Jobs
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs && recentJobs.length > 0 ? (
               recentJobs.map((job: any) => (
                 <div key={job.id} className="p-4 rounded-lg border border-yellow-500/5 bg-black/30 hover:border-yellow-500/20 transition-all duration-200">
                   <h4 className="font-medium text-white text-sm line-clamp-1">{job.job_title}</h4>
                   <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                      <Briefcase className="h-3 w-3" />
                      {job.company}
                   </div>
                 </div>
               ))
            ) : (
               <p className="text-xs text-gray-600 italic">No jobs saved yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
