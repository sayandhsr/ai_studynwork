import { createClient } from "@/lib/supabase/server"
import { 
  FileText, Youtube, Briefcase, 
  Search, Plus, Sparkles, Clock, ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Optimized Fetching
  const [notes, yt, jobs] = await Promise.all([
    supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(4),
    supabase.from("yt_summaries").select("*", { count: "exact", head: true }),
    supabase.from("saved_jobs").select("*", { count: "exact", head: true }),
  ])

  const stats = [
    { label: "Total Notes", value: notes.data?.length || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Summaries", value: yt.count || 0, icon: Youtube, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Jobs Tracked", value: jobs.count || 0, icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  return (
    <DashboardContent 
      stats={stats} 
      recentNotes={notes.data || []} 
    />
  )
}
