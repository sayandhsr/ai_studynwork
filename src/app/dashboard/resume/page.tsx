import { createClient } from "@/lib/supabase/server"
import { ResumeBuilder } from "./resume-builder"

export default async function ResumeBuilderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">AI ATS Resume Builder</h1>
        <p className="text-muted-foreground">Create a tailored, ATS-friendly resume to land your next interview.</p>
      </div>

      <div className="pt-4">
         <ResumeBuilder />
      </div>
    </div>
  )
}
