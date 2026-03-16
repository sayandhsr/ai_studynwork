"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Youtube, Wand2, Loader2 } from "lucide-react"

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === "auto") {
      if (!url.trim() || !url.includes("youtube.com") && !url.includes("youtu.be")) {
        setError("Please enter a valid YouTube URL")
        return
      }
    } else {
      if (!manualTranscript.trim() || manualTranscript.length < 50) {
        setError("Please paste a transcript (at least 50 characters)")
        return
      }
    }

    setError("")
    setLoading(true)

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
      setLoading(false)
    }
  }

  return (
    <Card className="border shadow-sm bg-card/50">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="auto" className="gap-2">
                <Youtube className="w-4 h-4" /> Auto Mode
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Wand2 className="w-4 h-4" /> Manual Mode
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            {mode === "auto" ? (
              <div className="relative">
                <Youtube className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                  className="pl-9 h-11 rounded-xl"
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  placeholder="Paste the video transcript or key text here..."
                  className="min-h-[150px] rounded-xl resize-none"
                  disabled={loading}
                />
                <p className="text-[10px] text-muted-foreground italic px-1">
                  Tip: Copy transcripts from YouTube's "Show Transcript" sidebar.
                </p>
              </div>
            )}
            
            <Button type="submit" disabled={loading || (mode === "auto" ? !url : !manualTranscript)} className="h-11 gap-2 rounded-xl bg-primary hover:bg-primary/90 transition-all font-semibold relative overflow-hidden">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {loading ? (
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-sm">Processing...</span>
                  <span className="text-[10px] opacity-70 animate-pulse">Deep AI Analysis Running</span>
                </div>
              ) : "Generate AI Insights"}
            </Button>
          </form>
        </div>
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3 font-sans">
            <p className="text-sm font-bold text-destructive flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Extraction Failed
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error}
            </p>
            {error.includes("Manual Mode") && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMode("manual")}
                className="w-full border-destructive/20 hover:bg-destructive/10 text-destructive font-black transition-all rounded-xl py-5"
              >
                Switch to Manual Mode & Paste Transcript
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
