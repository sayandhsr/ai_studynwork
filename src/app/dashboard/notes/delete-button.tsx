"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Trash, Loader2 } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function DeleteNoteButton({ id }: { id: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function deleteNote() {
    setLoading(true)
    const { error } = await supabase.from("notes").delete().match({ id })
    setLoading(false)

    if (!error) {
      router.refresh()
    }
  }

  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.preventDefault()
        deleteNote()
      }}
      disabled={loading}
      className="h-10 italic font-light hover:bg-destructive/10 text-destructive rounded-none cursor-pointer flex items-center gap-3 transition-colors"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
      <span>{loading ? "Vaporizing..." : "Erase Fragment"}</span>
    </DropdownMenuItem>
  )
}
