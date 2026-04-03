import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, FileText, CalendarDays, MoreVertical } from "lucide-react"
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Knowledge Base</p>
          <h1 className="text-3xl font-bold text-foreground">Wisdom Archives</h1>
          <p className="text-sm text-muted-foreground">Capture and organize your technical insights.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Search notes..."
              className="pl-10 h-10 bg-background border-border text-sm"
              defaultValue={query}
            />
          </form>
          <Button asChild className="h-10 px-4 bg-primary hover:bg-primary/90 text-black font-semibold text-sm rounded-md">
            <Link href="/dashboard/notes/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Note
            </Link>
          </Button>
        </div>
      </div>

      {/* Notes Grid */}
      {notes && notes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note: any) => (
            <div key={note.id} className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all flex flex-col h-full group">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/dashboard/notes/${note.id}`} className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {note.title || "Untitled Note"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-muted-foreground uppercase">
                      <CalendarDays className="h-3 w-3" />
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/notes/${note.id}`} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          <span>Edit Note</span>
                        </Link>
                      </DropdownMenuItem>
                      <DeleteNoteButton id={note.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                  {note.content?.substring(0, 200).replace(/[#*`_~]/g, '') || "No content summary available."}
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border/50 flex justify-end">
                <Link href={`/dashboard/notes/${note.id}`} className="text-xs font-bold text-primary hover:underline">
                  Read More →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <FileText className="h-12 w-12 text-muted/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No notes found</h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mb-6">
            {query ? `No records matching "${query}"` : "Start documenting your technical journey today."}
          </p>
          {!query && (
            <Button asChild variant="outline" className="h-10 px-6">
              <Link href="/dashboard/notes/new">Create First Note</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
