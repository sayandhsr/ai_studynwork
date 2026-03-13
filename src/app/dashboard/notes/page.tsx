import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  
  let notesQuery = supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false })

  if (query) {
    notesQuery = notesQuery.ilike("title", `%${query}%`)
  }

  const { data: notes } = await notesQuery

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes Saver</h1>
          <p className="text-muted-foreground">Capture your ideas, research, and reflections.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/notes/new">
            <PlusCircle className="h-4 w-4" />
            New Note
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <form className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            id="search"
            type="search"
            placeholder="Search notes..."
            className="w-full pl-9 bg-background"
            defaultValue={query}
          />
        </form>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1 w-full pr-4 text-left">
                  <Link href={`/dashboard/notes/${note.id}`} className="hover:underline">
                    <CardTitle className="line-clamp-1">{note.title}</CardTitle>
                  </Link>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <CalendarDays className="h-3 w-3" />
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -m-2">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/notes/${note.id}`}>Edit</Link>
                    </DropdownMenuItem>
                    <DeleteNoteButton id={note.id} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {/* Remove simple markdown formatting for preview */}
                  {note.content?.replace(/[#*`_~]/g, '') || "No content"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 sum bg-card rounded-xl border border-dashed text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No notes found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {query ? `No notes matching "${query}".` : "You haven't created any notes yet. Create your first note to get started!"}
          </p>
          {!query && (
            <Button asChild variant="outline">
              <Link href="/dashboard/notes/new">Create Note</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
