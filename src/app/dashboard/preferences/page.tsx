"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { 
  User, Mail, Shield, LogOut, 
  Trash2, Globe, Sparkles, Moon
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
      toast.success("All notes purged from archive.")
      router.refresh()
    } catch (err: any) {
      toast.error("Failed to purge archive.")
    }
  }

  if (loading) return null

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Settings</h1>
        <p className="text-sm text-muted-foreground font-medium">Manage your identity, data, and system preferences.</p>
      </div>

      <div className="grid gap-12">
        {/* Profile Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
             <User className="h-4 w-4 text-primary" />
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Identity Profile</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-6 rounded-3xl bg-card/20 border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Email Protocol</p>
                      <p className="text-sm font-bold tracking-tight">{user?.email}</p>
                   </div>
                </div>
             </div>
             <div className="p-6 rounded-3xl bg-card/20 border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Security Status</p>
                      <p className="text-sm font-bold tracking-tight">Verified Access</p>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* System Customization */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
             <Globe className="h-4 w-4 text-primary" />
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">System Environment</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="p-1 border border-white/10 rounded-2xl bg-card/20 flex">
                <button className="flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] bg-primary text-primary-foreground flex items-center justify-center gap-2">
                   <Sparkles className="h-4 w-4" /> Luxury (Default)
                </button>
                <button className="flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-accent/50 flex items-center justify-center gap-2">
                   <Moon className="h-4 w-4" /> Dark
                </button>
             </div>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic opacity-40 px-2">Luxury Theme is automatically enforced for Alpha v10.0.</p>
        </section>

        {/* Danger Zone */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-destructive/20 pb-4">
             <Trash2 className="h-4 w-4 text-destructive" />
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-destructive">Danger Zone</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-12 px-8 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                   Purge Intellectual Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-white/10 bg-popover shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-black italic tracking-tight">Confirm Archive Purge?</AlertDialogTitle>
                  <AlertDialogDescription className="font-medium text-sm">
                    This action is irreversible. All of your notes and captured synthesis will be permanently removed from the strategic database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold text-[10px] uppercase tracking-widest">Abort</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllNotes} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-[10px] uppercase tracking-widest">
                    Confirm Purge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSignOut} className="h-12 px-8 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/10 active:scale-95 transition-all">
              <LogOut className="h-4 w-4 mr-2" /> Depart Sanctuary
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
