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

import { TiptapEditor } from "@/components/notes/editor"

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
  const [lastSaved, setLastSaved] = useState<Date | null>(initialData?.id ? new Date() : null)
  
  const isEditing = !!initialData?.id

  // Implement simple debounced autosave if editing an existing note
  useEffect(() => {
    if (!isEditing) return

    const timer = setTimeout(async () => {
      if (title !== initialData?.title || content !== initialData?.content) {
        setIsAutoSaving(true)
        
        const { error } = await supabase
          .from("notes")
          .update({ title: title || "Untitled Fragment", content })
          .eq("id", initialData.id)
          
        if (!error) {
          setLastSaved(new Date())
        }
        setIsAutoSaving(false)
        router.refresh()
      }
    }, 3000) // Auto-save after 3s of inactivity

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
        .update({ title: title || "Untitled Fragment", content })
        .eq("id", initialData.id)
        
      setIsSaving(false)
      router.push("/dashboard/notes")
    } else {
      const { data, error } = await supabase
        .from("notes")
        .insert([{ user_id: user.id, title: title || "Untitled Fragment", content }])
        .select()
        .single()
        
      setIsSaving(false)
      if (error) {
        console.error("Save Error:", error)
        return
      }
      
      if (data) {
        router.push(`/dashboard/notes`)
      }
    }
    
    router.refresh()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 font-serif">
      <div className="flex items-center justify-between border-b border-border/10 pb-8">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-none hover:bg-primary/5 text-muted transition-all">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted">Document Registry</span>
             </div>
             <p className="text-xs italic text-muted/40 font-light">
                {isEditing ? (lastSaved ? `Last preserved ${lastSaved.toLocaleTimeString()}` : "Synchronizing...") : "New fragment initialization"}
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           {isAutoSaving && (
             <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 animate-pulse">
                <Loader2 className="h-3 w-3 text-primary/60 animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Preserving...</span>
             </div>
           )}
           <Button 
             onClick={handleSave} 
             disabled={isSaving} 
             className="rounded-none h-14 px-10 bg-primary hover:bg-primary/90 font-bold uppercase tracking-[0.3em] text-[10px] transition-all shadow-[0_0_25px_rgba(212,175,55,0.15)] group"
           >
             {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />}
             {isEditing ? "Archive Changes" : "Finalize Fragment"}
           </Button>
        </div>
      </div>

      <div className="space-y-10">
        <Input
          placeholder="A Title Worth Remembering..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-5xl md:text-6xl font-heading tracking-tight italic border-0 px-0 focus-visible:ring-0 shadow-none rounded-none bg-transparent h-auto placeholder:text-muted/10 selection:bg-primary/20"
        />
        
        <div className="glass-card p-10 min-h-[700px] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
             <Save className="w-32 h-32" />
          </div>
          <TiptapEditor 
             content={content} 
             onChange={setContent} 
             placeholder="Begin your intellectual journey here..."
          />
        </div>
      </div>
    </div>
  )
}
