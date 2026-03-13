"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Youtube, Wand2, Loader2 } from "lucide-react"

export function SummaryGenerator() {
  const router = useRouter()
  const supabase = createClient()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !url.includes("youtube.com") && !url.includes("youtu.be")) {
      setError("Please enter a valid YouTube URL")
      return
    }

    setError("")
    setLoading(true)

    try {
      // Create summary via internal API handler executing OpenRouter request
      const response = await fetch("/api/summarize-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary")
      }

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
         await supabase.from("yt_summaries").insert([{
           user_id: user.id,
           video_url: url,
           summary: data.summary
         }])
      }

      setUrl("")
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
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Youtube className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
              className="pl-9 h-10"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !url} className="h-10 gap-2 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "Generating..." : "Generate Summary"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </CardContent>
    </Card>
  )
}
