import { createClient } from "@/lib/supabase/server"
import { Youtube, ExternalLink, Plus, Sparkles, History } from "lucide-react"
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
    <div className="space-y-20 pb-20 font-serif selection:bg-primary/20">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px w-10 bg-primary/30" />
          <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-muted">Aural Intelligence</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-heading tracking-tight italic text-foreground leading-tight">Video Synthesis Vault</h1>
        <p className="text-muted text-xl font-light max-w-3xl italic leading-relaxed">
          "Distill the relative truth from any lecture. Every sequence is a narrative waiting to be decoded into lasting wisdom."
        </p>
      </div>

      {/* Generator Component */}
      <div className="relative group">
        <div className="absolute -inset-10 bg-primary/5 blur-[120px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <SummaryGenerator />
      </div>

      <div className="space-y-12">
        <div className="flex items-center justify-between border-b border-border/10 pb-6">
          <h2 className="text-[10px] font-bold tracking-[0.5em] uppercase text-muted flex items-center gap-4">
            <Youtube className="h-4 w-4 text-primary/60" />
            Synthesis Ledger
          </h2>
        </div>

        {summaries && summaries.length > 0 ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-2 pb-20">
            {summaries.map((summary) => (
              <div key={summary.id} className="glass-card p-1 group flex flex-col h-full hover:translate-y-[-4px] transition-all duration-500">
                <div className="p-10 flex flex-col h-full space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 truncate pr-4 text-left w-full">
                      <a 
                        href={summary.video_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] font-bold tracking-[0.3em] text-primary/60 hover:text-primary transition-all flex items-center gap-3 uppercase group-hover:translate-x-1"
                      >
                         Access Resource
                         <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-muted/30">
                        <span className="flex items-center gap-1.5">
                           <History className="h-3 w-3 text-muted/40" />
                           {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true })}
                        </span>
                        {summary.mode_used && (
                          <>
                            <span className="opacity-10">•</span>
                            <span className="text-primary/40 italic">
                               {summary.mode_used}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <p className="text-lg leading-relaxed font-light italic text-muted/80 line-clamp-6 overflow-hidden first-letter:text-5xl first-letter:font-heading first-letter:text-primary/60 first-letter:mr-3 first-letter:float-left">
                      {summary.summary.split('\n').find(l => !l.toLowerCase().includes('title:'))?.replace('Summary:', '').trim() || "A fragment of visual wisdom."}
                    </p>
                  </div>
                  
                  <div className="pt-8 flex gap-4 justify-between items-center border-t border-border/5">
                      <div className="flex gap-1.5">
                         <div className="h-1 w-6 bg-primary/20" />
                         <div className="h-1 w-3 bg-primary/10" />
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-[9px] font-bold uppercase tracking-[0.3em] hover:text-primary hover:bg-primary/5 rounded-none transition-all">
                        <Link href={`/dashboard/notes/new?title=Synthesis Reflection&content=${encodeURIComponent(summary.summary)}`}>
                          <Sparkles className="h-3.5 w-3.5 mr-2" />
                          Commit to Archive
                        </Link>
                      </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-32 bg-[#0B0F14]/30 border border-dashed border-border/10 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
            <div className="relative">
              <Youtube className="w-16 h-16 text-primary/5" />
              <Sparkles className="h-8 w-8 text-primary/20 absolute -top-4 -right-4 animate-pulse" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-muted/30 italic">No distilled wisdom found in the vault.</p>
          </div>
        )}
      </div>

    </div>
  )
}
