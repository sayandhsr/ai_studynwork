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
    <div className="space-y-24 pb-32 font-serif selection:bg-primary/20">
      <div className="space-y-8 text-left">
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-primary/40" />
          <span className="text-[10px] font-bold tracking-[0.6em] uppercase text-muted">Career Intelligence</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-heading tracking-tight italic leading-tight text-foreground">Economic Oracle</h1>
        <p className="text-muted text-xl font-light italic max-w-2xl leading-relaxed">
          "Strategic alignment is the catalyst of destiny. Every node in the network is a potential path to expansion."
        </p>
      </div>

      {/* Search Interface */}
      <div className="relative">
        <div className="absolute -inset-20 bg-primary/2 blur-[150px] rounded-full pointer-events-none opacity-50" />
        <JobSearchForm />
      </div>

      <div className="space-y-12">
        <div className="flex items-center gap-6 border-b border-border/10 pb-8">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-none shadow-[0_0_15px_rgba(212,175,55,0.05)]">
             <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
             <h2 className="text-sm font-bold tracking-[0.5em] uppercase text-foreground/80">Opportunity Ledger</h2>
             <span className="text-[9px] font-bold uppercase tracking-widest text-muted/40 italic">Chronicle of curated milestones</span>
          </div>
          <div className="h-px flex-1 bg-border/5" />
        </div>

        {savedJobs && savedJobs.length > 0 ? (
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-2">
            {savedJobs.map((job, index) => (
              <ScrollReveal key={job.id} delay={index * 0.1} className="glass-card p-1 group flex flex-col hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-700">
                <div className="p-10 flex flex-col h-full space-y-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4 w-full pr-8 text-left">
                      <div className="flex items-center gap-3">
                         <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                         <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary/60">Secured Resource</span>
                      </div>
                      <h4 className="font-heading text-3xl italic tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-500">
                        {job.job_title}
                      </h4>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 border border-border/5 hover:border-primary/20 hover:bg-primary/5 rounded-none transition-all">
                          <MoreVertical className="h-5 w-5 opacity-40 text-muted-foreground group-hover:text-primary" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none border-border/10 p-3 font-serif bg-[#0B0F14]/95 backdrop-blur-xl shadow-2xl">
                         <DeleteJobButton id={job.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex-1 space-y-6">
                     <div className="flex items-center gap-4 text-lg font-light italic text-muted/80">
                       <Briefcase className="h-4 w-4 text-primary opacity-40 shrink-0" />
                       <span className="truncate">{job.company}</span>
                     </div>
                     {job.location && (
                       <div className="flex items-center gap-4 text-sm font-light italic text-muted/50">
                         <MapPin className="h-4 w-4 shrink-0 opacity-20" />
                         <span className="truncate">{job.location}</span>
                       </div>
                     )}
                  </div>

                  <div className="pt-10 flex gap-6 items-center justify-between border-t border-border/5">
                     <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest text-muted/30">Entry Manifest</span>
                        <span className="text-[9px] font-mono text-primary/40 flex items-center gap-2">
                           <History className="h-3 w-3" />
                           {new Date(job.created_at).toLocaleDateString()}
                        </span>
                     </div>
                     <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-[0.4em] h-14 rounded-none border border-primary/10 hover:bg-primary/10 hover:border-primary/30 transition-all text-primary-foreground group" asChild>
                       <a href={job.apply_link} target="_blank" rel="noreferrer">
                         Commence Application
                         <ExternalLink className="h-4 w-4 ml-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                       </a>
                     </Button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-32 bg-[#0B0F14]/30 border border-dashed border-border/10 text-center space-y-10 animate-in fade-in zoom-in duration-1000">
            <div className="relative">
              <Sparkles className="w-20 h-20 text-primary opacity-5" />
              <Briefcase className="h-8 w-8 text-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-bold tracking-[0.6em] uppercase text-muted/30 italic">No milestones currently archived in the vault.</p>
               <span className="text-[9px] font-light italic text-muted/20">The oracle awaits your configuration.</span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
