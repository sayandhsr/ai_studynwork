import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NoteEditor } from "./note-editor"

export default async function EditNotePage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  let note = null

  if (params.id !== "new") {
    // Fetch existing note
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("id", params.id)
      .single()

    if (data) {
      note = data
    } else {
      redirect("/dashboard/notes")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {note ? "Edit Note" : "Create Note"}
          </h1>
          <p className="text-muted-foreground">
            {note ? "Update your ideas and thoughts." : "Start writing or paste external content."}
          </p>
        </div>
      </div>

      <NoteEditor initialData={note} />
    </div>
  )
}
