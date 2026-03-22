"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Youtube, Wand2, Loader2, Sparkles, CheckCircle2, History, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SummaryGenerator() {
  const router = useRouter()
  const supabase = createClient()
  const [url, setUrl] = useState("")
  const [manualTranscript, setManualTranscript] = useState("")
  const [mode, setMode] = useState<"auto" | "manual">("auto")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progressStep, setProgressStep] = useState(0)
  const [lastResult, setLastResult] = useState<{ summary: string; mode_used: string } | null>(null)
  const [savingNote, setSavingNote] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const steps = [
    "Fetching transcript...",
    "Generating summary..."
  ]

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return;
    
    if (mode === "auto") {
      if (!url.trim() || !url.toLowerCase().includes("yout")) {
        setError("Please enter a valid YouTube link")
        return
      }
    } else {
      if (!manualTranscript.trim() || manualTranscript.length < 10) {
        setError("Please paste a transcript or key text")
        return
      }
    }

    setError("")
    setLastResult(null)
    setLoading(true)
    setProgressStep(0)

    // Parallel progress simulation for better UX (Slower steps for V3)
    const progressInterval = setInterval(() => {
      setProgressStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 4000)

    try {
      const payload = mode === "auto" ? { url } : { manualTranscript }
      
      const response = await fetch("/api/summarize-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary")
      }

      setLastResult({ summary: data.summary, mode_used: data.mode_used })
      setUrl("")
      setManualTranscript("")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
    }
  }

  const handleSaveToNotes = async () => {
    if (!lastResult || savingNote) return;
    setSavingNote(true)
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Auth required to save notes")

      const titleMatch = lastResult.summary.match(/Title:\s*(.*)/i);
      const noteTitle = titleMatch ? titleMatch[1].trim() : `YouTube Report`;
      
      const { error: dbError } = await supabase.from("notes").insert([{ 
        user_id: user.id, 
        title: noteTitle, 
        content: lastResult.summary 
      }])

      if (dbError) throw dbError;
      
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save note.")
    } finally {
      setSavingNote(false)
    }
  }

  // Parse sections safely
  const title = lastResult?.summary.split("\n").find(l => l.toLowerCase().startsWith("title:"))?.split(":")[1]?.trim() || "Insights Found";
  const hasSummary = lastResult?.summary.includes("Summary:");
  const summaryText = hasSummary ? lastResult?.summary.split("Summary:")[1]?.split("Key Points:")[0]?.trim() : null;
  const keyPoints = (lastResult?.summary.includes("Key Points:") 
    ? lastResult?.summary.split("Key Points:")[1]?.split("\n") 
    : lastResult?.summary.split("\n").filter(l => l.trim().startsWith("•")))
    ?.filter(l => l.trim().startsWith("•")) || [];

  return (
    <Card className="rounded-none border-border/40 border bg-card/50 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <CardContent className="p-10">
        <div className="flex flex-col gap-10">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[440px] bg-muted/30 border border-border/20 p-1 rounded-none">
              <TabsTrigger value="auto" className="gap-3 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                <Youtube className="w-3 h-3" /> Auto Distill
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-3 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                <Wand2 className="w-3 h-3" /> Manual Scribe
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleGenerate} className="flex flex-col gap-8">
            {mode === "auto" ? (
              <div className="relative group">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="URL of the Lecture (e.g. youtube.com/watch?v=...)"
                  className="pl-12 h-14 rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light tracking-wide text-lg"
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  placeholder="Paste the oral wisdom or text here..."
                  className="min-h-[200px] rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light tracking-wide text-lg p-6 resize-none"
                  disabled={loading}
                />
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 italic">
                  Tip: Direct transcripts offer the deepest insights.
                </p>
              </div>
            )}
            
            <Button type="submit" disabled={loading || (mode === "auto" ? !url : !manualTranscript)} className="h-16 gap-4 rounded-none bg-primary hover:bg-primary/90 transition-all font-bold uppercase tracking-[0.3em] text-xs relative overflow-hidden group">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {loading ? (
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-[10px]">{steps[progressStep]}</span>
                </div>
              ) : "Distill Insights"}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity skew-x-12 translate-x-full group-hover:translate-x-0 duration-700" />
            </Button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-light italic text-center rounded-none"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </div>
        
        {lastResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-8"
          >
            <div className="p-10 rounded-none border border-primary/20 bg-primary/5 relative overflow-hidden space-y-10">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-4xl font-heading italic tracking-tight text-foreground/90 leading-tight">
                    {title}
                  </h3>
                  
                  {hasSummary ? (
                    <>
                      <p className="text-xl font-light italic text-foreground/70 leading-relaxed border-l-2 border-primary/30 pl-8">
                        {summaryText}
                      </p>
                      
                      <ul className="grid gap-6">
                        {keyPoints.map((point, i) => (
                          <motion.li 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-4 text-sm font-light italic leading-relaxed text-foreground/80 group"
                          >
                            <span className="text-primary mt-1.5 opacity-50 group-hover:opacity-100 transition-opacity">•</span>
                            {point.replace("•", "").trim()}
                          </motion.li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div className="text-lg font-light italic text-foreground/80 leading-relaxed whitespace-pre-wrap border-l-2 border-primary/30 pl-8">
                      {lastResult.summary}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-10 flex flex-col sm:flex-row gap-4 border-t border-primary/10">
                <Button 
                   onClick={handleSaveToNotes}
                   disabled={savingNote || savedSuccess}
                   className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground h-14 uppercase tracking-[0.3em] text-[10px] font-bold transition-all px-8 border border-primary/20"
                >
                   {savingNote ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : (savedSuccess ? <CheckCircle2 className="h-4 w-4 mr-3" /> : <Sparkles className="h-4 w-4 mr-3" />)}
                   {savedSuccess ? "Secured" : "Save to Collection"}
                </Button>
                <Button 
                  asChild
                  className="rounded-none bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 h-14 uppercase tracking-[0.3em] text-[10px] font-bold transition-all px-8"
                >
                  <a href="/dashboard/notes">
                    <History className="h-4 w-4 mr-3" />
                    Archive
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setLastResult(null)}
                  className="h-14 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-primary/5 rounded-none px-8"
                >
                   Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
