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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-4 rounded-xl bg-card p-6 shadow-sm border">
        <Avatar className="h-16 w-16 border-2 border-primary/10">
          <AvatarImage src={avatar_url} alt={name} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {name}!</h1>
          <p className="text-muted-foreground">Here's what's happening in your workspace today.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notes Saved</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">YT Summaries</CardTitle>
            <Youtube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ytCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saved Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resumes Created</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumesCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Latest Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotes && recentNotes.length > 0 ? (
               <div className="space-y-4">
                 {recentNotes.map((note) => (
                   <div key={note.id} className="flex flex-col gap-1 border-b last:border-0 pb-3 last:pb-0">
                     <span className="font-medium truncate">{note.title}</span>
                     <span className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</span>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-sm text-muted-foreground">No recent notes.</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Youtube className="h-5 w-5 text-primary" />
              Recent Summaries
            </CardTitle>
          </CardHeader>
          <CardContent>
             {recentSummaries && recentSummaries.length > 0 ? (
               <div className="space-y-4">
                 {recentSummaries.map((summary) => (
                   <div key={summary.id} className="flex flex-col gap-1 border-b last:border-0 pb-3 last:pb-0">
                     <span className="font-medium truncate text-blue-500 hover:underline">
                        <a href={summary.video_url} target="_blank" rel="noreferrer">Video Link</a>
                     </span>
                     <span className="text-xs text-muted-foreground">{new Date(summary.created_at).toLocaleDateString()}</span>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-sm text-muted-foreground">No recent summaries.</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              Saved Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs && recentJobs.length > 0 ? (
               <div className="space-y-4">
                 {recentJobs.map((job) => (
                   <div key={job.id} className="flex flex-col gap-1 border-b last:border-0 pb-3 last:pb-0">
                     <span className="font-medium truncate">{job.job_title}</span>
                     <span className="text-sm text-muted-foreground">{job.company}</span>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-sm text-muted-foreground">No recently saved jobs.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
