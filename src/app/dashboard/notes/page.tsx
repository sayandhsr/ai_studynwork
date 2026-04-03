import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, Search, FileText, CalendarDays, MoreVertical, 
  Tag, Clock, Folder, Filter, ArrowUpRight, Pin
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, startOfDay, subDays } from "date-fns"
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
  searchParams: Promise<{ q?: string; tab?: string; category?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const query = searchParams.q || ""
  const activeTab = searchParams.tab || "all"
  const activeCategory = searchParams.category || "all"
  
  let notes = []
  try {
    let notesQuery = supabase
      .from("notes")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (query) {
      notesQuery = notesQuery.ilike("title", `%${query}%`)
    }

    if (activeCategory === "pinned") {
      notesQuery = notesQuery.eq("pinned", true)
    } else if (activeCategory !== "all") {
      notesQuery = notesQuery.ilike("category", activeCategory)
    }

    const now = new Date()
    if (activeTab === "today") {
      notesQuery = notesQuery.gte("created_at", startOfDay(now).toISOString())
    } else if (activeTab === "week") {
      notesQuery = notesQuery.gte("created_at", subDays(now, 7).toISOString())
    } else if (activeTab === "historical") {
      notesQuery = notesQuery.lt("created_at", subDays(now, 7).toISOString())
    }

    const { data, error } = await notesQuery
    if (error) throw error
    notes = data || []
    
  } catch (err) {
    console.error("Notes listing error", err)
  }

  const categoryOptions = [
    { name: "all", label: "All Records", icon: FileText },
    { name: "technical", label: "Technical", icon: Folder },
    { name: "reflection", label: "Reflections", icon: Clock },
    { name: "pinned", label: "Pinned", icon: Pin },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-foreground selection:bg-primary/20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="h-4 w-1 bg-primary rounded-full" />
             <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Knowledge Base</p>
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic">My Notes</h1>
          <p className="text-sm text-muted-foreground font-medium">Archive your technical journey and distill your daily insights.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <form className="relative w-full sm:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              name="q"
              type="search"
              placeholder="Search notes..."
              className="w-full pl-10 h-11 bg-white/[0.02] border-white/5 rounded-xl text-sm focus-visible:ring-primary/20"
              defaultValue={query}
            />
          </form>
          <Button asChild className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-primary/10 active:scale-95">
            <Link href="/dashboard/notes/new">
              <Plus className="h-4 w-4 mr-2" /> Create Note
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {categoryOptions.map((cat) => (
          <Link 
            key={cat.name}
            href={`/dashboard/notes?tab=${activeTab}&category=${cat.name}${query ? `&q=${query}` : ''}`}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all whitespace-nowrap active:scale-95 ${
              activeCategory === cat.name 
              ? "bg-primary/10 border-primary text-primary font-bold shadow-sm" 
              : "bg-white/[0.02] border-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
            }`}
          >
            <cat.icon className={`h-3.5 w-3.5 ${cat.name === 'pinned' && activeCategory === 'pinned' ? 'fill-primary' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{cat.label}</span>
          </Link>
        ))}
      </div>

      <Tabs defaultValue={activeTab} className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white/[0.02] p-1 rounded-xl h-10 border border-white/5">
            <Link href={`/dashboard/notes?tab=all&category=${activeCategory}${query ? `&q=${query}` : ''}`}>
              <TabsTrigger value="all" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">All Records</TabsTrigger>
            </Link>
            <Link href={`/dashboard/notes?tab=today&category=${activeCategory}${query ? `&q=${query}` : ''}`}>
              <TabsTrigger value="today" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">Today</TabsTrigger>
            </Link>
            <Link href={`/dashboard/notes?tab=week&category=${activeCategory}${query ? `&q=${query}` : ''}`}>
              <TabsTrigger value="week" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">Last 7 Days</TabsTrigger>
            </Link>
            <Link href={`/dashboard/notes?tab=historical&category=${activeCategory}${query ? `&q=${query}` : ''}`}>
              <TabsTrigger value="historical" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">Historical</TabsTrigger>
            </Link>
          </TabsList>
          
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">
            <Filter className="h-3 w-3" />
            <span>{notes.length} Records found</span>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {notes.length > 0 ? (
            <div className="space-y-12">
              {activeTab === "all" ? (
                <>
                  {renderNoteSection("Current", notes.filter(n => new Date(n.created_at) >= startOfDay(new Date())))}
                  {renderNoteSection("Recent", notes.filter(n => {
                    const d = new Date(n.created_at)
                    return d < startOfDay(new Date()) && d >= subDays(startOfDay(new Date()), 7)
                  }))}
                  {renderNoteSection("Archived", notes.filter(n => new Date(n.created_at) < subDays(startOfDay(new Date()), 7)))}
                </>
              ) : (
                <motion.div 
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {notes.map((note: any) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </motion.div>
              )}
            </div>
          ) : (
            <div className="text-center py-24 border border-dashed border-white/5 rounded-3xl space-y-6 bg-white/[0.01]">
              <div className="p-4 rounded-full bg-primary/5 w-fit mx-auto">
                 <FileText className="h-10 w-10 text-primary/20" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">Archive Empty</h3>
                <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto">None of your notes match the current strategy. Try adjusting your filters.</p>
              </div>
              <Button asChild variant="outline" className="h-11 px-8 rounded-xl border-white/10 text-muted-foreground font-bold uppercase tracking-widest text-[10px] hover:bg-white/5">
                <Link href="/dashboard/notes">Clear All Filters</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function renderNoteSection(title: string, sectionNotes: any[]) {
  if (sectionNotes.length === 0) return null
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 shrink-0 italic">{title}</h3>
         <div className="h-[1px] w-full bg-white/5" />
      </div>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {sectionNotes.map((note: any) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </motion.div>
    </div>
  )
}

function NoteCard({ note }: { note: any }) {
  return (
    <motion.div 
      variants={item}
      className={`group p-6 rounded-2xl border transition-all flex flex-col h-full shadow-sm relative overflow-hidden active:scale-[0.99] ${
        note.pinned 
          ? "border-primary/20 bg-primary/[0.02]" 
          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
      }`}
    >
      {note.pinned && (
        <div className="absolute top-4 right-4">
          <Pin className="h-3 w-3 text-primary fill-primary opacity-50" />
        </div>
      )}
      
      <div className="flex-1 space-y-4 relative z-10">
        <div className="flex items-start justify-between">
           <Link href={`/dashboard/notes/${note.id}`} className="flex-1 min-w-0">
             <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
               {note.title || "Untitled Note"}
             </h4>
             <div className="flex flex-wrap items-center gap-3 mt-3">
               <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">
                 <Clock className="h-3 w-3" />
                 {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
               </div>
               {note.pinned && (
                  <div className="text-[9px] font-bold uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded italic">
                    Pinned
                  </div>
               )}
             </div>
           </Link>
           <div className="flex items-center ml-2">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white rounded-lg -mr-2 bg-transparent">
                   <MoreVertical className="h-4 w-4" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="p-1 rounded-xl border-white/10 bg-[#0a0a0a] shadow-2xl">
                 <DropdownMenuItem asChild className="rounded-lg h-9 text-xs font-bold uppercase tracking-widest">
                   <Link href={`/dashboard/notes/${note.id}`} className="flex items-center gap-2">
                     <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                     <span>Open Note</span>
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuItem className="rounded-lg h-9 text-xs font-bold uppercase tracking-widest text-red-400 focus:text-red-400">
                   <DeleteNoteButton id={note.id} />
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
        </div>
        
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3 font-medium opacity-60 group-hover:opacity-100 transition-opacity">
          {note.content?.substring(0, 180).replace(/<[^>]*>/g, '').replace(/[#*`_~]/g, '') || "No additional details provided..."}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/5">
         <div className="flex items-center gap-1 opacity-20">
            <FileText className="h-3 w-3" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">{note.category || "General"}</span>
         </div>
         <Link href={`/dashboard/notes/${note.id}`} className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary hover:underline flex items-center">
            Read Note <ArrowUpRight className="h-3 w-3 ml-1.5" />
         </Link>
      </div>
    </motion.div>
  )
}
    </motion.div>
  )
}
