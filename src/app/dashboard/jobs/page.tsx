import { createClient } from "@/lib/supabase/server"
import { Briefcase, MapPin, ExternalLink, MoreVertical, History } from "lucide-react"
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

  const { data: savedJobs } = await supabase
    .from("saved_jobs")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-sm text-yellow-400 tracking-wide uppercase font-medium mb-1">Career Intelligence</p>
        <h1 className="text-2xl font-semibold text-white">Job Search</h1>
        <p className="text-sm text-gray-400 mt-1">Find and save opportunities from across the web.</p>
      </div>

      {/* Search Interface */}
      <JobSearchForm />

      {/* Saved Jobs Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-yellow-500/10">
          <Briefcase className="h-4 w-4 text-yellow-500/60" />
          <h2 className="text-sm text-yellow-400 tracking-wide uppercase font-medium">Saved Jobs</h2>
          <span className="text-xs text-gray-500">({savedJobs?.length || 0})</span>
        </div>

        {savedJobs && savedJobs.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {savedJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-lg border border-yellow-500/10 bg-black/30 group hover:border-yellow-500/25 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="font-semibold text-white text-base leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">
                      {job.job_title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Briefcase className="h-3.5 w-3.5 text-yellow-500/40 shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 text-yellow-500/30 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-yellow-500/10 transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-md border-yellow-500/20 bg-[#0a0a0a] backdrop-blur-xl shadow-xl">
                       <DeleteJobButton id={job.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-yellow-500/10">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <History className="h-3 w-3" />
                    <span>{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-3 text-xs rounded-md border border-yellow-500/15 hover:bg-yellow-500/10 hover:border-yellow-500/30 text-gray-300 hover:text-white transition-all" 
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
        ) : (
          <div className="text-center py-12 text-gray-500 text-sm">
            <Briefcase className="h-8 w-8 text-yellow-500/10 mx-auto mb-3" />
            <p>No saved jobs yet. Search and save opportunities above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
