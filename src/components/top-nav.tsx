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
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/80 backdrop-blur-md px-4 md:px-8"
    >
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">Sanctuary</span>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">Workspace</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        
        <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 flex items-center gap-2 px-2 hover:bg-accent rounded-full transition-all">
              <Avatar className="h-7 w-7 border border-border shadow-sm">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-xs font-semibold pr-1">{user?.name?.split(" ")[0] || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 p-1.5 rounded-xl border-border bg-popover shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="px-3 py-2.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-foreground">{user?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground font-medium truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="h-10 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors">
              <UserIcon className="mr-2.5 h-4 w-4 opacity-50" />
              <span>Identity Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-10 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors">
              <Link href="/dashboard/preferences" className="flex items-center w-full">
                <Settings className="mr-2.5 h-4 w-4 opacity-50" />
                <span>System Preferences</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={handleSignOut} className="h-10 px-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 cursor-pointer transition-colors font-medium">
              <LogOut className="mr-2.5 h-4 w-4" />
              <span>Depart Sanctuary</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
