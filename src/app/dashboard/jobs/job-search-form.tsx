"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Briefcase, MapPin, Search, Loader2, BookmarkPlus, ExternalLink, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

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
  const [warning, setWarning] = useState("")

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError("Please enter a job title to search.")
      return
    }

    setError("")
    setWarning("")
    setLoading(true)

    try {
      const response = await fetch("/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, experience }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Search failed.")
      
      if (data.warning) setWarning(data.warning)
      setResults(data.jobs || [])
    } catch (err: any) {
      setError("Job search unavailable. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [role, location, experience])

  const handleSaveJob = useCallback(async (job: JobResult) => {
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
      
      if (dbError) throw dbError
      router.refresh()
    } catch (err) {
      console.error("Failed to save job", err)
    } finally {
      setSavingJob(null)
    }
  }, [supabase, router])

  return (
    <div className="space-y-6 w-full">
      {/* Search Form Card */}
      <div className="rounded-lg border border-yellow-500/20 bg-black/30 backdrop-blur-sm p-5">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 ml-1">Job Title</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500/40" />
                <Input 
                  placeholder="e.g. Frontend Developer" 
                  className="pl-10 h-10 rounded-md border-yellow-500/20 bg-black/30 text-sm text-white placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-500/50" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 ml-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500/40" />
                <Input 
                  placeholder="e.g. Remote, India" 
                  className="pl-10 h-10 rounded-md border-yellow-500/20 bg-black/30 text-sm text-white placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-500/50"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 ml-1">Experience Level</label>
              <Select value={experience} onValueChange={setExperience} disabled={loading}>
                <SelectTrigger className="h-10 rounded-md border-yellow-500/20 bg-black/30 text-sm text-white focus:ring-1 focus:ring-yellow-500/50">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-yellow-500/20 bg-[#0a0a0a] backdrop-blur-xl">
                  <SelectItem value="none">All Levels</SelectItem>
                  <SelectItem value="Entry Level">Entry Level</SelectItem>
                  <SelectItem value="Mid Level">Mid Level</SelectItem>
                  <SelectItem value="Senior Level">Senior Level</SelectItem>
                  <SelectItem value="Lead/Manager">Lead / Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !role} 
            className="h-10 px-6 rounded-md bg-yellow-500 hover:bg-yellow-500/90 text-black text-sm font-medium w-full transition-all disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {loading ? "Searching..." : "Search Jobs"}
          </Button>
          
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {warning && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{warning}</span>
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-yellow-400 tracking-wide uppercase font-medium">
              {results.length} Results Found
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((job, i) => (
              <div 
                key={i} 
                className="p-4 rounded-lg border border-yellow-500/10 bg-black/30 hover:border-yellow-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
              >
                <div className="flex-1 space-y-3">
                  <h4 className="text-base font-semibold text-white leading-snug line-clamp-2">
                    {job.job_title}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Briefcase className="h-3.5 w-3.5 text-yellow-500/50" />
                    <span className="truncate">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 text-yellow-500/40" />
                    <span className="truncate">{job.location}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-yellow-500/10">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex-1 h-9 text-xs rounded-md border border-yellow-500/10 hover:bg-yellow-500/10 hover:border-yellow-500/30 text-gray-300 hover:text-white transition-all"
                    onClick={() => handleSaveJob(job)}
                    disabled={savingJob === job.apply_link}
                  >
                    {savingJob === job.apply_link ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Save
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 h-9 text-xs rounded-md bg-yellow-500 hover:bg-yellow-500/90 text-black font-medium transition-all" 
                    asChild
                  >
                    <a href={job.apply_link} target="_blank" rel="noreferrer">
                      Apply <ExternalLink className="h-3 w-3 ml-1.5" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty results after search */}
      {!loading && results.length === 0 && role && !error && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No jobs found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  )
}
