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
import { LogOut, User as UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"

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
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-2 border-b border-border/20 bg-background/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex flex-col md:flex-row md:items-center gap-2 font-serif">
          <span className="hidden md:inline-block text-[10px] font-bold tracking-[0.4em] uppercase opacity-40">Digital Workspace</span>
          <div className="hidden md:block h-1 w-1 rounded-full bg-primary/40 mx-2" />
          <span className="font-heading italic text-lg tracking-tight text-foreground/80">Study Sanctuary</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-primary/5 border border-transparent hover:border-border/30 h-10 w-10">
              <Avatar className="h-8 w-8 rounded-none border border-border/40">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-heading italic">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none border-border/30 bg-card shadow-2xl min-w-[200px] p-2 font-serif">
            <DropdownMenuLabel className="p-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-heading italic tracking-tight">{user?.name || "User"}</p>
                <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/20" />
            <DropdownMenuItem className="h-10 px-4 rounded-none italic font-light hover:bg-primary/5 cursor-pointer">
              <UserIcon className="mr-3 h-4 w-4 opacity-50 text-primary" />
              <span>Personal Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/20" />
            <DropdownMenuItem onClick={handleSignOut} className="h-10 px-4 rounded-none italic font-light text-destructive hover:bg-destructive/5 cursor-pointer">
              <LogOut className="mr-3 h-4 w-4" />
              <span>Depart Sanctuary</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <style jsx global>{`
        .font-heading { font-family: var(--font-heading), serif; }
      `}</style>
    </header>
  )
}
