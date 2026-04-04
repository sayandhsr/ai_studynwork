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
      className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-4 ios-blur border-b border-border/80 px-6 md:px-10"
    >
      <div className="flex items-center gap-6">
        <SidebarTrigger className="md:hidden h-10 w-10 rounded-xl hover:bg-secondary transition-colors" />
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-foreground">Sanctuary</span>
          <div className="h-4 w-[1px] bg-border mx-1 opacity-50" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground opacity-60">Intelligence Workspace</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
        <ThemeToggle />
        
        <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block opacity-50" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-11 flex items-center gap-3 px-3 hover:bg-secondary rounded-2xl transition-all premium-hover">
              <Avatar className="h-8 w-8 border border-border ios-shadow">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-bold text-foreground">{user?.name?.split(" ")[0] || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 mt-3 p-2 rounded-[24px] border-border ios-blur ios-shadow animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="px-4 py-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-foreground">{user?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground font-semibold truncate opacity-60">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60 mx-2" />
            <div className="p-1">
              <DropdownMenuItem className="h-11 px-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-all">
                <UserIcon className="mr-3 h-4 w-4 opacity-70" />
                <span>Identity Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="h-11 px-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-all">
                <Settings className="mr-3 h-4 w-4 opacity-70" />
                <span>Preferences</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-border/60 mx-2" />
            <div className="p-1">
              <DropdownMenuItem onClick={handleSignOut} className="h-11 px-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 cursor-pointer transition-all">
                <LogOut className="mr-3 h-4 w-4" />
                <span>Depart Sanctuary</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
