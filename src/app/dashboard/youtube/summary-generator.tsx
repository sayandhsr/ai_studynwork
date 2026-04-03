"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Youtube, Wand2, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SummaryGenerator() {
  const router = useRouter()
  const supabase = createClient()
  const [url, setUrl] = useState("")
  const [manualTranscript, setManualTranscript] = useState("")
  const [level, setLevel] = useState<"brief" | "detailed" | "actionable">("detailed")
  const [mode, setMode] = useState<"auto" | "manual">("auto")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progressStep, setProgressStep] = useState(0)
  const [lastResult, setLastResult] = useState<{ summary: string; mode_used: string; v?: string; debug?: string } | null>(null)
  const [savingNote, setSavingNote] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const steps = [
    "Spurce Analytics: Dialing YouTube...",
    "Extracting Oral Wisdom...",
    "Synthesizing with Spurce-AI..."
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

    const progressInterval = setInterval(() => {
      setProgressStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 4500)

    try {
      const payload = mode === "auto" ? { url, level } : { manualTranscript, level }
      const response = await fetch("/api/summarize-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.summary || "System connection interrupted.");

      setLastResult(data)
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
      const noteTitle = titleMatch ? titleMatch[1].trim() : `YouTube Synthesis Report`;
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

  const summaryLines = lastResult?.summary.split("\n") || [];
  const title = summaryLines.find(l => l.toLowerCase().startsWith("title:"))?.split(":")[1]?.trim() || "Synthesis Result";
  const hasSummary = lastResult?.summary.includes("Summary:");
  const summaryText = hasSummary ? lastResult?.summary.split("Summary:")[1]?.split("Key Points:")[0]?.trim() : null;
  const keyPoints = (lastResult?.summary.includes("Key Points:") 
    ? lastResult?.summary.split("Key Points:")[1]?.split("\n") 
    : summaryLines.filter(l => l.trim().startsWith("•")))
    ?.filter(l => l.trim().startsWith("•")) || [];

  const isErrorMessage = lastResult?.summary.includes("ERROR:") || lastResult?.summary.includes("Blocked");

  return (
    <div className="glass-card p-1 group relative overflow-hidden">
      <div className="p-10 space-y-12">
        <div className="flex flex-col md:flex-row gap-10 items-start md:items-end justify-between">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full md:w-auto">
            <TabsList className="grid w-80 grid-cols-2 bg-[#0B0F14] border border-border/10 p-1 rounded-none">
              <TabsTrigger value="auto" className="gap-3 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                <Youtube className="w-3.5 h-3.5" /> Auto
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-3 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                <Wand2 className="w-3.5 h-3.5" /> Manual
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4 w-full md:w-auto">
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted block text-right">Synthesis Depth</span>
            <div className="flex gap-2 justify-end">
               {(['brief', 'detailed', 'actionable'] as const).map((l) => (
                 <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] border transition-all ${level === l ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-border/10 text-muted/40 hover:border-primary/40'}`}
                 >
                    {l}
                 </button>
               ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-10 border-b border-border/5 pb-12">
          {mode === "auto" ? (
            <div className="relative group">
              <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted/20 group-focus-within:text-primary transition-colors" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste the architectural link here..."
                className="pl-16 h-20 rounded-none border-border/10 focus-visible:ring-primary/10 bg-[#0B0F14]/50 italic font-light tracking-wide text-xl selection:bg-primary/20"
                disabled={loading}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="Inscribe the oral wisdom or text here..."
                className="min-h-[300px] rounded-none border-border/10 focus-visible:ring-primary/10 bg-[#0B0F14]/50 italic font-light tracking-wide text-xl p-10 resize-none selection:bg-primary/20 leading-relaxed"
                disabled={loading}
              />
            </div>
          )}
          
          <Button type="submit" disabled={loading || (mode === "auto" ? !url : !manualTranscript)} className="h-24 gap-6 rounded-none bg-primary hover:bg-primary/90 transition-all font-bold uppercase tracking-[0.5em] text-xs relative overflow-hidden group shadow-[0_0_30px_rgba(212,175,55,0.15)] text-primary-foreground">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6 group-hover:rotate-12 transition-transform" />}
            {loading ? (
              <div className="flex flex-col items-start leading-none gap-2 text-primary-foreground">
                <span className="text-[12px]">{steps[progressStep]}</span>
                <span className="text-[8px] opacity-70">Synchronizing Synthesis Core...</span>
              </div>
            ) : "Extract Essence"}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity skew-x-12 translate-x-full group-hover:translate-x-0 duration-1000" />
          </Button>
        </form>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 bg-destructive/5 border border-destructive/20 text-destructive text-sm font-light italic flex flex-col gap-6 rounded-none"
          >
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6" />
              <span className="font-bold uppercase tracking-[0.3em] text-[10px]">Extraction Anomaly Detected</span>
            </div>
            <p className="pl-10 leading-relaxed text-lg">{error}</p>
            <div className="pl-10 pt-6 border-t border-destructive/10 mt-2 text-[10px] opacity-40 uppercase tracking-widest leading-loose">
              If the transcript is protected, please utilize the Manual Scribe interface for raw text distillation.
            </div>
          </motion.div>
        )}

        {lastResult && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className={`p-12 rounded-none border ${isErrorMessage ? 'border-red-500/30 bg-red-500/5' : 'border-primary/20 bg-primary/5'} relative overflow-hidden space-y-10`}>
              <div className="space-y-12 text-left">
                <div className="space-y-8">
                  <h3 className={`text-4xl font-heading italic tracking-tight leading-tight ${isErrorMessage ? 'text-red-500' : 'text-foreground/90'}`}>
                    {title}
                  </h3>
                  
                  {hasSummary ? (
                    <>
                      <p className="text-xl font-light italic text-foreground/70 leading-relaxed border-l-2 border-primary/30 pl-8">
                        {summaryText}
                      </p>
                      
                      <ul className="grid gap-8">
                        {keyPoints.map((point, i) => (
                          <motion.li 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-6 text-sm font-light italic leading-relaxed text-foreground/80 group"
                          >
                            <span className="text-primary mt-1.5 opacity-40 group-hover:opacity-100 transition-opacity">•</span>
                            <span>{point.replace("•", "").trim()}</span>
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

              <div className="pt-10 flex flex-col sm:flex-row gap-6 border-t border-primary/10 items-center justify-between">
                <div className="flex gap-6">
                  <Button 
                    onClick={handleSaveToNotes}
                    disabled={savingNote || savedSuccess || isErrorMessage}
                    className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground h-14 uppercase tracking-[0.3em] text-[10px] font-bold transition-all px-10 border border-primary/20 shadow-lg"
                  >
                    {savingNote ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : (savedSuccess ? <CheckCircle2 className="h-4 w-4 mr-3" /> : <Sparkles className="h-4 w-4 mr-3" />)}
                    {savedSuccess ? "Secured" : "Commit to Archive"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setLastResult(null)}
                    className="h-14 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-primary/5 rounded-none px-10 border border-border/10"
                  >
                    Dismiss
                  </Button>
                </div>
                
                <div className="flex items-center gap-8 px-6">
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] uppercase tracking-[0.2em] opacity-30">Active Branch</span>
                      <span className="text-[10px] font-mono text-primary/60">{lastResult.v || "Legacy"}</span>
                   </div>
                   <div className="h-10 w-[1px] bg-primary/10" />
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] uppercase tracking-[0.2em] opacity-30">Trace Diagnostic</span>
                      <span className="text-[11px] font-mono text-primary/60 tracking-wider italic">{lastResult.debug || "No Trace"}</span>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
