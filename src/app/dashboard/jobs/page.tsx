import { createClient } from "@/lib/supabase/server"
import { Briefcase, MapPin, ExternalLink, MoreVertical, Sparkles, History, Trash } from "lucide-react"
import { JobSearchForm } from "./job-search-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteJobButton } from "./delete-job-button"
import { ScrollReveal } from "@/components/scroll-reveal"

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
    <div className="max-w-5xl mx-auto px-4 space-y-8 pb-16 font-serif selection:bg-primary/20">
      <div className="space-y-3 text-left">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary/40" />
          <span className="text-[10px] font-bold tracking-[0.6em] uppercase text-muted">Career Intelligence</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading tracking-tight italic leading-tight text-foreground">Economic Oracle</h1>
        <p className="text-muted text-base font-light italic max-w-2xl leading-relaxed">
          Strategic alignment is the catalyst of destiny. Every node in the network is a potential path to expansion.
        </p>
      </div>

      {/* Search Interface */}
      <div className="relative">
        <div className="absolute -inset-12 bg-primary/2 blur-[100px] rounded-full pointer-events-none opacity-40" />
        <JobSearchForm />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border/10 pb-4">
          <div className="p-2 bg-primary/5 border border-primary/20 rounded-lg shadow-[0_0_10px_rgba(212,175,55,0.05)]">
             <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-0.5">
             <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-foreground/80">Opportunity Ledger</h2>
             <span className="text-[9px] font-bold uppercase tracking-widest text-muted/40 italic">Chronicle of curated milestones</span>
          </div>
          <div className="h-px flex-1 bg-border/5" />
        </div>

        {savedJobs && savedJobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {savedJobs.map((job, index) => (
              <ScrollReveal key={job.id} delay={index * 0.08} className="bg-black/40 backdrop-blur-xl border border-yellow-500/20 rounded-xl group flex flex-col hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(212,175,55,0.12)] transition-all duration-500">
                <div className="p-6 flex flex-col h-full space-y-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-full pr-6 text-left">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                         <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-primary/60">Secured Resource</span>
                      </div>
                      <h4 className="font-heading text-xl italic tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-500">
                        {job.job_title}
                      </h4>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 border border-yellow-500/10 hover:border-primary/30 hover:bg-primary/5 rounded-lg transition-all">
                          <MoreVertical className="h-4 w-4 opacity-40 text-muted-foreground group-hover:text-primary" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-lg border-yellow-500/20 p-2 font-serif bg-black/95 backdrop-blur-xl shadow-2xl">
                         <DeleteJobButton id={job.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex-1 space-y-3">
                     <div className="flex items-center gap-3 text-sm font-light italic text-muted/80">
                       <Briefcase className="h-3.5 w-3.5 text-primary opacity-40 shrink-0" />
                       <span className="truncate">{job.company}</span>
                     </div>
                     {job.location && (
                       <div className="flex items-center gap-3 text-xs font-light italic text-muted/50">
                         <MapPin className="h-3.5 w-3.5 shrink-0 opacity-30" />
                         <span className="truncate">{job.location}</span>
                       </div>
                     )}
                  </div>

                  <div className="pt-4 flex gap-4 items-center justify-between border-t border-yellow-500/10">
                     <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest text-muted/30">Entry Manifest</span>
                        <span className="text-[9px] font-mono text-primary/40 flex items-center gap-1.5">
                           <History className="h-3 w-3" />
                           {new Date(job.created_at).toLocaleDateString()}
                        </span>
                     </div>
                     <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest py-2 h-auto rounded-lg border border-primary/10 hover:bg-primary/10 hover:border-primary/30 transition-all text-primary-foreground group" asChild>
                       <a href={job.apply_link} target="_blank" rel="noreferrer" className="flex items-center">
                         Apply
                         <ExternalLink className="h-3.5 w-3.5 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                       </a>
                     </Button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 bg-black/20 border border-dashed border-yellow-500/10 rounded-xl text-center space-y-6 animate-in fade-in zoom-in duration-1000">
            <div className="relative">
              <Sparkles className="w-14 h-14 text-primary opacity-5" />
              <Briefcase className="h-6 w-6 text-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-muted/30 italic">No milestones currently archived in the vault.</p>
               <span className="text-[9px] font-light italic text-muted/20">The oracle awaits your configuration.</span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
