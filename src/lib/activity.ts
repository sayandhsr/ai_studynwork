import { createClient } from "./supabase/server"

export type ActivityType = 
  | "note_created" 
  | "note_updated" 
  | "note_deleted" 
  | "research_done" 
  | "job_search" 
  | "video_summarized"

export async function logActivity(type: ActivityType, title: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Insert into Supabase activity_logs table
    // If the table doesn't exist, this will fail gracefully but we should try
    const { error } = await supabase.from('activity_logs').insert([{
      user_id: user.id,
      action_type: type,
      action_title: title,
    }])

    if (error) {
      console.warn("Activity log insert failed (likely missing table):", error.message)
    }
  } catch (err) {
    console.error("Critical error logging activity:", err)
  }
}
