"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Youtube, Wand2, Loader2, Sparkles } from "lucide-react"
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

  const steps = [
    "Validating Knowledge Cache...",
    "Extracting Transcript Wisdom...",
    "Partitioning Content Chunks...",
    "Processing Parallel Synthesis...",
    "Finalizing Study Manifesto..."
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
    setLoading(true)
    setProgressStep(0)

    // Parallel progress simulation for better UX
    const progressInterval = setInterval(() => {
      setProgressStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 2800)

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
                  <span className="text-[8px] opacity-60 animate-pulse">Distilling Knowledge in Parallel...</span>
                </div>
              ) : "Distill Insights"}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity skew-x-12 translate-x-full group-hover:translate-x-0 duration-700" />
            </Button>
          </form>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 rounded-none bg-destructive/5 border border-destructive/20 space-y-4 font-serif"
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-destructive flex items-center gap-3">
              <span className="flex h-1.5 w-1.5 rounded-full bg-destructive" />
              Extraction Interrupted
            </p>
            <p className="text-base italic font-light opacity-80 leading-relaxed">
              {error}
            </p>
            {error.includes("Manual Mode") && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMode("manual")}
                className="w-full border-destructive/20 hover:bg-destructive/10 text-destructive font-bold uppercase tracking-widest text-[10px] h-12 rounded-none"
              >
                Switch to Manual Scribe
              </Button>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
