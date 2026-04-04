"use client"

import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "./theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogOut, User as UserIcon, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"

interface TopNavProps {
  user: {
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  } | null
}

export function TopNav({ user }: TopNavProps) {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "U"

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-4 ios-blur border-b border-border/80 px-6 md:px-12 backdrop-blur-2xl bg-background/40"
    >
      <div className="flex items-center gap-8">
        <SidebarTrigger className="md:hidden h-12 w-12 rounded-2xl hover:bg-secondary/80 transition-all premium-hover" />
        <div className="flex items-center gap-4">
          <span className="text-lg font-black tracking-tighter text-foreground">SANC.</span>
          <div className="h-5 w-[1px] bg-border mx-1 opacity-30" />
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted-foreground opacity-40">Intelligence Core</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 md:gap-8">
        <ThemeToggle />
        
        <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block opacity-30" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-12 flex items-center gap-4 px-4 hover:bg-secondary/80 rounded-[20px] transition-all premium-hover">
              <Avatar className="h-9 w-9 border border-border/50 ios-shadow ring-2 ring-primary/5">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-bold tracking-tight text-foreground">{user?.name?.split(" ")[0] || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 mt-4 p-3 rounded-[28px] border-border/60 glass ios-shadow animate-in fade-in zoom-in-95 duration-400 ease-premium">
            <DropdownMenuLabel className="px-5 py-5">
              <div className="flex flex-col space-y-1.5">
                <p className="text-base font-bold text-foreground tracking-tight">{user?.name || "User"}</p>
                <p className="text-[11px] text-muted-foreground font-semibold truncate opacity-50 uppercase tracking-widest">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/40 mx-2" />
            <div className="p-2 space-y-1">
              {[
                { label: "Identity Profile", icon: UserIcon },
                { label: "System Preferences", icon: Settings },
              ].map((item) => (
                <DropdownMenuItem key={item.label} className="h-12 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 cursor-pointer transition-all premium-hover">
                  <item.icon className="mr-4 h-4 w-4 opacity-70" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="bg-border/40 mx-2" />
            <div className="p-2">
              <DropdownMenuItem onClick={handleSignOut} className="h-12 px-4 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 cursor-pointer transition-all premium-hover">
                <LogOut className="mr-4 h-4 w-4" />
                <span>Depart Sanctuary</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
