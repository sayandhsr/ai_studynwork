"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Telescope, Search, Loader2, Copy, Download, Trash2,
  Sparkles, Lightbulb, BookOpen, ExternalLink, ChevronDown,
  ChevronUp, Globe, Zap, AlertCircle, FileText
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ResearchResult {
  summary: string
  keyInsights: string[]
  detailedExplanation: string
  takeaways?: string[]
  sources: { title: string; url: string }[]
  query: string
  depth: string
  timestamp: string
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function ResearchEngine() {
  const router = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState("")
  const [depth, setDepth] = useState<"basic" | "advanced">("basic")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [error, setError] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    insights: true,
    explanation: false,
    sources: false,
  })

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleResearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || query.trim().length < 3) {
      toast.error("Enter a research query (at least 3 characters).")
      return
    }

    setError("")
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch("/api/deep-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, depth }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Research failed.")

      setResult(data)
      setExpandedSections({ summary: true, insights: true, explanation: false, sources: true })
      toast.success("Research synthesis complete.")
    } catch (err: any) {
      setError(err.message || "Research engine is temporarily offline.")
      toast.error("Synthesis interrupted.")
    } finally {
      setLoading(false)
    }
  }, [query, depth])

  const copyAll = () => {
    if (!result) return
    const text = `# Research: ${result.query}\n\n## Summary\n${result.summary}\n\n## Key Insights\n${result.keyInsights.map(i => `• ${i}`).join("\n")}\n\n## Detailed Explanation\n${result.detailedExplanation}\n\n## Sources\n${result.sources.map(s => `- ${s.title}: ${s.url}`).join("\n")}`
    navigator.clipboard.writeText(text)
    toast.success("Research copied to clipboard.")
  }

  const downloadTxt = () => {
    if (!result) return
    const text = `Research: ${result.query}\n\nSummary:\n${result.summary}\n\nKey Insights:\n${result.keyInsights.map(i => `• ${i}`).join("\n")}\n\nDetailed Explanation:\n${result.detailedExplanation}\n\nSources:\n${result.sources.map(s => `- ${s.title}: ${s.url}`).join("\n")}`
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `research-${result.query.replace(/\s+/g, "-").toLowerCase().substring(0, 30)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Research downloaded.")
  }

  const saveToNotes = async () => {
    if (!result) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error("Auth required."); return }
      const content = `## Summary\n${result.summary}\n\n## Key Insights\n${result.keyInsights.map(i => `• ${i}`).join("\n")}\n\n## Detailed Explanation\n${result.detailedExplanation}\n\n## Sources\n${result.sources.map(s => `- [${s.title}](${s.url})`).join("\n")}`
      await supabase.from("notes").insert([{
        user_id: user.id,
        title: `Research: ${result.query}`,
        content,
      }])
      toast.success("Research saved to Notes.")
      router.refresh()
    } catch {
      toast.error("Failed to save.")
    }
  }

  const clearResults = () => {
    setResult(null)
    setQuery("")
    setError("")
  }

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="card-premium p-8 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <Telescope className="w-32 h-32" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Research Engine</p>
            <h3 className="text-xl font-bold tracking-tight">Investigate Any Topic</h3>
          </div>

          <div className="flex bg-muted/50 p-1 rounded-xl">
            {(["basic", "advanced"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                className={`px-5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                  depth === d
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d === "basic" ? "Basic" : "Advanced"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleResearch} className="flex flex-col sm:flex-row gap-3 relative z-10">
          <div className="relative flex-1 group/input">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "Future of AI in healthcare" or "React Server Components best practices"'
              className="pl-11 h-12 bg-background border-border rounded-xl focus:ring-primary/20 text-sm font-medium"
              disabled={loading}
            />
            {query && !loading && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Telescope className="h-4 w-4 mr-3" />}
            {loading ? "Researching..." : "Start Research"}
          </Button>
        </form>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="card-premium p-8 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card-premium p-6 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-5 rounded-xl border bg-destructive/5 border-destructive/20 text-destructive text-sm font-medium"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Action Bar */}
            <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Research Complete</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                    {result.depth.toUpperCase()} · {result.sources.length} sources · {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyAll} className="h-9 rounded-lg text-xs font-medium">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTxt} className="h-9 rounded-lg text-xs font-medium">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </Button>
                <Button variant="outline" size="sm" onClick={saveToNotes} className="h-9 rounded-lg text-xs font-medium">
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Save to Notes
                </Button>
                <Button variant="ghost" size="sm" onClick={clearResults} className="h-9 rounded-lg text-xs text-muted-foreground">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>

            {/* Summary Card */}
            <motion.div variants={item}>
              <CollapsibleCard
                icon={BookOpen}
                title="Executive Summary"
                expanded={expandedSections.summary}
                onToggle={() => toggleSection("summary")}
              >
                <p className="text-sm leading-relaxed text-foreground/90 font-medium">{result.summary}</p>
              </CollapsibleCard>
            </motion.div>

            {/* Key Insights */}
            <motion.div variants={item}>
              <CollapsibleCard
                icon={Lightbulb}
                title={`Key Insights (${result.keyInsights.length})`}
                expanded={expandedSections.insights}
                onToggle={() => toggleSection("insights")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.keyInsights.map((insight, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-4 rounded-xl bg-accent/30 border border-border/50 text-sm font-medium leading-relaxed group hover:border-primary/20 transition-all"
                    >
                      <span className="text-primary font-bold text-xs mt-0.5 shrink-0">{i + 1}.</span>
                      <span className="text-foreground/80">{insight}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleCard>
            </motion.div>

            {/* Detailed Explanation */}
            <motion.div variants={item}>
              <CollapsibleCard
                icon={Telescope}
                title="Detailed Analysis"
                expanded={expandedSections.explanation}
                onToggle={() => toggleSection("explanation")}
              >
                <div className="text-sm leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
                  {result.detailedExplanation}
                </div>
              </CollapsibleCard>
            </motion.div>

            {/* Takeaways */}
            {result.takeaways && result.takeaways.length > 0 && (
              <motion.div variants={item}>
                <CollapsibleCard icon={Zap} title="Important Takeaways" expanded={true} onToggle={() => {}}>
                  <ul className="space-y-2">
                    {result.takeaways.map((t, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium text-foreground/80">
                        <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </CollapsibleCard>
              </motion.div>
            )}

            {/* Sources */}
            {result.sources.length > 0 && (
              <motion.div variants={item}>
                <CollapsibleCard
                  icon={Globe}
                  title={`Sources (${result.sources.length})`}
                  expanded={expandedSections.sources}
                  onToggle={() => toggleSection("sources")}
                >
                  <div className="grid gap-3">
                    {result.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-bold text-muted-foreground/40 shrink-0">{i + 1}</span>
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{source.title}</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </CollapsibleCard>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && !result && !error && (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl space-y-4">
          <Telescope className="h-10 w-10 text-primary/10 mx-auto" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
            Enter a topic above to begin deep research
          </p>
        </div>
      )}
    </div>
  )
}

// ── Collapsible Card Component ──
function CollapsibleCard({
  icon: Icon,
  title,
  expanded,
  onToggle,
  children,
}: {
  icon: any
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card-premium overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-6 text-left hover:bg-accent/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/5 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
