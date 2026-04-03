"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Briefcase, MapPin, Search, Loader2, BookmarkPlus, ExternalLink, Sparkles, CheckCircle2, History } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface JobResult {
  job_title: string
  company: string
  location: string
  apply_link: string
  description?: string
  post_date?: string
}

export function JobSearchForm() {
  const router = useRouter()
  const supabase = createClient()
  const [role, setRole] = useState("")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [savingJob, setSavingJob] = useState<string | null>(null)
  const [results, setResults] = useState<JobResult[]>([])
  const [error, setError] = useState("")
  const [searchStep, setSearchStep] = useState(0)

  const steps = [
    "Synchronizing with Career Hubs...",
    "Scanning Global Opportunities...",
    "Curating Elite Positions...",
    "Finalizing Selection..."
  ]

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError("Please designate a target role")
      return
    }

    setError("")
    setLoading(true)
    setSearchStep(0)
    
    const stepInterval = setInterval(() => {
      setSearchStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 2500)

    try {
      const response = await fetch("/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, experience }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Connection to the career grid failed.");
      
      setResults(data.jobs || [])
    } catch (err: any) {
      setError(err.message || "An unhandled anomaly occurred during search.")
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }

  const handleSaveJob = async (job: JobResult) => {
    setSavingJob(job.apply_link)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: dbError } = await supabase.from("saved_jobs").insert([{
        user_id: user.id,
        job_title: job.job_title,
        company: job.company,
        apply_link: job.apply_link,
        location: job.location
      }])
      
      if (dbError) throw dbError;
      router.refresh()
    } catch (err) {
      console.error("Failed to save job", err)
    } finally {
      setSavingJob(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 mt-6 flex flex-col items-center w-full space-y-8">
      <div className="bg-black/40 backdrop-blur-xl border border-yellow-500/20 rounded-xl group relative overflow-hidden w-full">
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between border-b border-border/5 pb-6">
             <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/60 block">Strategic Parameters</span>
                <h3 className="text-3xl font-heading italic tracking-tight opacity-40">Discovery Configuration</h3>
             </div>
             <div className="flex gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] uppercase tracking-widest opacity-30">Active Grid</span>
                  <span className="text-[10px] font-mono text-primary/40 uppercase">Global Catalyst</span>
                </div>
                <div className="h-8 w-[1px] bg-border/10" />
                <Sparkles className="h-8 w-8 text-primary/5 animate-pulse" />
             </div>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted ml-2">Target Designation</label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/20 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="e.g. Lead AI Architect" 
                  className="pl-12 py-3 h-auto rounded-lg border-yellow-500/10 bg-[#0B0F14]/40 italic font-light tracking-wide text-sm selection:bg-primary/20" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted ml-2">Field Location</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/20 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="e.g. Remote, Europe" 
                  className="pl-12 py-3 h-auto rounded-lg border-yellow-500/10 bg-[#0B0F14]/40 italic font-light tracking-wide text-sm selection:bg-primary/20"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted ml-2">Experience Tier</label>
              <Select value={experience} onValueChange={setExperience} disabled={loading}>
                <SelectTrigger className="py-3 h-auto rounded-lg border-yellow-500/10 bg-[#0B0F14]/40 italic font-light text-sm px-4 selection:bg-primary/20 focus:ring-primary/10">
                  <SelectValue placeholder="All Seniorities" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-yellow-500/20 bg-black/60 backdrop-blur-xl font-serif">
                  <SelectItem value="none" className="italic hover:bg-primary/5 transition-colors">Complete Spectrum</SelectItem>
                  <SelectItem value="Entry Level" className="italic hover:bg-primary/5">Sanctuary Entrance</SelectItem>
                  <SelectItem value="Mid Level" className="italic hover:bg-primary/5">Ascension Core</SelectItem>
                  <SelectItem value="Senior Level" className="italic hover:bg-primary/5">Elite Mastery</SelectItem>
                  <SelectItem value="Lead/Manager" className="italic hover:bg-primary/5">Oracle Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 pt-4">
              <Button type="submit" disabled={loading || !role} className="py-3 h-auto gap-2 rounded-lg bg-primary/90 hover:bg-primary transition-all font-bold uppercase tracking-widest text-sm relative overflow-hidden group shadow-[0_0_20px_rgba(212,175,55,0.15)] w-full text-black hover:scale-[1.01]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 group-hover:-rotate-12 transition-transform" />}
                {loading ? (
                  <span className="flex items-center gap-2">
                    {steps[searchStep]}
                  </span>
                ) : "Execute Discovery"}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-x-full group-hover:translate-x-0 duration-700" />
              </Button>
            </div>
            
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:col-span-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-widest flex items-center gap-3 italic">
                <History className="h-4 w-4 shrink-0" /> <span className="line-clamp-2">{error}</span>
              </motion.div>
            )}
          </form>
        </div>
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-7xl space-y-12"
          >
            <div className="flex items-center gap-6">
               <div className="h-px w-12 bg-primary/20" />
               <h3 className="text-[10px] font-bold tracking-[0.6em] uppercase opacity-40">Extracted Opportunities</h3>
               <div className="h-px flex-1 bg-border/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
              {results.map((job, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-black/40 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-6 flex flex-col h-full hover:translate-y-[-4px] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-500"
                >
                  <div className="flex flex-col h-full space-y-6">
                    <div className="space-y-4 text-left">
                       <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-primary/60 block">Sequence #{i + 1}</span>
                       <h4 className="font-heading text-xl italic tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-500">
                         {job.job_title}
                       </h4>
                    </div>

                    <div className="flex-1 space-y-4">
                       <div className="flex items-center gap-3 text-sm font-light italic opacity-90">
                         <div className="h-1 w-3 bg-primary/40 rounded-full" />
                         <span className="truncate">{job.company}</span>
                       </div>
                       <div className="flex items-center gap-3 text-xs font-light italic opacity-60">
                         <MapPin className="h-3 w-3 shrink-0 opacity-60 text-primary" />
                         <span className="truncate">{job.location}</span>
                       </div>
                    </div>

                    <div className="pt-6 flex gap-3 border-t border-yellow-500/10">
                       <Button 
                         variant="ghost" 
                         className="flex-1 text-[10px] font-bold uppercase tracking-widest py-2 h-auto rounded-lg border border-yellow-500/10 hover:bg-primary/10 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                         onClick={() => handleSaveJob(job)}
                         disabled={savingJob === job.apply_link}
                        >
                         {savingJob === job.apply_link ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <BookmarkPlus className="h-3.5 w-3.5 mr-2" />}
                         CURATE
                       </Button>
                       <Button className="flex-1 text-[10px] font-bold uppercase tracking-widest py-2 h-auto rounded-lg bg-primary hover:bg-primary/90 transition-all text-black relative overflow-hidden group shadow-md" asChild>
                         <a href={job.apply_link} target="_blank" rel="noreferrer" className="flex items-center justify-center">
                           EXPLORE <ExternalLink className="h-3.5 w-3.5 ml-2" />
                         </a>
                       </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
