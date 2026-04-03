"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Youtube, Wand2, Loader2, Sparkles, CheckCircle2, 
  AlertCircle, Copy, ChevronDown, ChevronUp, Play, 
  Clock, Share2, Bookmark 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export function SummaryGenerator() {
  const router = useRouter()
  const supabase = createClient()
  const [url, setUrl] = useState("")
  const [level, setLevel] = useState<"brief" | "detailed" | "actionable">("detailed")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastResult, setLastResult] = useState<{ 
    summary: string; 
    video_url?: string;
    video_title?: string;
    thumbnail?: string;
  } | null>(null)
  const [savingNote, setSavingNote] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !url.toLowerCase().includes("yout")) {
        toast.error("Valid YouTube URL required.")
        return
    }

    setError("")
    setLastResult(null)
    setLoading(true)

    try {
      const response = await fetch("/api/summarize-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, level }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.summary || "Synthesis failed.");

      setLastResult({
        ...data,
        video_url: url,
        // Mock metadata if not returned by API
        video_title: data.summary.match(/Title:\s*(.*)/i)?.[1] || "Video Synthesis",
        thumbnail: `https://img.youtube.com/vi/${getYouTubeID(url)}/maxresdefault.jpg`
      })

      // PERSIST TO HISTORY - Ensure it appears in the vault
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("yt_summaries").insert([{
          user_id: user.id,
          video_url: url,
          video_id: getYouTubeID(url),
          summary: data.summary,
          mode_used: level
        }])
      }

      toast.success("Intelligence captured and archived.")
      setUrl("")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
      toast.error("Synthesis interrupted.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToNotes = async () => {
    if (!lastResult || savingNote) return;
    setSavingNote(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Auth required.")
        return
      }
      const { error: dbError } = await supabase.from("notes").insert([{ 
        user_id: user.id, 
        title: lastResult.video_title || "YouTube Synthesis", 
        content: lastResult.summary 
      }])
      if (dbError) throw dbError;
      toast.success("Synthesis committed to archive.")
    } catch (err: any) {
      toast.error("Failed to archive.")
    } finally {
      setSavingNote(false)
    }
  }

  const copyToClipboard = () => {
    if (!lastResult) return
    navigator.clipboard.writeText(lastResult.summary)
    toast.success("Summary copied to clipboard.")
  }

  const getYouTubeID = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div className="space-y-8">
      {/* Input Section - Premium SaaS Style */}
      <div className="card-premium p-8 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <Youtube className="w-32 h-32" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="space-y-1">
               <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Capture Engine</p>
               <h3 className="text-xl font-bold tracking-tight">Synthesize Video Wisdom</h3>
             </div>
             
             <div className="flex bg-muted/50 p-1 rounded-xl">
                {(['brief', 'detailed', 'actionable'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                      level === l 
                      ? 'bg-background shadow-sm text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {l}
                  </button>
                ))}
             </div>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1 group/input">
                <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube recruitment/technical link..."
                  className="pl-11 h-12 bg-background border-border rounded-xl focus:ring-primary/20 text-sm font-medium"
                  disabled={loading}
                />
             </div>
             <Button 
                type="submit" 
                disabled={loading || !url} 
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Wand2 className="h-4 w-4 mr-3" />}
                {loading ? "Synthesizing..." : "Extract Essence"}
             </Button>
          </form>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="card-premium p-8 space-y-6"
          >
            <div className="flex gap-6 items-center">
               <Skeleton className="h-32 w-56 rounded-xl shrink-0" />
               <div className="space-y-4 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                     <Skeleton className="h-3 w-16" />
                     <Skeleton className="h-3 w-16" />
                  </div>
               </div>
            </div>
            <div className="space-y-3 pt-6 border-t border-border/50">
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-2/3" />
            </div>
          </motion.div>
        )}

        {lastResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Video Discovery Card */}
            <div className="card-premium p-6 flex flex-col md:flex-row gap-6 items-center bg-accent/20">
               <div className="relative h-32 w-56 rounded-xl overflow-hidden shadow-lg group/thumb shrink-0">
                  <img src={lastResult.thumbnail} alt="" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                     <Play className="h-8 w-8 text-white opacity-80 group-hover:scale-110 transition-transform" />
                  </div>
               </div>
               <div className="flex-1 space-y-3 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 rounded bg-primary/10">Resource Identified</span>
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border px-2 py-0.5 rounded">YT-API-v4</span>
                  </div>
                  <h4 className="text-xl font-bold tracking-tight leading-tight line-clamp-2">
                    {lastResult.video_title}
                  </h4>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-medium text-muted-foreground">
                     <a href={lastResult.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <Youtube className="h-4 w-4" /> Original Signal
                     </a>
                     <div className="h-1 w-1 rounded-full bg-border" />
                     <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {level.toUpperCase()} ARCHIVE</span>
                  </div>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={copyToClipboard} className="rounded-xl h-10 w-10 border-border hover:text-primary"><Copy className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="rounded-xl h-10 w-10 border-border hover:text-primary">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
               </div>
            </div>

            {/* Summary Output Card */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="card-premium p-8 space-y-8 bg-card shadow-2xl relative">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                       <div className="space-y-10">
                          {/* Formatting the summary sections */}
                          <div className="space-y-8 text-foreground/90">
                              {lastResult.summary.split('\n\n').map((section, idx) => {
                                if (section.includes('Key Points:')) {
                                  return (
                                    <div key={idx} className="space-y-4">
                                      <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5" /> Logical Anchors
                                      </h5>
                                      <div className="grid gap-3 sm:grid-cols-2">
                                        {section.split('\n').filter(l => l.includes('•')).map((p, i) => (
                                          <div key={i} className="p-4 rounded-xl bg-accent/30 border border-border/50 text-xs font-medium leading-relaxed flex gap-3 group hover:border-primary/20 transition-all">
                                             <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                                             {p.replace('•', '').trim()}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                if (section.includes('Summary:')) {
                                   return (
                                     <div key={idx} className="space-y-4">
                                       <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                         <Share2 className="h-3.5 w-3.5" /> High-Level Synthesis
                                       </h5>
                                       <p className="text-sm border-l-2 border-primary/20 pl-6 py-1 text-muted-foreground leading-relaxed italic font-medium">
                                         {section.replace('Summary:', '').trim()}
                                       </p>
                                     </div>
                                   )
                                }
                                return null
                              })}
                              
                              {/* Fallback for raw output */}
                              {!lastResult.summary.includes('Summary:') && (
                                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{lastResult.summary}</p>
                              )}
                          </div>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase opacity-40">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Trace v9.0 Secure
                       </div>
                       <div className="flex items-center gap-3 w-full sm:w-auto">
                          <Button 
                            variant="outline" 
                            disabled={savingNote}
                            onClick={handleSaveToNotes}
                            className="flex-1 sm:flex-none h-11 px-6 rounded-xl border-border text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all"
                          >
                             {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Bookmark className="h-3.5 w-3.5 mr-2" />}
                             Archive Synthesis
                          </Button>
                          <Button className="flex-1 sm:flex-none h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/10">
                             Download Dataset
                          </Button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
