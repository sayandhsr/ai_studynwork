import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Briefcase, MapPin, ExternalLink, MoreVertical, Sparkles } from "lucide-react"
import { JobSearchForm } from "./job-search-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteJobButton } from "./delete-job-button"

export default async function JobSearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch saved jobs
  const { data: savedJobs } = await supabase
    .from("saved_jobs")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-12 pb-20 font-serif selection:bg-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary/40" />
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">Career Journey</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading tracking-tight italic">AI Job Search</h1>
        <p className="text-foreground/60 text-lg font-light italic max-w-2xl leading-relaxed">
          "The perfect opportunity is not found; it is curated through patience and intent."
        </p>
      </div>

      {/* Search Form Wrapper */}
      <div className="relative pt-4">
        <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        <JobSearchForm />
      </div>

      <div className="space-y-8 pt-12 border-t border-border/30">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-[0.4em] uppercase opacity-50 flex items-center gap-4">
            <Briefcase className="h-4 w-4 text-primary" />
            Curated Opportunities
          </h2>
        </div>

        {savedJobs && savedJobs.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((job) => (
              <Card key={job.id} className="flex flex-col rounded-none border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group">
                <CardHeader className="pb-4 border-b border-border/20 bg-muted/30 flex flex-row items-start justify-between">
                  <div className="space-y-2 w-full pr-4 text-left">
                    <h4 className="font-heading text-xl italic tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {job.job_title}
                    </h4>
                    <div className="text-[9px] font-bold tracking-[0.2em] uppercase opacity-50 flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                      SAVED RESOURCE
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 border border-transparent hover:border-border/30 rounded-none transition-all -mr-2">
                        <MoreVertical className="h-4 w-4 opacity-50" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border/30 p-2 font-serif bg-card">
                      <DeleteJobButton id={job.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-1 pt-8 px-8 space-y-4">
                   <div className="flex items-center gap-3 text-base font-light italic opacity-80">
                     <Briefcase className="h-4 w-4 text-primary opacity-60 shrink-0" />
                     <span className="truncate">{job.company}</span>
                   </div>
                   {job.location && (
                     <div className="flex items-center gap-3 text-sm font-light italic opacity-60">
                       <MapPin className="h-4 w-4 shrink-0" />
                       <span className="truncate">{job.location}</span>
                     </div>
                   )}
                </CardContent>
                <CardFooter className="pt-6 px-8 pb-8 mt-auto border-t border-border/10">
                   <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-[0.3em] h-12 rounded-none border border-primary/20 hover:bg-primary/10 transition-all" asChild>
                     <a href={job.apply_link} target="_blank" rel="noreferrer">
                       Commence Application <ExternalLink className="h-3 w-3 ml-3" />
                     </a>
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-muted/10 border border-dashed border-border/40 text-center space-y-4">
            <Briefcase className="h-10 w-10 opacity-10" />
            <p className="text-sm font-bold tracking-widest uppercase opacity-40 italic">The journey has no milestones yet.</p>
          </div>
        )}
      </div>

    </div>
  )
}
