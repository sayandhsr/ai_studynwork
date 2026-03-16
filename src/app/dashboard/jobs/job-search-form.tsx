"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Briefcase, MapPin, Search, Loader2, BookmarkPlus, ExternalLink, Sparkles } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface JobResult {
  job_title: string
  company: string
  location: string
  apply_link: string
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError("Job role is required")
      return
    }

    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, experience }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setResults(data.jobs || [])
    } catch (err: any) {
      setError(err.message || "Failed to search for jobs")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJob = async (job: JobResult) => {
    setSavingJob(job.apply_link)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("saved_jobs").insert([{
        user_id: user.id,
        job_title: job.job_title,
        company: job.company,
        apply_link: job.apply_link
      }])
      
      router.refresh()
    } catch (err) {
      console.error("Failed to save job", err)
    } finally {
      setSavingJob(null)
    }
  }

  return (
    <div className="space-y-12 flex flex-col items-center">
      <Card className="w-full max-w-4xl rounded-none border-border/40 border bg-card/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <CardContent className="p-10">
          <form onSubmit={handleSearch} className="flex flex-col gap-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Target Role</label>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="e.g. AI Engineer" 
                    className="pl-12 h-14 rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light tracking-wide text-lg" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Preferred Location</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="e.g. Remote, Europe" 
                    className="pl-12 h-14 rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light tracking-wide text-lg"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Experience Tier</label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="h-14 rounded-none border-border/30 focus:ring-primary/20 bg-background/50 italic font-light text-lg px-4">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-serif">
                    <SelectItem value="none" className="italic">All Tiers</SelectItem>
                    <SelectItem value="Entry Level" className="italic">Entry Sanctum</SelectItem>
                    <SelectItem value="Mid Level" className="italic">Mid Ascent</SelectItem>
                    <SelectItem value="Senior Level" className="italic">Senior Mastery</SelectItem>
                    <SelectItem value="Lead/Manager" className="italic">Lead Oracle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="h-16 gap-4 rounded-none bg-primary hover:bg-primary/90 transition-all font-bold uppercase tracking-[0.3em] text-xs relative overflow-hidden group w-full md:w-auto md:ml-auto md:px-12">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              {loading ? (
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-[10px]">Crawling Digital Oceans</span>
                  <span className="text-[8px] opacity-60 animate-pulse">Scanning Opportunities</span>
                </div>
              ) : "Manifest Opportunities"}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity skew-x-12 translate-x-full group-hover:translate-x-0 duration-700" />
            </Button>
            
            {error && <p className="text-xs italic font-bold uppercase tracking-[0.2em] text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="w-full max-w-7xl space-y-8 pt-4">
          <div className="flex items-center gap-4">
             <div className="h-1 w-1 rounded-full bg-primary/40" />
             <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-40">Potential Destinies</h3>
             <div className="h-px flex-1 bg-border/20" />
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {results.map((job, i) => (
              <Card key={i} className="flex flex-col rounded-none border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group">
                <CardHeader className="pb-4 border-b border-border/20">
                  <CardTitle className="font-heading text-xl italic tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {job.job_title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pt-8 px-8 space-y-4">
                   <div className="flex items-center gap-3 text-base font-light italic opacity-80">
                     <Briefcase className="h-4 w-4 text-primary opacity-60 shrink-0" />
                     <span className="truncate">{job.company}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm font-light italic opacity-60">
                     <MapPin className="h-4 w-4 shrink-0" />
                     <span className="truncate">{job.location}</span>
                   </div>
                </CardContent>
                <CardFooter className="pt-6 px-8 pb-8 flex justify-between border-t border-border/10 gap-4 mt-auto">
                   <Button 
                     variant="ghost" 
                     className="flex-1 text-[10px] font-bold uppercase tracking-[0.2em] rounded-none border border-border/20 hover:bg-primary/5 transition-all h-12"
                     onClick={() => handleSaveJob(job)}
                     disabled={savingJob === job.apply_link}
                    >
                     {savingJob === job.apply_link ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                     ) : (
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                     )}
                     CURATE
                   </Button>
                   <Button className="flex-1 text-[10px] font-bold uppercase tracking-[0.2em] rounded-none h-12 bg-primary hover:bg-primary/90 transition-all font-bold" asChild>
                     <a href={job.apply_link} target="_blank" rel="noreferrer">
                       EXPLORE <ExternalLink className="h-3 w-3 ml-2" />
                     </a>
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
