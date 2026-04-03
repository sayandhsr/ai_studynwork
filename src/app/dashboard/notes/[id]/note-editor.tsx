import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Save,
  ArrowLeft,
  Loader2,
  Trash2,
  Sparkles,
  PenTool,
  Hash,
  Pin,
  Printer,
} from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"
import Link from "next/link"
import { TiptapEditor } from "@/components/notes/editor"

interface NoteData {
  id?: string
  title: string
  content: string
  category?: string
  pinned?: boolean
  tags?: string[]
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
    documentTitle: title || "Technical Fragment",
  })
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(initialData?.id ? new Date() : null)
  
  const isEditing = !!initialData?.id

  // Implement simple debounced autosave if editing an existing note
  useEffect(() => {
    if (!isEditing) return

    const timer = setTimeout(async () => {
      const hasChanges = title !== initialData?.title || 
                         content !== initialData?.content || 
                         category !== initialData?.category || 
                         pinned !== initialData?.pinned

      if (hasChanges) {
        setIsAutoSaving(true)
        
        const { error } = await supabase
          .from("notes")
          .update({ 
            title: title || "Untitled Fragment", 
            content,
            category,
            pinned
          })
          .eq("id", initialData.id)
          
        if (!error) {
          setLastSaved(new Date())
        }
        setIsAutoSaving(false)
        router.refresh()
      }
    }, 3000) // Auto-save after 3s of inactivity

    return () => clearTimeout(timer)
  }, [title, content, category, pinned, isEditing, initialData, supabase, router])

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
        .update({ 
          title: title || "Untitled Fragment", 
          content,
          category,
          pinned
        })
        .eq("id", initialData.id)
        
      setIsSaving(false)
      router.push("/dashboard/notes")
    } else {
      const { data, error } = await supabase
        .from("notes")
        .insert([{ 
          user_id: user.id, 
          title: title || "Untitled Fragment", 
          content,
          category,
          pinned
        }])
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
           <div className="flex items-center bg-card/50 border border-border/20 p-1 rounded-lg">
             <button
               onClick={() => setCategory(category === "technical" ? "" : "technical")}
               className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${category === "technical" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-primary/5 text-muted-foreground"}`}
             >
               Technical
             </button>
             <button
               onClick={() => setCategory(category === "reflection" ? "" : "reflection")}
               className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${category === "reflection" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-primary/5 text-muted-foreground"}`}
             >
               Reflection
             </button>
           </div>

           <button
             onClick={() => setPinned(!pinned)}
             className={`flex items-center gap-2 px-4 py-2 border transition-all ${pinned ? "border-primary bg-primary/5 text-primary" : "border-border/20 text-muted-foreground hover:border-primary/30"}`}
           >
             <Pin className={`h-3.5 w-3.5 ${pinned ? "fill-primary" : ""}`} />
             <span className="text-[10px] font-bold uppercase tracking-widest">{pinned ? "Pinned" : "Pin Fragment"}</span>
           </button>

           {isAutoSaving && (
             <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 animate-pulse">
                <Loader2 className="h-3 w-3 text-primary/60 animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Preserving...</span>
             </div>
           )}
           <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePrint()}
            className="h-8 rounded-lg border-border text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 hover:text-primary"
          >
            <Printer className="h-3.5 w-3.5 mr-2" /> Download PDF
          </Button>

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

      <div className="space-y-10" ref={contentRef}>
        <div className="print:p-12 print:text-black">
          <Input
            placeholder="A Title Worth Remembering..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-5xl md:text-6xl font-heading tracking-tight italic border-0 px-0 focus-visible:ring-0 shadow-none rounded-none bg-transparent h-auto placeholder:text-muted/10 selection:bg-primary/20 uppercase print:text-4xl print:mb-8"
          />
          
          <div className="glass-card p-10 min-h-[700px] relative overflow-hidden print:border-none print:shadow-none print:p-0">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none print:hidden">
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
    </div>
  )
}
