"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Briefcase, MapPin, Search, Loader2, BookmarkPlus, ExternalLink } from "lucide-react"
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
    <div className="space-y-6 flex flex-col items-center">
      <Card className="w-full max-w-3xl border shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Role <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. AI Engineer" 
                    className="pl-9" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Remote, New York" 
                    className="pl-9"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level</label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any Experience</SelectItem>
                    <SelectItem value="Entry Level">Entry Level</SelectItem>
                    <SelectItem value="Mid Level">Mid Level</SelectItem>
                    <SelectItem value="Senior Level">Senior</SelectItem>
                    <SelectItem value="Lead/Manager">Lead/Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full md:w-auto md:ml-auto gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Crawling Jobs..." : "Find Jobs"}
            </Button>
            
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="w-full max-w-5xl space-y-4 pt-4">
          <h3 className="text-xl font-semibold">Search Results</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((job, i) => (
              <Card key={i} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg leading-tight">{job.job_title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 pb-2">
                   <div className="flex items-center gap-2 text-sm font-medium">
                     <Briefcase className="h-4 w-4 text-muted-foreground" />
                     {job.company}
                   </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <MapPin className="h-4 w-4" />
                     {job.location}
                   </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between border-t gap-2 mt-auto p-4">
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="flex-1"
                     onClick={() => handleSaveJob(job)}
                     disabled={savingJob === job.apply_link}
                    >
                     {savingJob === job.apply_link ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                     ) : (
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                     )}
                     Save
                   </Button>
                   <Button size="sm" className="flex-1" asChild>
                     <a href={job.apply_link} target="_blank" rel="noreferrer">
                       Apply <ExternalLink className="h-3 w-3 ml-2" />
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
