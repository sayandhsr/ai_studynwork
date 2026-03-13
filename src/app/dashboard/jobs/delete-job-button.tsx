"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Trash } from "lucide-react"

export function DeleteJobButton({ id }: { id: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function deleteJob() {
    setLoading(true)
    const { error } = await supabase.from("saved_jobs").delete().match({ id })
    setLoading(false)

    if (!error) {
      router.refresh()
    }
  }

  return (
    <div
      onClick={(e) => {
        e.preventDefault()
        deleteJob()
      }}
      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive hover:bg-destructive/10 cursor-pointer"
    >
      <Trash className="mr-2 h-4 w-4" />
      <span>{loading ? "Removing..." : "Remove"}</span>
    </div>
  )
}
