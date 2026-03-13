import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Briefcase, MapPin, ExternalLink, MoreVertical } from "lucide-react"
import { JobSearchForm } from "./job-search-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteJobButton } from "./delete-job-button"

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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Job Search</h1>
        <p className="text-muted-foreground">Find and curate the best opportunities powered by Firecrawl.</p>
      </div>

      <JobSearchForm />

      <div className="space-y-4 pt-8 border-t">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Saved Jobs
        </h2>

        {savedJobs && savedJobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((job) => (
              <Card key={job.id} className="flex flex-col">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <CardTitle className="text-lg leading-tight line-clamp-2 pr-2">
                    {job.job_title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -m-2 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DeleteJobButton id={job.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 pb-2">
                   <div className="flex items-center gap-2 text-sm font-medium">
                     <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                     <span className="truncate">{job.company}</span>
                   </div>
                   {job.location && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <MapPin className="h-4 w-4 shrink-0" />
                       <span className="truncate">{job.location}</span>
                     </div>
                   )}
                </CardContent>
                <CardFooter className="pt-2 border-t mt-auto p-4">
                   <Button size="sm" className="w-full" asChild>
                     <a href={job.apply_link} target="_blank" rel="noreferrer">
                       Apply Now <ExternalLink className="h-3 w-3 ml-2" />
                     </a>
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No saved jobs</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You haven't saved any jobs yet. Use the search above to find opportunities.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
