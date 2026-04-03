"use client"

import { useState, useEffect } from "react"
import { Bell, Clock, Zap, CheckCircle2, Info, AlertCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

export function NotificationsDropdown() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error) {
        setActivities(data || [])
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    
    // Subscribe to new activities
    const channel = supabase
      .channel('activity_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        fetchActivities()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchActivities()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-primary transition-colors">
          <Bell className="h-4 w-4" />
          {activities.length > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary border-2 border-background animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-1.5 rounded-xl border-border bg-popover shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <DropdownMenuLabel className="px-3 py-2.5 flex items-center justify-between">
          <span className="text-sm font-bold">Operational Feed</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">Live Update</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        
        <div className="max-h-[350px] overflow-auto py-1">
          {loading ? (
             <div className="p-8 text-center space-y-2">
                <Clock className="h-5 w-5 mx-auto text-muted-foreground/20 animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Syncing Feed...</p>
             </div>
          ) : activities.length > 0 ? (
            <AnimatePresence>
              {activities.map((activity, i) => (
                <DropdownMenuItem key={activity.id} className="p-3 rounded-lg flex items-start gap-3 cursor-default hover:bg-accent/50 focus:bg-accent/50 group">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    activity.action_type.includes('created') ? 'bg-emerald-500/10 text-emerald-500' :
                    activity.action_type.includes('deleted') ? 'bg-red-500/10 text-red-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    <ActivityIcon type={activity.action_type} />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground leading-tight">{activity.action_title}</p>
                    <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </AnimatePresence>
          ) : (
            <div className="p-10 text-center space-y-3">
               <Zap className="h-6 w-6 mx-auto text-muted-foreground/10" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">The feed is silent.</p>
            </div>
          )}
        </div>
        
        {activities.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-border/50" />
            <div className="p-2">
               <Button variant="ghost" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg">
                  Archive All Records
               </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ActivityIcon({ type }: { type: string }) {
  if (type.includes('created')) return <CheckCircle2 className="h-3 w-3" />
  if (type.includes('error') || type.includes('failed')) return <AlertCircle className="h-3 w-3" />
  return <Info className="h-3 w-3" />
}
