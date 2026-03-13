"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

interface NoteData {
  id?: string
  title: string
  content: string
  tags?: string[]
}

export function NoteEditor({ initialData }: { initialData?: NoteData | null }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [title, setTitle] = useState(initialData?.title || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  
  const isEditing = !!initialData?.id

  // Implement simple debounced autosave if editing an existing note
  useEffect(() => {
    if (!isEditing) return

    const timer = setTimeout(async () => {
      if (title !== initialData?.title || content !== initialData?.content) {
        setIsAutoSaving(true)
        
        await supabase
          .from("notes")
          .update({ title, content })
          .eq("id", initialData.id)
          
        setIsAutoSaving(false)
        router.refresh()
      }
    }, 2000) // Auto-save after 2s of inactivity

    return () => clearTimeout(timer)
  }, [title, content, isEditing, initialData, supabase, router])

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return

    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSaving(false)
      return
    }

    if (isEditing) {
      await supabase
        .from("notes")
        .update({ title: title || "Untitled Note", content })
        .eq("id", initialData.id)
        
      setIsSaving(false)
      router.push("/dashboard/notes")
    } else {
      const { data, error } = await supabase
        .from("notes")
        .insert([{ user_id: user.id, title: title || "Untitled Note", content }])
        .select()
        .single()
        
      setIsSaving(false)
      if (error) {
        console.error("Save Error:", error)
        alert("Failed to save note: " + error.message)
        return
      }
      
      if (data) {
        router.push(`/dashboard/notes`)
      }
    }
    
    router.refresh()
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1 -ml-2 text-muted-foreground">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {isAutoSaving && <span className="text-xs text-muted-foreground animate-pulse">Autosaving...</span>}
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? "Save Changes" : "Create Note"}
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Input
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold border-0 px-0 focus-visible:ring-0 shadow-none rounded-none"
          />
          
          <Textarea
            placeholder="Write your note here or paste text..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60vh] resize-none border-0 px-0 focus-visible:ring-0 shadow-none text-base leading-relaxed p-0"
          />
        </div>
      </CardContent>
    </Card>
  )
}
