"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { 
  User, Mail, Shield, LogOut, 
  Trash2, Settings, Moon, Sun, Sparkles
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"

export default function PreferencesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleClearAllNotes = async () => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("user_id", user.id)
      
      if (error) throw error
      toast.success("Database cleared successfully.")
      router.refresh()
    } catch (err: any) {
      toast.error("Failed to clear database.")
    }
  }

  if (loading) return null

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Settings</h1>
        <p className="text-sm text-muted-foreground font-medium">Manage your personal database and theme preferences.</p>
      </div>

      <div className="grid gap-12">
        {/* Profile Card */}
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8">
           <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                 <User className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Authenticated Identity</p>
                 <p className="text-lg font-bold tracking-tight text-white">{user?.email}</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Communication</span>
                 </div>
                 <span className="font-bold text-white">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-3 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Security Level</span>
                 </div>
                 <span className="font-bold text-primary">High Fidelity</span>
              </div>
           </div>
        </div>

        {/* Theme Settings */}
        <div className="space-y-6">
           <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground px-2">Visual Environment</h3>
           <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-16 rounded-2xl border-primary bg-primary/10 text-primary font-bold uppercase tracking-widest text-[10px]">
                 <Sparkles className="h-4 w-4 mr-3" /> Luxury Dark
              </Button>
              <Button disabled variant="outline" className="h-16 rounded-2xl border-white/5 bg-white/[0.02] text-muted-foreground opacity-50 font-bold uppercase tracking-widest text-[10px]">
                 <Sun className="h-4 w-4 mr-3" /> Light Mode (LOCKED)
              </Button>
           </div>
        </div>

        {/* Action Zone */}
        <div className="space-y-6 pt-8">
           <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-destructive px-2">Data Operations</h3>
           <div className="flex flex-col sm:flex-row gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="h-12 flex-1 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                     <Trash2 className="h-4 w-4 mr-2" /> Clear All Notes
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-white/10 bg-[#0a0a0a]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold tracking-tight text-white">Full Purge Requested?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
                      This will permanently delete all of your notes. This action cannot be undone. Are you absolutely certain?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white/5 border-white/10 border text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllNotes} className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-[10px] uppercase tracking-widest">
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button onClick={handleSignOut} className="h-12 flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-destructive/10">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
           </div>
        </div>
      </div>
    </div>
  )
}
