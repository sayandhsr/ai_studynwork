import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, FileText, CalendarDays, MoreVertical, Trash, Sparkles } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteNoteButton } from "./delete-button"

export default async function NotesPage(props: {
  searchParams: Promise<{ q?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const query = searchParams.q || ""
  
  let notesQuery = supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false })

  if (query) {
    notesQuery = notesQuery.ilike("title", `%${query}%`)
  }

  const { data: notes } = await notesQuery

  return (
    <div className="space-y-12 font-serif selection:bg-primary/20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-8 border-b border-border/10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-primary/40" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted">Thought Sanctuary</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-heading tracking-tight italic text-foreground">Wisdom Archives</h1>
          <p className="text-muted text-lg font-light italic leading-relaxed max-w-2xl">
            "Every scribbled thought is a seed for future brilliance. Capture your legacy in the quiet of this vault."
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <form className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40 group-focus-within:text-primary transition-colors" />
            <Input
              name="q"
              id="search"
              type="search"
              placeholder="Recall a memory..."
              className="w-full pl-12 h-14 rounded-none border-border/10 focus-visible:ring-primary/20 bg-[#0B0F14]/50 italic font-light tracking-wide text-base"
              defaultValue={query}
            />
          </form>
          <Button asChild className="w-full sm:w-auto gap-3 rounded-none h-14 px-8 bg-primary hover:bg-primary/90 font-bold uppercase tracking-[0.3em] text-[10px] transition-all shadow-[0_0_20px_rgba(212,175,55,0.1)] group">
            <Link href="/dashboard/notes/new">
              <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform" />
              Inscribe New Note
            </Link>
          </Button>
        </div>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 pb-20">
          {notes.map((note: any) => (
            <div key={note.id} className="glass-card p-1 group flex flex-col min-h-[320px]">
              <div className="p-8 flex flex-col h-full space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 pr-4 text-left">
                    <Link href={`/dashboard/notes/${note.id}`} className="block group-hover:translate-x-1 transition-transform">
                      <h4 className="font-heading text-2xl italic tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">{note.title || "Untitled Fragment"}</h4>
                    </Link>
                    <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] uppercase text-muted/40">
                      <CalendarDays className="h-3 w-3 text-primary/40" />
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-none transition-all opacity-40 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border/10 p-2 font-serif bg-[#0B0F14] shadow-2xl">
                      <DropdownMenuItem asChild className="h-10 italic font-light hover:bg-primary/5 rounded-none cursor-pointer">
                        <Link href={`/dashboard/notes/${note.id}`} className="flex items-center gap-3">
                          <FileText className="h-3.5 w-3.5 text-primary/60" />
                          <span>Refine Content</span>
                        </Link>
                      </DropdownMenuItem>
                      <DeleteNoteButton id={note.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex-1">
                  <p className="text-base leading-relaxed font-light italic text-muted/80 line-clamp-4 overflow-hidden">
                    {note.content?.replace(/[#*`_~]/g, '') || "An empty vessel waiting for wisdom..."}
                  </p>
                </div>
                
                <div className="pt-6 border-t border-border/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                   <div className="flex gap-1">
                     <div className="h-1 w-4 bg-primary/20" />
                     <div className="h-1 w-2 bg-primary/10" />
                   </div>
                   <Link href={`/dashboard/notes/${note.id}`} className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary hover:underline">
                     Examine Close →
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-32 bg-[#0B0F14]/30 border border-dashed border-border/10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <FileText className="h-20 w-20 text-primary/5" />
            <Sparkles className="h-8 w-8 text-primary/20 absolute -top-4 -right-4 animate-pulse" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-heading italic tracking-tight text-foreground/40">The Scroll is Untouched</h3>
            <p className="text-sm font-light italic text-muted/40 max-w-sm mx-auto leading-relaxed">
              {query ? `We found no records of "${query}" in the technical depths.` : "Your intellectual journey is a silent expanse. Inscribe your first fragment to begin."}
            </p>
          </div>
          {!query && (
            <Button asChild className="bg-primary/10 hover:bg-primary/20 text-primary rounded-none h-14 px-10 uppercase tracking-[0.4em] text-[10px] font-bold border border-primary/20 transition-all">
              <Link href="/dashboard/notes/new">Inscribe First Note</Link>
            </Button>
          )}
        </div>
      )}

    </div>
  )
}
