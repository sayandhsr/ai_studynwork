import { createClient } from "@/lib/supabase/server"
import { ResumeBuilder } from "./resume-builder"
import { Sparkles, FileEdit } from "lucide-react"

export default async function ResumeBuilderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="space-y-12 pb-20 font-serif selection:bg-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary/40" />
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">Professional Identity</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-heading tracking-tight italic">AI Resume Builder</h1>
            <p className="text-foreground/60 text-lg font-light italic max-w-2xl leading-relaxed">
              "Your story is unique; your presentation should be nothing less than exceptional."
            </p>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 bg-primary/5 border border-primary/20 backdrop-blur-sm self-start md:self-auto">
             <FileEdit className="h-5 w-5 text-primary opacity-60" />
             <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-40 leading-none">Status</span>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Inscribing Excellence</span>
             </div>
          </div>
        </div>
      </div>

      <div className="pt-8">
         <ResumeBuilder />
      </div>

    </div>
  )
}
