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
    <div className="space-y-20 flex flex-col items-center w-full">
      <div className="glass-card p-1 group relative overflow-hidden w-full max-w-5xl">
        <div className="p-10 space-y-12">
          <div className="flex flex-col md:flex-row gap-10 items-start md:items-end justify-between border-b border-border/5 pb-10">
             <div className="space-y-4">
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

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Target Designation</label>
              <div className="relative group">
                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/20 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="e.g. Lead AI Architect" 
                  className="pl-16 h-16 rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light tracking-wide text-lg selection:bg-primary/20" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Field Location</label>
              <div className="relative group">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/20 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="e.g. Remote, Europe" 
                  className="pl-16 h-16 rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light tracking-wide text-lg selection:bg-primary/20"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Experience Tier</label>
              <Select value={experience} onValueChange={setExperience} disabled={loading}>
                <SelectTrigger className="h-16 rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light text-lg px-6 selection:bg-primary/20 focus:ring-primary/10">
                  <SelectValue placeholder="All Seniorities" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border/10 bg-[#0B0F14]/95 backdrop-blur-xl font-serif">
                  <SelectItem value="none" className="italic hover:bg-primary/5 transition-colors">Complete Spectrum</SelectItem>
                  <SelectItem value="Entry Level" className="italic hover:bg-primary/5">Sanctuary Entrance</SelectItem>
                  <SelectItem value="Mid Level" className="italic hover:bg-primary/5">Ascension Core</SelectItem>
                  <SelectItem value="Senior Level" className="italic hover:bg-primary/5">Elite Mastery</SelectItem>
                  <SelectItem value="Lead/Manager" className="italic hover:bg-primary/5">Oracle Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 pt-6">
              <Button type="submit" disabled={loading || !role} className="h-24 gap-6 rounded-none bg-primary hover:bg-primary/90 transition-all font-bold uppercase tracking-[0.5em] text-xs relative overflow-hidden group shadow-[0_0_50px_rgba(212,175,55,0.15)] w-full text-primary-foreground">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6 group-hover:rotate-12 transition-transform" />}
                {loading ? (
                  <div className="flex flex-col items-start leading-none gap-2">
                    <span className="text-[12px]">{steps[searchStep]}</span>
                    <span className="text-[8px] opacity-60">Synchronizing Global Intelligence...</span>
                  </div>
                ) : "Execute Discovery"}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity skew-x-12 translate-x-full group-hover:translate-x-0 duration-1000" />
              </Button>
            </div>
            
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:col-span-3 p-6 bg-destructive/5 border border-destructive/20 text-destructive text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 italic animate-pulse">
                <History className="h-4 w-4" /> {error}
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

            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 pb-20">
              {results.map((job, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-1 group flex flex-col h-full hover:translate-y-[-8px] transition-all duration-700"
                >
                  <div className="p-10 flex flex-col h-full space-y-10">
                    <div className="space-y-6 text-left">
                       <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-primary/40 block">Sequence #{i + 1}</span>
                       <h4 className="font-heading text-2xl italic tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-500">
                         {job.job_title}
                       </h4>
                    </div>

                    <div className="flex-1 space-y-6">
                       <div className="flex items-center gap-4 text-base font-light italic opacity-80">
                         <div className="h-1 w-4 bg-primary/20" />
                         <span className="truncate">{job.company}</span>
                       </div>
                       <div className="flex items-center gap-4 text-sm font-light italic opacity-50">
                         <MapPin className="h-4 w-4 shrink-0 opacity-40 text-primary" />
                         <span className="truncate">{job.location}</span>
                       </div>
                    </div>

                    <div className="pt-10 flex gap-4 border-t border-border/5">
                       <Button 
                         variant="ghost" 
                         className="flex-1 text-[9px] font-bold uppercase tracking-[0.3em] h-14 rounded-none border border-border/5 hover:bg-primary/5 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary"
                         onClick={() => handleSaveJob(job)}
                         disabled={savingJob === job.apply_link}
                        >
                         {savingJob === job.apply_link ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-3" /> : <BookmarkPlus className="h-3.5 w-3.5 mr-3" />}
                         CURATE
                       </Button>
                       <Button className="flex-1 text-[9px] font-bold uppercase tracking-[0.3em] h-14 rounded-none bg-primary hover:bg-primary/90 transition-all text-primary-foreground relative overflow-hidden group shadow-lg" asChild>
                         <a href={job.apply_link} target="_blank" rel="noreferrer">
                           EXPLORE <ExternalLink className="h-3.5 w-3.5 ml-3" />
                           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity skew-x-12 translate-x-full group-hover:translate-x-0 duration-700" />
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
