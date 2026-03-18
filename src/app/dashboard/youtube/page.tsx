import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Youtube, ExternalLink, Trash, Plus, Sparkles } from "lucide-react"
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
    <div className="space-y-12 font-serif selection:bg-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary/40" />
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">Visual Scribe</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading tracking-tight italic">AI YouTube Summarizer</h1>
        <p className="text-foreground/60 text-lg font-light max-w-2xl italic leading-relaxed">
          "Extract the essence of any lecture. Every video is a story waiting to be distilled into wisdom."
        </p>
      </div>

      {/* Generator Component */}
      <div className="relative">
        <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        <SummaryGenerator />
      </div>

      <div className="space-y-8 pt-12 border-t border-border/30">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-[0.4em] uppercase opacity-50 flex items-center gap-4">
            <Youtube className="h-4 w-4 text-primary" />
            Your Archive
          </h2>
        </div>

        {summaries && summaries.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 pb-20">
            {summaries.map((summary) => (
              <Card key={summary.id} className="flex flex-col rounded-none border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group">
                <CardHeader className="pb-4 border-b border-border/20 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 truncate pr-4 text-left w-full">
                      <a 
                        href={summary.video_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold tracking-widest hover:text-primary transition-colors flex items-center gap-2 truncate opacity-70 group-hover:opacity-100"
                      >
                         VIDEO RESOURCE
                         <ExternalLink className="h-3 w-3 inline" />
                      </a>
                      <CardDescription className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-50 flex items-center gap-2">
                        {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true })}
                        {summary.mode_used && (
                          <>
                            <span className="opacity-20">|</span>
                            <span className="text-primary/60">Source: {summary.mode_used}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-8 px-8 text-base leading-relaxed font-light italic text-foreground/80 space-y-6">
                  <div className="whitespace-pre-wrap first-letter:text-4xl first-letter:font-heading first-letter:text-primary first-letter:mr-1 first-letter:float-left">{summary.summary}</div>
                  
                  <div className="pt-8 flex gap-4 justify-end border-t border-border/10">
                     <Button variant="ghost" size="sm" asChild className="text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 rounded-none">
                       <Link href={`/dashboard/notes/new?title=YouTube Summary&content=${encodeURIComponent(summary.summary)}`}>
                         <Plus className="h-4 w-4 mr-2" />
                         Transcribe to Note
                       </Link>
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-muted/10 border border-dashed border-border/40 text-center space-y-4">
            <Sparkles className="w-10 h-10 opacity-20" />
            <p className="text-sm font-bold tracking-widest uppercase opacity-40 italic">The archive is empty.</p>
          </div>
        )}
      </div>

    </div>
  )
}
