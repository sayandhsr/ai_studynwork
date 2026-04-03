"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Briefcase, MapPin, Search, Loader2, BookmarkPlus, 
  ExternalLink, AlertCircle, Target, Sparkles, Filter 
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface JobResult {
  job_title: string
  company: string
  location: string
  apply_link: string
  description?: string
  post_date?: string
  source?: string
}

export function JobSearchForm() {
  const router = useRouter()
  const supabase = createClient()
  const [role, setRole] = useState("")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState("")
  const [sourceNote, setSourceNote] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [savingJob, setSavingJob] = useState<string | null>(null)
  const [results, setResults] = useState<JobResult[]>([])
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      toast.error("Job title is required for discovery.")
      return
    }

    setError("")
    setWarning("")
    setLoading(true)
    setResults([])

    try {
      const response = await fetch("/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, experience }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Search failed.")
      
      if (data.warning) setWarning(data.warning)
      if (data.note) setSourceNote(data.note)
      setResults(data.jobs || [])
      if (data.jobs?.length > 0) {
        toast.success(`Found ${data.jobs.length} relevant opportunities.`)
      }
    } catch (err: any) {
      setError("Job search unavailable. Please try again later.")
      toast.error("Signal lost. Discovery engine is offline.")
    } finally {
      setLoading(false)
    }
  }, [role, location, experience])

  const handleSaveJob = useCallback(async (job: JobResult) => {
    setSavingJob(job.apply_link)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
         toast.error("Authentication required to track roles.")
         return
      }

      const { error: dbError } = await supabase.from("saved_jobs").insert([{
        user_id: user.id,
        job_title: job.job_title,
        company: job.company,
        apply_link: job.apply_link,
        location: job.location
      }])
      
      if (dbError) throw dbError
      toast.success("Opportunity tracked successfully.")
      router.refresh()
    } catch (err) {
      toast.error("Failed to track this role.")
      console.error("Failed to save job", err)
    } finally {
      setSavingJob(null)
    }
  }, [supabase, router])

  return (
    <div className="space-y-10 w-full">
      {/* Discovery Hero Section */}
      <div className="relative group p-8 rounded-2xl border border-primary/10 bg-card/50 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transition-transform duration-1000 group-hover:scale-110">
           <Target className="w-32 h-32" />
        </div>
        
        <form onSubmit={handleSearch} className="relative z-10 space-y-6">
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Strategic Role</label>
                  <div className="relative group/input">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
                    <Input 
                      placeholder="Title e.g. Staff Architect" 
                      className="pl-11 h-12 bg-background border-border rounded-xl focus:ring-primary/20 text-sm font-medium" 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Geographic Focus</label>
                  <div className="relative group/input">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
                    <Input 
                      placeholder="e.g. Remote, Europe" 
                      className="pl-11 h-12 bg-background border-border rounded-xl focus:ring-primary/20 text-sm font-medium"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Seniority Target</label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger className="h-12 bg-background border-border rounded-xl focus:ring-primary/20 text-sm font-medium">
                      <SelectValue placeholder="Unified Tiers" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover shadow-2xl">
                      <SelectItem value="none">Unified Tiers</SelectItem>
                      <SelectItem value="Entry Level">Foundation (Entry)</SelectItem>
                      <SelectItem value="Mid Level">Professional (Mid)</SelectItem>
                      <SelectItem value="Senior Level">Lead (Senior)</SelectItem>
                      <SelectItem value="Executive">Executive (Staff+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
             <Button 
                type="submit" 
                disabled={loading || !role} 
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-xs tracking-widest flex-1 rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Search className="h-4 w-4 mr-3" />}
                {loading ? "Discovering..." : "Execute Discovery"}
             </Button>
             
             <Button type="button" variant="outline" className="h-12 px-6 rounded-xl border-border text-muted-foreground hover:bg-accent/50">
                <Filter className="h-4 w-4 mr-2" /> Advanced Filters
             </Button>
          </div>
          
          {(error || warning) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${error ? 'bg-destructive/5 border-destructive/20 text-destructive' : 'bg-primary/5 border-primary/20 text-primary'}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error || warning}</span>
            </motion.div>
          )}
        </form>
      </div>

      {/* Discovery Results */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
             <div className="h-4 w-1 bg-primary rounded-full" />
             <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
                {loading ? "Scanning live sources..." : results.length > 0 ? "Real Opportunities Found" : "Awaiting Input"}
             </h3>
          </div>
          <div className="flex items-center gap-3">
            {sourceNote && results.length > 0 && <span className="text-[10px] font-medium text-muted-foreground">{sourceNote}</span>}
            {results.length > 0 && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">{results.length} Found</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={`skel-${i}`} className="p-6 rounded-2xl border border-border bg-card/40 space-y-4 shadow-sm">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                    <Skeleton className="h-3 w-1/3 rounded-md" />
                  </div>
                  <div className="pt-4 border-t border-border/50 flex gap-2">
                    <Skeleton className="h-9 flex-1 rounded-lg" />
                    <Skeleton className="h-9 flex-1 rounded-lg" />
                  </div>
                </div>
              ))
            ) : (
              results.map((job, i) => (
                <motion.div 
                  key={`${job.apply_link}-${i}`} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-2xl border border-border bg-card hover:bg-card hover:border-primary/40 transition-all group shadow-sm flex flex-col relative overflow-hidden"
                >
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                         <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2 pr-6">
                           {job.job_title}
                         </h4>
                         <div className="p-2 rounded-lg bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Sparkles className="h-4 w-4" />
                         </div>
                      </div>
                      <div className="flex flex-wrap gap-y-2 gap-x-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5 text-primary/40" />
                          <span className="truncate">{job.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                          <MapPin className="h-3.5 w-3.5 text-primary/20" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        {job.source && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 bg-accent/50 px-2 py-0.5 rounded">{job.source}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 pt-5 border-t border-border/50">
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-10 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-border hover:bg-primary/5 hover:border-primary/20 text-muted-foreground hover:text-primary transition-all"
                      onClick={() => handleSaveJob(job)}
                      disabled={savingJob === job.apply_link}
                    >
                      {savingJob === job.apply_link ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      ) : (
                        <BookmarkPlus className="h-3.5 w-3.5 mr-2" />
                      )}
                      Track
                    </Button>
                    <Button 
                      className="flex-1 h-10 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md active:scale-95" 
                      asChild
                    >
                      <a href={job.apply_link} target="_blank" rel="noreferrer">
                        Deploy <ExternalLink className="h-3.5 w-3.5 ml-2" />
                      </a>
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {!loading && results.length === 0 && !error && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl space-y-4">
            <Search className="h-10 w-10 text-primary/5 mx-auto" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] italic">Discovery Engine - Awaiting Tactical Target</p>
          </div>
        )}
      </div>
    </div>
  )
}
