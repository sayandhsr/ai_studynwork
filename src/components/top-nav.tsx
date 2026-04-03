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
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-yellow-500/10 bg-[#0B0F14]/80 backdrop-blur-xl px-4 md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Sanctuary</span>
          <div className="h-3 w-[1px] bg-yellow-500/20 mx-1" />
          <span className="text-[10px] font-medium tracking-wider uppercase text-gray-500">Workspace</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-md hover:bg-yellow-500/10 border border-yellow-500/5 h-9 w-9">
              <Avatar className="h-7 w-7 rounded-md">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-md border-yellow-500/20 bg-[#0a0a0a] backdrop-blur-xl shadow-xl min-w-[200px] p-1.5">
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-white">{user?.name || "User"}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-yellow-500/10" />
            <DropdownMenuItem className="h-9 px-2 rounded-sm text-sm text-gray-400 hover:text-white hover:bg-yellow-500/10 cursor-pointer transition-colors">
              <UserIcon className="mr-2.5 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-9 px-2 rounded-sm text-sm text-gray-400 hover:text-white hover:bg-yellow-500/10 cursor-pointer transition-colors">
              <Settings className="mr-2.5 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-yellow-500/10" />
            <DropdownMenuItem onClick={handleSignOut} className="h-9 px-2 rounded-sm text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors">
              <LogOut className="mr-2.5 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
