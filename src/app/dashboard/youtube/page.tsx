import { createClient } from "@/lib/supabase/server"
import { Youtube, ExternalLink, Sparkles, History, PlayCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { SummaryGenerator } from "./summary-generator"
import { Button } from "@/components/ui/button"

export default async function YouTubeSummarizerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let summaries: any[] | null = null;
  if (user) {
    const { data } = await supabase
      .from("yt_summaries")
      .select("*")
      .order("created_at", { ascending: false });
    summaries = data;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Video Intelligence</p>
        <h1 className="text-3xl font-bold text-white">YouTube Summarizer</h1>
        <p className="text-sm text-gray-400 max-w-2xl">
          Distill long videos into actionable technical summaries in seconds.
        </p>
      </div>

      {/* Generator Section */}
      <div className="p-6 bg-card border border-border rounded-xl shadow-lg">
        <SummaryGenerator />
      </div>

      {/* History Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Youtube className="h-5 w-5 text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Recent Synthesis</h2>
        </div>

        {summaries && summaries.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {summaries.map((summary) => (
              <div key={summary.id} className="p-6 rounded-xl border border-border bg-card hover:border-primary/20 transition-all flex flex-col h-full group">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 truncate flex-1">
                      <a 
                        href={summary.video_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm font-bold text-white hover:text-primary flex items-center gap-2 group-hover:translate-x-1 transition-all"
                      >
                         <PlayCircle className="h-4 w-4 shrink-0" />
                         <span className="truncate">Source Video</span>
                         <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                      <div className="flex items-center gap-3 text-[10px] font-medium text-gray-500 uppercase">
                        <History className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true })}
                        {summary.mode_used && (
                          <span className="text-primary font-bold ml-2 px-1.5 py-0.5 bg-primary/10 rounded">{summary.mode_used}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-gray-300 line-clamp-5">
                      {summary.summary.split('\n').find(l => !l.toLowerCase().includes('title:'))?.replace('Summary:', '').trim() || "No preview available."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex justify-end">
                  <Button variant="ghost" size="sm" asChild className="h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10">
                    <Link href={`/dashboard/notes/new?title=Video Note&content=${encodeURIComponent(summary.summary)}`}>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Save to Notes
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Youtube className="h-10 w-10 text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium">Your synthesis vault is empty.</p>
          </div>
        )}
      </div>
    </div>
  )
}
