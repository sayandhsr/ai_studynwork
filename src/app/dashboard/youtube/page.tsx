import { createClient } from "@/lib/supabase/server"
import { Youtube, ExternalLink, Play, Clock, Sparkles } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, startOfDay, subDays } from "date-fns"
import { SummaryGenerator } from "./summary-generator"
import { Button } from "@/components/ui/button"

export default async function YouTubeSummarizerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let summaries: any[] = [];
  try {
    if (user) {
      const { data } = await supabase
        .from("yt_summaries")
        .select("*")
        .order("created_at", { ascending: false });
      summaries = data || [];
    }
  } catch (err) {
    console.error("YouTube summaries fetch error", err)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      <div className="space-y-2 border-b border-border pb-8">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Automated Synthesis</p>
        <h1 className="text-3xl font-bold text-foreground">Video Intake Vault</h1>
        <p className="text-sm text-muted-foreground font-medium max-w-2xl">
          Distill complex lectures and technical videos into clear, professional fragments of wisdom.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card shadow-lg">
        <SummaryGenerator />
      </div>

      <div className="space-y-10">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Youtube className="h-5 w-5 text-red-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Synthesis History</h2>
        </div>

        {summaries.length > 0 ? (
          <div className="space-y-12">
            {renderSummarySection("Today", summaries.filter(s => new Date(s.created_at) >= startOfDay(new Date())))}
            {renderSummarySection("This Week", summaries.filter(s => {
              const d = new Date(s.created_at)
              return d < startOfDay(new Date()) && d >= subDays(startOfDay(new Date()), 7)
            }))}
            {renderSummarySection("Earlier", summaries.filter(s => new Date(s.created_at) < subDays(startOfDay(new Date()), 7)))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-card/20 border border-dashed border-border rounded-2xl text-center space-y-4">
            <Youtube className="w-12 h-12 text-primary/10" />
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">The visual ledger is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function renderSummarySection(title: string, sectionSummaries: any[]) {
  if (sectionSummaries.length === 0) return null
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 shrink-0">{title}</h3>
         <div className="h-[1px] w-full bg-border/40" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {sectionSummaries.map((summary: any) => (
          <div key={summary.id} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col h-full group shadow-sm">
            <div className="flex-1 space-y-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2 truncate flex-1 min-w-0 pr-4">
                  <a 
                    href={summary.video_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm font-bold text-foreground hover:text-primary transition-all flex items-center gap-2 group-hover:translate-x-1"
                  >
                     <Play className="h-4 w-4 shrink-0" />
                     <span>Resource Access</span>
                     <ExternalLink className="h-3 w-3 opacity-40 shrink-0" />
                  </a>
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                       <Clock className="h-3.5 w-3.5 opacity-40" />
                       {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true })}
                    </span>
                    {summary.mode_used && (
                      <span className="text-primary/70 font-bold bg-primary/10 px-2 py-0.5 rounded leading-none">
                         {summary.mode_used}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-5 font-medium">
                  {summary.summary.split('\n').find((l: string) => !l.toLowerCase().includes('title:'))?.replace('Summary:', '').trim() || "A fragment of visual synthesis."}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border/10 flex justify-between items-center">
                <div className="flex gap-1">
                   <div className="h-1.5 w-8 rounded-full bg-primary/20" />
                </div>
                <Button variant="ghost" size="sm" asChild className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10">
                  <Link href={`/dashboard/notes/new?title=Synthesis Reflection&content=${encodeURIComponent(summary.summary)}`}>
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                    Inscribe
                  </Link>
                </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
