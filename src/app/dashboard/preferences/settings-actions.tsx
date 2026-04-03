"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, LogOut, Loader2, AlertTriangle } from "lucide-react"
import { clearAllNotes } from "@/lib/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function SettingsActions() {
  const [isClearing, setIsClearing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleClearNotes = async () => {
    setIsClearing(true)
    const result = await clearAllNotes()
    if (result.success) {
      toast.success("All technical fragments have been purged.")
      router.refresh()
    } else {
      toast.error("Purge protocol failed: " + result.error)
    }
    setIsClearing(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    toast.success("Identity disconnected. Safe travels.")
    router.push("/")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-red-500/10 bg-red-500/[0.02] space-y-4">
        <div className="flex items-center gap-2 text-red-500">
           <AlertTriangle className="h-4 w-4" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Danger Zone</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold">Purge Knowledge Repository</p>
            <p className="text-[11px] text-muted-foreground font-medium">This action will permanently delete all your inscribed fragments. This cannot be undone.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/10">
                {isClearing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                Purge All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">Absolute Purge Confirmation</AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium">
                  Are you entirely certain? This protocol will eliminate all inscribed knowledge fragments from the Sanctuary database. This action is irreversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl h-11 text-[10px] font-bold uppercase tracking-widest border-border">Cancel Protocol</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearNotes} className="rounded-xl h-11 text-[10px] font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700">Confirm Purge</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold">System Departure</p>
          <p className="text-[11px] text-muted-foreground font-medium">Disconnect your current session and secure your terminal.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest border-border hover:bg-accent/50"
        >
          {isLoggingOut ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <LogOut className="h-3 w-3 mr-2" />}
          Depart Sanctuary
        </Button>
      </div>
    </div>
  )
}
