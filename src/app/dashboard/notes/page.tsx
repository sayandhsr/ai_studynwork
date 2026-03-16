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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-primary/40" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">Thought Archive</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading tracking-tight italic">Notes Saver</h1>
          <p className="text-foreground/60 text-lg font-light italic leading-relaxed max-w-xl">
            "Every scribbled thought is a seed for future brilliance. Capture it here."
          </p>
        </div>
        <Button asChild className="gap-3 rounded-none h-14 px-8 bg-primary hover:bg-primary/90 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl group">
          <Link href="/dashboard/notes/new">
            <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform" />
            Capture Note
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2 pt-4">
        <form className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
          <Input
            name="q"
            id="search"
            type="search"
            placeholder="Recall a memory..."
            className="w-full pl-12 h-14 rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light tracking-wide text-lg"
            defaultValue={query}
          />
        </form>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 pb-20">
          {notes.map((note) => (
            <Card key={note.id} className="flex flex-col rounded-none border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group">
              <CardHeader className="pb-4 border-b border-border/20 bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 w-full pr-4 text-left">
                    <Link href={`/dashboard/notes/${note.id}`} className="hover:text-primary transition-colors">
                      <h4 className="font-heading text-2xl italic tracking-tight line-clamp-1">{note.title}</h4>
                    </Link>
                    <CardDescription className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase opacity-50">
                      <CalendarDays className="h-3 w-3" />
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 border border-transparent hover:border-border/30 rounded-none transition-all">
                        <MoreVertical className="h-4 w-4 opacity-50" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border/30 p-2 font-serif bg-card">
                      <DropdownMenuItem asChild className="h-10 italic font-light hover:bg-primary/5 rounded-none cursor-pointer">
                        <Link href={`/dashboard/notes/${note.id}`}>Refine Note</Link>
                      </DropdownMenuItem>
                      <DeleteNoteButton id={note.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-8 px-8">
                <p className="text-base leading-relaxed font-light italic text-foreground/80 line-clamp-4">
                  {note.content?.replace(/[#*`_~]/g, '') || "No wisdom captured."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-24 bg-muted/10 border border-dashed border-border/40 text-center space-y-6">
          <FileText className="h-12 w-12 opacity-10" />
          <div className="space-y-2">
            <h3 className="text-sm font-bold tracking-[0.4em] uppercase opacity-40 italic">Silence in the Vault</h3>
            <p className="text-base font-light italic opacity-60 max-w-xs">
              {query ? `No records matching "${query}".` : "Your legacy begins with a single word."}
            </p>
          </div>
          {!query && (
            <Button asChild variant="ghost" className="text-primary hover:bg-primary/10 rounded-none h-12 px-8 uppercase tracking-[0.3em] text-[10px] font-bold border border-primary/20">
              <Link href="/dashboard/notes/new">Inscribe Note</Link>
            </Button>
          )}
        </div>
      )}

    </div>
  )
}
