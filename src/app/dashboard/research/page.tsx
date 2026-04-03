import { ResearchEngine } from "./research-engine"

export default function DeepResearchPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-border pb-8">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 bg-primary rounded-full" />
          <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">AI Intelligence</p>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Deep Research</h1>
        <p className="text-sm text-muted-foreground font-medium max-w-2xl">
          Get detailed AI-powered research on any topic. Powered by real-time web intelligence and advanced synthesis.
        </p>
      </div>

      {/* Engine */}
      <ResearchEngine />
    </div>
  )
}
