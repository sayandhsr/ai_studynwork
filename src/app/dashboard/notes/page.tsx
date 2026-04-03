import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, FileText, CalendarDays, MoreVertical, Trash } from "lucide-react"
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
  
  let notes = []
  try {
    let notesQuery = supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })

    if (query) {
      notesQuery = notesQuery.ilike("title", `%${query}%`)
    }

    const { data } = await notesQuery
    notes = data || []
  } catch (err) {
    console.error("Notes fetch error", err)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Search and Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Knowledge Repository</p>
          <h1 className="text-3xl font-bold text-foreground">Wisdom Archives</h1>
          <p className="text-sm text-muted-foreground font-medium max-w-md">
            Your centralized vault for technical documentation and fragments of brilliance.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <form className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Search wisdom..."
              className="w-full pl-10 h-11 bg-card border-border text-sm"
              defaultValue={query}
            />
          </form>
          <Button asChild className="h-11 px-6 bg-primary hover:bg-primary/90 text-black font-bold uppercase text-[10px] tracking-widest">
            <Link href="/dashboard/notes/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Inscribe New
            </Link>
          </Button>
        </div>
      </div>

      {/* Records Grid */}
      {notes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note: any) => (
            <div key={note.id} className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all flex flex-col h-full shadow-sm">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 pr-4">
                    <Link href={`/dashboard/notes/${note.id}`} className="block">
                      <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {note.title || "Untitled Fragment"}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <CalendarDays className="h-3 w-3 text-primary/40" />
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-1 min-w-[160px] bg-card border-border shadow-xl">
                      <DropdownMenuItem asChild className="h-9 text-xs font-semibold cursor-pointer">
                        <Link href={`/dashboard/notes/${note.id}`} className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span>Refine Content</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="h-9 text-xs font-semibold cursor-pointer text-red-400 focus:text-red-400">
                        <DeleteNoteButton id={note.id} />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4 font-medium">
                  {note.content?.substring(0, 250).replace(/[#*`_~]/g, '') || "An empty vessel awaiting wisdom..."}
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border/10 flex items-center justify-between">
                 <div className="flex gap-1">
                   <div className="h-1.5 w-8 rounded-full bg-primary/20" />
                   <div className="h-1.5 w-3 rounded-full bg-primary/10" />
                 </div>
                 <Link href={`/dashboard/notes/${note.id}`} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                   Examine →
                 </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-card/20 border border-dashed border-border rounded-2xl text-center space-y-6">
          <FileText className="h-12 w-12 text-primary/10" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Vault is Empty</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {query ? `We found no records matches for "${query}".` : "Your intellectual journey is a silent expanse. Inscribe your first fragment to begin."}
            </p>
          </div>
          {!query && (
            <Button asChild className="h-11 px-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold uppercase tracking-widest text-[10px]">
              <Link href="/dashboard/notes/new">Inscribe First Note</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
