import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Youtube, ExternalLink, Trash, Plus } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { SummaryGenerator } from "./summary-generator"
import { Button } from "@/components/ui/button"

export default async function YouTubeSummarizerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: summaries } = await supabase
    .from("yt_summaries")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI YouTube Summarizer</h1>
        <p className="text-muted-foreground">Paste a YouTube link to get a quick AI-generated summary.</p>
      </div>

      {/* Generator Component */}
      <SummaryGenerator />

      <div className="space-y-4 pt-4 border-t">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          Your Summaries
        </h2>

        {summaries && summaries.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {summaries.map((summary) => (
              <Card key={summary.id} className="flex flex-col">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 truncate pr-4 text-left">
                      <a 
                        href={summary.video_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm font-medium hover:underline text-blue-500 flex items-center gap-1 truncate"
                      >
                         {summary.video_url}
                         <ExternalLink className="h-3 w-3 inline" />
                      </a>
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4 text-sm prose dark:prose-invert min-w-full">
                  <div className="whitespace-pre-wrap">{summary.summary}</div>
                  
                  <div className="pt-4 flex gap-2 justify-end">
                     <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/notes/new?title=YouTube Summary&content=${encodeURIComponent(summary.summary)}`}>
                         <Plus className="h-4 w-4 mr-1" />
                         Save as Note
                       </Link>
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border border-dashed text-center">
            <p className="text-sm text-muted-foreground">No summaries generated yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
