"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Save,
  ArrowLeft,
  Loader2,
  Pin,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { TiptapEditor } from "@/components/notes/editor"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NoteData {
  id?: string
  title: string
  content: string
  category?: string
  pinned?: boolean
}

export function NoteEditor({ initialData }: { initialData?: NoteData | null }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [title, setTitle] = useState(initialData?.title || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [category, setCategory] = useState(initialData?.category || "")
  const [pinned, setPinned] = useState(initialData?.pinned || false)
  const [isSaving, setIsSaving] = useState(false)
  
  const isEditing = !!initialData?.id

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a note title.")
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Authentication session lost.")

      const payload = { 
        title: title.trim(), 
        content: content || "",
        category: category || "general",
        pinned: !!pinned,
        user_id: user.id
      }

      if (isEditing) {
        const { error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", initialData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("notes")
          .insert([payload])
        if (error) throw error
      }

      toast.success("Note saved successfully.")
      router.push("/dashboard/notes")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to save note.")
    } finally {
      setIsSaving(false)
    }
  }

  // Ctrl + S support
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [title, content, category, pinned])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="rounded-xl active:scale-95 transition-all text-muted-foreground hover:text-foreground">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-xs font-bold uppercase tracking-widest">Back to Notes</span>
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-white/10 text-[10px] font-bold uppercase tracking-widest bg-white/5 active:scale-95 transition-all">
                {category || "General"} <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl border-white/10 p-1">
              <DropdownMenuItem onClick={() => setCategory("general")} className="rounded-lg text-xs font-bold">General</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory("technical")} className="rounded-lg text-xs font-bold">Technical</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory("reflection")} className="rounded-lg text-xs font-bold">Reflection</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Pin Toggle */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setPinned(!pinned)}
            className={`h-9 w-9 rounded-xl border-white/10 active:scale-95 transition-all ${pinned ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground hover:text-primary"}`}
          >
            <Pin className={`h-4 w-4 ${pinned ? "fill-primary" : ""}`} />
          </Button>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="h-9 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
            Save Note
          </Button>
        </div>
      </header>

      {/* Editor Surface */}
      <main className="flex-1 pt-12 pb-32 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 space-y-10">
          {/* Simple Title Input */}
          <div className="space-y-4">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="w-full bg-transparent text-xl font-bold tracking-tight border-none focus:ring-0 placeholder:text-muted-foreground/30 p-0"
            />
            <div className="h-[1px] w-full bg-white/5" />
          </div>

          {/* Clean Content Area */}
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none min-h-[500px]">
             <TiptapEditor 
               content={content} 
               onChange={setContent} 
               placeholder="Start writing your note..."
             />
          </div>
        </div>
      </main>
    </div>
  )
}
