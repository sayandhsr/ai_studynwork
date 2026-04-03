import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, Search, FileText, CalendarDays, MoreVertical, 
  Tag, Clock, Folder, Filter, ArrowUpRight 
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteNoteButton } from "./delete-button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import * as motion from "framer-motion/client"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default async function NotesPage(props: {
  searchParams: Promise<{ q?: string; tab?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const query = searchParams.q || ""
  const activeTab = searchParams.tab || "all"
  
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
    
    // Simple mock category data for the UI
    const folders = [
      { name: "Technical", count: 12, icon: Folder, color: "text-blue-500" },
      { name: "Strategic", count: 5, icon: Target, color: "text-amber-500" },
      { name: "Personal", count: 8, icon: User, color: "text-purple-500" },
    ]
  } catch (err) {
    console.error("Notes error", err)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="h-5 w-1 bg-primary rounded-full" />
             <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Knowledge Repository</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Fragments</h1>
          <p className="text-sm text-muted-foreground font-medium">Capture wisdom, distill lectures, and archive your technical journey.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <form className="relative w-full sm:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              name="q"
              type="search"
              placeholder="Recall a fragment..."
              className="w-full pl-10 h-11 bg-card/50 border-border rounded-xl text-sm focus-visible:ring-primary/20"
              defaultValue={query}
            />
          </form>
          <Button asChild className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/10">
            <Link href="/dashboard/notes/new">
              <Plus className="h-4 w-4 mr-2" /> Inscribe New
            </Link>
          </Button>
        </div>
      </div>

      {/* Categories / Folders - Horizontal Scroll */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { name: "All Records", icon: FileText, active: true },
          { name: "Technical", icon: Folder, active: false },
          { name: "Reflections", icon: Clock, active: false },
          { name: "Pinned", icon: Tag, active: false },
        ].map((folder) => (
          <button 
            key={folder.name}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all whitespace-nowrap ${
              folder.active 
              ? "bg-primary/10 border-primary text-primary font-bold shadow-sm" 
              : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <folder.icon className="h-4 w-4" />
            <span className="text-xs">{folder.name}</span>
          </button>
        ))}
      </div>

      {/* Main Tabs and Grid */}
      <Tabs defaultValue="all" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-10">
            <TabsTrigger value="all" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">Historical</TabsTrigger>
            <TabsTrigger value="today" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">Today</TabsTrigger>
            <TabsTrigger value="week" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">This Week</TabsTrigger>
          </TabsList>
          
          <Button variant="ghost" size="sm" className="h-10 text-[10px] font-bold uppercase text-muted-foreground hover:text-primary">
            <Filter className="h-3.5 w-3.5 mr-2" /> Collections
          </Button>
        </div>

        <TabsContent value="all">
          {notes.length > 0 ? (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {notes.map((note: any) => (
                <motion.div 
                  key={note.id} 
                  variants={item}
                  className="group p-6 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-all flex flex-col h-full shadow-sm relative overflow-hidden"
                >
                  <div className="flex-1 space-y-4 relative z-10">
                    <div className="flex items-start justify-between">
                       <Link href={`/dashboard/notes/${note.id}`} className="flex-1 min-w-0 pr-4">
                         <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                           {note.title || "Untitled Fragment"}
                         </h4>
                         <div className="flex items-center gap-2 mt-2">
                           <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                             <CalendarDays className="h-3 w-3 text-primary/40" />
                             {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                           </div>
                         </div>
                       </Link>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg">
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="p-1.5 rounded-xl border-border bg-popover shadow-2xl">
                           <DropdownMenuItem asChild className="rounded-lg h-9 text-xs font-semibold">
                             <Link href={`/dashboard/notes/${note.id}`} className="flex items-center gap-2">
                               <ArrowUpRight className="h-4 w-4 text-primary" />
                               <span>Open Fragment</span>
                             </Link>
                           </DropdownMenuItem>
                           <DropdownMenuItem className="rounded-lg h-9 text-xs font-semibold text-red-400 focus:text-red-400">
                             <DeleteNoteButton id={note.id} />
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                    
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                      {note.content?.substring(0, 200).replace(/[#*`_~]/g, '') || "The depth of this wisdom is still unfolding..."}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-4 border-t border-border/50 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                     <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-primary/40 uppercase tracking-tighter">System Log: Clean</span>
                     </div>
                     <Link href={`/dashboard/notes/${note.id}`} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center">
                        Synthesize <ArrowUpRight className="h-3 w-3 ml-1" />
                     </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-border/60 rounded-3xl space-y-6">
              <div className="p-4 rounded-full bg-primary/5 w-fit mx-auto">
                 <FileText className="h-10 w-10 text-primary/20" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">The Scroll is Untouched</h3>
                <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto">Inscribe your first fragment of knowledge to begin your technical legacy.</p>
              </div>
              <Button asChild variant="outline" className="h-11 px-8 rounded-xl border-primary/20 text-primary font-bold uppercase tracking-widest text-[10px] hover:bg-primary/5">
                <Link href="/dashboard/notes/new">Begin Inscription</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Target({ className }: { className?: string }) { return <Plus className={className} /> }
function User({ className }: { className?: string }) { return <FileText className={className} /> }
