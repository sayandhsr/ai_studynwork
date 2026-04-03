import { createClient } from "./supabase/server"

export async function clearAllNotes() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
