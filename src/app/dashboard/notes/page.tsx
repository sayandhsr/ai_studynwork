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
      .order("pinned", { ascending: false }) // Pinned first
      .order("created_at", { ascending: false })

    // Apply search query
    if (query) {
      notesQuery = notesQuery.ilike("title", `%${query}%`)
    }

    // Apply category filter
    if (activeCategory === "pinned") {
      notesQuery = notesQuery.eq("pinned", true)
    } else if (activeCategory !== "all") {
      notesQuery = notesQuery.eq("category", activeCategory.toLowerCase())
    }

    // Apply time filter
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
        {categoryOptions.map((cat) => (
          <Link 
            key={cat.name}
            href={`/dashboard/notes?tab=${activeTab}&category=${cat.name}${query ? `&q=${query}` : ''}`}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all whitespace-nowrap ${
              activeCategory === cat.name 
              ? "bg-primary/10 border-primary text-primary font-bold shadow-sm" 
              : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <cat.icon className={`h-4 w-4 ${cat.name === 'pinned' && activeCategory === 'pinned' ? 'fill-primary' : ''}`} />
            <span className="text-xs uppercase tracking-widest">{cat.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Tabs and Grid */}
      <Tabs defaultValue={activeTab} className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-10">
            <Link href={`/dashboard/notes?tab=all&category=${activeCategory}${query ? `&q=${query}` : ''}`}>
              <TabsTrigger value="all" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">All Time</TabsTrigger>
            </Link>
            <Link href={`/dashboard/notes?tab=today&category=${activeCategory}${query ? `&q=${query}` : ''}`}>
              <TabsTrigger value="today" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">Today</TabsTrigger>
            </Link>
            <Link href={`/dashboard/notes?tab=week&category=${activeCategory}${query ? `&q=${query}` : ''}`}>
              <TabsTrigger value="week" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">This Week</TabsTrigger>
            </Link>
            <Link href={`/dashboard/notes?tab=historical&category=${activeCategory}${query ? `&q=${query}` : ''}`}>
              <TabsTrigger value="historical" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider">Historical</TabsTrigger>
            </Link>
          </TabsList>
          
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground/60">
            <Filter className="h-3 w-3" />
            <span>{notes.length} Fragments Identified</span>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
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
                  className={`group p-6 rounded-2xl border transition-all flex flex-col h-full shadow-sm relative overflow-hidden ${
                    note.pinned 
                      ? "border-primary/40 bg-primary/[0.02]" 
                      : "border-border bg-card/60 hover:bg-card hover:border-primary/40"
                  }`}
                >
                  {note.pinned && (
                    <div className="absolute top-4 right-4">
                      <Pin className="h-3 w-3 text-primary fill-primary animate-pulse" />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-4 relative z-10">
                    <div className="flex items-start justify-between pr-8">
                       <Link href={`/dashboard/notes/${note.id}`} className="flex-1 min-w-0">
                         <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                           {note.title || "Untitled Fragment"}
                         </h4>
                         <div className="flex flex-wrap items-center gap-3 mt-3">
                           <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                             <CalendarDays className="h-3 w-3 text-primary/40" />
                             {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                           </div>
                           {note.category && (
                             <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded">
                               <Tag className="h-3 w-3" />
                               {note.category}
                             </div>
                           )}
                         </div>
                       </Link>
                       <div className="absolute top-4 right-4 sm:static flex items-center">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg -mr-2">
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
                    </div>
                    
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                      {note.content?.substring(0, 200).replace(/[#*`_~]/g, '') || "The depth of this wisdom is still unfolding..."}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-4 border-t border-border/50 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                     <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-primary/40 uppercase tracking-tighter">System Log: Verified</span>
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
                <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto">None of your technical fragments match this classification filter.</p>
              </div>
              <Button asChild variant="outline" className="h-11 px-8 rounded-xl border-primary/20 text-primary font-bold uppercase tracking-widest text-[10px] hover:bg-primary/5">
                <Link href="/dashboard/notes">Reset All Filters</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
