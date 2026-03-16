import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Youtube, Briefcase, FileEdit, Activity } from "lucide-react"

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
    { count: jobsCount },
    { count: resumesCount }
  ] = await Promise.all([
    supabase.from('notes').select('*', { count: 'exact', head: true }),
    supabase.from('yt_summaries').select('*', { count: 'exact', head: true }),
    supabase.from('saved_jobs').select('*', { count: 'exact', head: true }),
    supabase.from('resumes').select('*', { count: 'exact', head: true })
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
    <div className="space-y-10 grid-bg min-h-full pb-10">
      {/* Welcome Section */}
      <div className="flex items-center gap-6 glass p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity className="w-24 h-24" />
        </div>
        <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-xl">
          <AvatarImage src={avatar_url} alt={name} />
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome back, {name}!
          </h1>
          <p className="text-secondary-foreground/60 font-medium">Your workspace is optimized and ready for peak productivity.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-[1.5rem] p-6 group">
          <div className="flex flex-row items-center justify-between pb-4">
            <span className="text-xs font-black uppercase tracking-widest text-secondary-foreground/40 group-hover:text-primary transition-colors">Notes Saved</span>
            <FileText className="h-5 w-5 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-4xl font-black">{notesCount || 0}</div>
        </div>
        
        <div className="glass-card rounded-[1.5rem] p-6 group">
          <div className="flex flex-row items-center justify-between pb-4">
            <span className="text-xs font-black uppercase tracking-widest text-secondary-foreground/40 group-hover:text-red-500 transition-colors">YT Summaries</span>
            <Youtube className="h-5 w-5 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-4xl font-black">{ytCount || 0}</div>
        </div>
        
        <div className="glass-card rounded-[1.5rem] p-6 group">
          <div className="flex flex-row items-center justify-between pb-4">
            <span className="text-xs font-black uppercase tracking-widest text-secondary-foreground/40 group-hover:text-blue-500 transition-colors">Saved Jobs</span>
            <Briefcase className="h-5 w-5 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-4xl font-black">{jobsCount || 0}</div>
        </div>
        
        <div className="glass-card rounded-[1.5rem] p-6 group">
          <div className="flex flex-row items-center justify-between pb-4">
            <span className="text-xs font-black uppercase tracking-widest text-secondary-foreground/40 group-hover:text-emerald-500 transition-colors">Resumes Built</span>
            <FileEdit className="h-5 w-5 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-4xl font-black">{resumesCount || 0}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="glass-card rounded-[2rem] overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Latest Notes</h3>
          </div>
          <div className="p-6">
            {recentNotes && recentNotes.length > 0 ? (
               <div className="space-y-4">
                 {recentNotes.map((note) => (
                   <div key={note.id} className="group cursor-pointer">
                     <span className="block font-bold truncate group-hover:text-primary transition-colors">{note.title}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground/30">{new Date(note.created_at).toLocaleDateString()}</span>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-sm text-secondary-foreground/40 italic">No notes created yet.</p>
            )}
          </div>
        </div>
        
        <div className="glass-card rounded-[2rem] overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <Youtube className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="font-bold">Recent Summaries</h3>
          </div>
          <div className="p-6">
             {recentSummaries && recentSummaries.length > 0 ? (
               <div className="space-y-4">
                 {recentSummaries.map((summary) => (
                   <div key={summary.id} className="group cursor-pointer">
                     <a href={summary.video_url} target="_blank" rel="noreferrer" className="block font-bold truncate group-hover:text-red-500 transition-colors">
                        Explore Insights
                     </a>
                     <span className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground/30">{new Date(summary.created_at).toLocaleDateString()}</span>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-sm text-secondary-foreground/40 italic">Start summarizing today.</p>
            )}
          </div>
        </div>
        
        <div className="glass-card rounded-[2rem] overflow-hidden border-white/5 col-span-1 md:col-span-2 lg:col-span-1">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="font-bold">Active Applications</h3>
          </div>
          <div className="p-6">
            {recentJobs && recentJobs.length > 0 ? (
               <div className="space-y-4">
                 {recentJobs.map((job) => (
                   <div key={job.id} className="group">
                     <span className="block font-bold truncate group-hover:text-blue-500 transition-colors">{job.job_title}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground/30">{job.company}</span>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-sm text-secondary-foreground/40 italic">Your career hunt starts here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
