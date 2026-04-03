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
  Printer,
  ChevronDown,
} from "lucide-react"
import { useReactToPrint } from "react-to-print"
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
  
  const contentRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: title || "Note",
  })
  
  const isEditing = !!initialData?.id

  // Ctrl + S handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [title, content, category, pinned])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your note.")
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Authentication required")

      const notePayload = { 
        title: title.trim(), 
        content,
        category,
        pinned
      }

      if (isEditing) {
        const { error } = await supabase
          .from("notes")
          .update(notePayload)
          .eq("id", initialData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("notes")
          .insert([{ ...notePayload, user_id: user.id }])
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top Bar Controls */}
      <div className="sticky top-0 z-20 w-full border-b border-white/5 bg-background/80 backdrop-blur-md px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-accent active:scale-95 transition-all">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="text-sm font-bold text-muted-foreground/60 tracking-tight">Editor</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl border-white/10 text-[10px] font-bold uppercase tracking-widest bg-card/40 hover:bg-accent active:scale-95 transition-all">
                {category || "Category"} <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl border-white/10 bg-popover shadow-2xl p-1">
              <DropdownMenuItem onClick={() => setCategory("")} className="rounded-lg text-xs font-semibold">General</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory("technical")} className="rounded-lg text-xs font-semibold">Technical</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory("reflection")} className="rounded-lg text-xs font-semibold">Reflection</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Pin Toggle */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setPinned(!pinned)}
            className={`h-10 w-10 rounded-xl border-white/10 active:scale-95 transition-all ${pinned ? "text-primary bg-primary/5 border-primary/20" : "text-muted-foreground hover:text-primary"}`}
          >
            <Pin className={`h-4 w-4 ${pinned ? "fill-primary" : ""}`} />
          </Button>

          {/* Print PDF */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => handlePrint()}
            className="h-10 w-10 rounded-xl border-white/10 hover:text-primary active:scale-95 transition-all"
          >
            <Printer className="h-4 w-4" />
          </Button>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Note
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto pt-16 pb-32">
        <div className="max-w-3xl mx-auto px-6 space-y-12" ref={contentRef}>
          {/* Title Area */}
          <div className="space-y-4 print:p-8">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="w-full bg-transparent text-2xl md:text-3xl font-bold tracking-tight border-b border-transparent focus:border-primary/20 focus:ring-0 placeholder:text-muted-foreground/20 transition-all py-2"
            />
            
            {/* Metadata (Simpler than before) */}
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
               <div className="flex items-center gap-1.5 bg-accent/30 px-2 py-1 rounded-md">
                  <Clock className="h-3 w-3" /> Auto-sync enabled
               </div>
               {category && (
                 <div className="flex items-center gap-1.5 bg-primary/5 text-primary/60 px-2 py-1 rounded-md">
                    <Hash className="h-3 w-3" /> {category}
                 </div>
               )}
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[600px] prose prose-lg dark:prose-invert max-w-none print:text-black">
            <TiptapEditor 
               content={content} 
               onChange={setContent} 
               placeholder="Start writing your note..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function Hash(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}
