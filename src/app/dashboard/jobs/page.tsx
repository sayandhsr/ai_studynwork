import { createClient } from "@/lib/supabase/server"
import { Briefcase, MapPin, ExternalLink, MoreVertical, Calendar } from "lucide-react"
import { JobSearchForm } from "./job-search-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteJobButton } from "./delete-job-button"

export default async function JobSearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let savedJobs = []
  try {
    const { data } = await supabase
      .from("saved_jobs")
      .select("*")
      .order("created_at", { ascending: false })
    savedJobs = data || []
  } catch (err) {
    console.error("Jobs fetch error", err)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-1 border-b border-border pb-8">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Strategic Growth</p>
        <h1 className="text-3xl font-bold text-foreground">Discovery Engine</h1>
        <p className="text-sm text-muted-foreground font-medium">Find and track strategic opportunities across the global technical market.</p>
      </div>

      {/* Interface */}
      <JobSearchForm />

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Briefcase className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Tracked Opportunities <span className="text-muted-foreground ml-2">({savedJobs.length})</span></h2>
        </div>

        {savedJobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {savedJobs.map((job) => (
              <div key={job.id} className="p-6 rounded-2xl border border-border bg-card group hover:border-primary/40 transition-all shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <h4 className="font-bold text-foreground text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {job.job_title}
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5 text-primary/40" />
                        <span className="truncate">{job.company}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground opacity-70">
                          <MapPin className="h-3 w-3 text-primary/30" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border shadow-xl p-1">
                       <DeleteJobButton id={job.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-8 pt-4 border-t border-border/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5 opacity-40" />
                    <span>Saved {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/10 hover:bg-primary/5 hover:border-primary/40" 
                    asChild
                  >
                    <a href={job.apply_link} target="_blank" rel="noreferrer">
                      Apply Opportunity <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <Briefcase className="h-10 w-10 text-primary/10 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground font-medium">No tracked opportunities yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
