"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Loader2, Sparkles, History, Globe, Shield } from "lucide-react"
import Link from "next/link"
import { TiptapEditor } from "@/components/notes/editor"
import { motion } from "framer-motion"
import { toast } from "sonner"

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
    }, 5000)

    return () => clearTimeout(timer)
  }, [title, content, isEditing, initialData, supabase, router])

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      toast.error("Fragment content is missing.")
      return
    }

    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Auth session expired.")
      setIsSaving(false)
      return
    }

    try {
      if (isEditing) {
        await supabase
          .from("notes")
          .update({ title: title || "Untitled Fragment", content })
          .eq("id", initialData.id)
        toast.success("Fragment preservation complete.")
        router.push("/dashboard/notes")
      } else {
        const { data, error } = await supabase
          .from("notes")
          .insert([{ user_id: user.id, title: title || "Untitled Fragment", content }])
          .select()
          .single()
        
        if (error) throw error
        toast.success("New fragment inscribed.")
        router.push(`/dashboard/notes`)
      }
    } catch (err) {
      toast.error("Inscription failed.")
      console.error(err)
    } finally {
      setIsSaving(false)
      router.refresh()
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24">
      {/* Premium Editor Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border pb-8"
      >
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl border border-border hover:bg-accent text-muted-foreground transition-all">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary/40" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/60">Secure Protocol</span>
             </div>
             <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                <span>{isEditing ? (lastSaved ? `Last sync: ${lastSaved.toLocaleTimeString()}` : "Syncing...") : "Draft initialization"}</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           {isAutoSaving && (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg animate-pulse hidden sm:flex">
                <Loader2 className="h-3 w-3 text-primary/60 animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Syncing...</span>
             </div>
           )}
           <Button 
             onClick={handleSave} 
             disabled={isSaving} 
             className="flex-1 md:flex-none h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95"
           >
             {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
             {isEditing ? "Commit Changes" : "Inscribe Fragment"}
           </Button>
        </div>
      </motion.div>

      {/* Editor Surface */}
      <div className="space-y-8">
        <Input
          placeholder="A Title Worth Remembering..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-4xl md:text-5xl font-bold tracking-tight border-0 px-0 focus-visible:ring-0 shadow-none rounded-none bg-transparent h-auto placeholder:text-muted-foreground/20 selection:bg-primary/20"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 min-h-[600px] bg-card relative shadow-2xl"
        >
          <TiptapEditor 
             content={content} 
             onChange={setContent} 
             placeholder="Begin your intellectual journey here..."
          />
          <div className="absolute bottom-6 right-6 flex items-center gap-4 opacity-20 pointer-events-none">
             <Globe className="h-4 w-4" />
             <Sparkles className="h-4 w-4" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
