"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, FileText, Youtube, Briefcase, Command, History, X, Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"

interface SearchResult {
  id: string
  title: string
  type: 'note' | 'youtube' | 'job'
  link: string
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const togglePalette = useCallback(() => setIsOpen(prev => !prev), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        togglePalette()
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    const handleToggle = () => togglePalette()

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("toggle-command-palette", handleToggle)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("toggle-command-palette", handleToggle)
    }
  }, [togglePalette])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const search = async () => {
      setLoading(true)
      try {
        const [
          { data: notes },
          { data: summaries },
          { data: jobs }
        ] = await Promise.all([
          supabase.from('notes').select('id, title').ilike('title', `%${query}%`).limit(3),
          supabase.from('yt_summaries').select('id, video_url').ilike('video_url', `%${query}%`).limit(3),
          supabase.from('saved_jobs').select('id, job_title').ilike('job_title', `%${query}%`).limit(3)
        ])

        const formattedResults: SearchResult[] = [
          ...(notes?.map(n => ({ id: n.id, title: n.title, type: 'note' as const, link: `/dashboard/notes/${n.id}` })) || []),
          ...(summaries?.map(s => ({ id: s.id, title: "Video Insight", type: 'youtube' as const, link: `/dashboard/youtube` })) || []),
          ...(jobs?.map(j => ({ id: j.id, title: j.job_title, type: 'job' as const, link: `/dashboard/jobs` })) || [])
        ]
        setResults(formattedResults)
      } catch (err) {
        console.error("Global search failed", err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [query, supabase])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#0B0F14]/80 backdrop-blur-md z-[100] cursor-crosshair"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101] px-4"
          >
            <div className="glass-card shadow-2xl overflow-hidden p-1 border border-primary/20">
              <div className="bg-[#0B0F14]/95 p-2">
                <div className="relative group">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/20 group-focus-within:text-primary transition-colors" />
                   <Input 
                     autoFocus
                     placeholder="Search the sanctuary..."
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     className="h-20 bg-transparent border-0 ring-0 focus-visible:ring-0 text-xl font-heading italic pl-16 pr-8 selection:bg-primary/20"
                   />
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-4 items-center">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-muted/40">
                         <span className="opacity-60">ESC</span>
                      </div>
                      <X className="h-5 w-5 text-muted/20 cursor-pointer hover:text-primary transition-colors" onClick={() => setIsOpen(false)} />
                   </div>
                </div>

                <div className="border-t border-border/5 max-h-[400px] overflow-auto pb-4">
                  {query === "" ? (
                    <div className="p-10 space-y-8">
                       <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-primary/40 block">Immediate Access</span>
                       <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Notes Vault', icon: FileText, href: '/dashboard/notes' },
                            { label: 'Insight Archive', icon: Youtube, href: '/dashboard/youtube' },
                            { label: 'Career Oracle', icon: Briefcase, href: '/dashboard/jobs' },
                            { label: 'Intelligence Desk', icon: Sparkles, href: '/dashboard/assistant' }
                          ].map((item) => (
                            <button 
                              key={item.href}
                              onClick={() => { router.push(item.href); setIsOpen(false); }}
                              className="flex items-center gap-4 p-6 border border-border/5 hover:border-primary/20 hover:bg-primary/5 transition-all group text-left"
                            >
                               <item.icon className="h-5 w-5 text-primary/40 group-hover:text-primary group-hover:rotate-12 transition-all" />
                               <span className="text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">{item.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                       {loading && (
                         <div className="p-10 flex flex-col items-center justify-center gap-4 animate-pulse">
                            <Sparkles className="h-8 w-8 text-primary/10" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted/20">Synthesizing Results...</span>
                         </div>
                       )}
                       
                       {!loading && results.length > 0 && results.map((result) => (
                         <button 
                           key={result.id}
                           onClick={() => { router.push(result.link); setIsOpen(false); }}
                           className="w-full flex items-center justify-between p-6 hover:bg-primary/5 group transition-all"
                         >
                            <div className="flex items-center gap-6">
                               {result.type === 'note' && <FileText className="h-4 w-4 text-primary/40" />}
                               {result.type === 'youtube' && <Youtube className="h-4 w-4 text-indigo-400/40" />}
                               {result.type === 'job' && <Briefcase className="h-4 w-4 text-emerald-400/40" />}
                               <div className="text-left space-y-1">
                                  <span className="text-lg font-heading italic group-hover:text-primary transition-colors">{result.title}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-20 block">{result.type}</span>
                               </div>
                            </div>
                            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-40 -translate-x-4 group-hover:translate-x-0 transition-all text-primary" />
                         </button>
                       ))}

                       {!loading && query !== "" && results.length === 0 && (
                         <div className="p-20 text-center space-y-4">
                            <History className="h-10 w-10 text-muted/10 mx-auto" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted/20 italic">No nodes found in the network matching this fragment.</p>
                         </div>
                       )}
                    </div>
                  )}
                </div>

                <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between bg-black/20">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold opacity-40">↑↓</kbd>
                         <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Navigate</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold opacity-40">↵</kbd>
                         <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Select</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 text-primary/40">
                      <Command className="h-3 w-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Sanctuary Alpha Search</span>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
