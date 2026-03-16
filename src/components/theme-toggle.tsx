"use client"

import * as React from "react"
import { Moon, Sun, Crown } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-xl border-[#D6CFC7] bg-transparent hover:bg-accent/10">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-[#E8E2D9] bg-background">
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
          <Sun className="h-4 h-4 text-stone-500" /> Classic Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
          <Moon className="h-4 h-4 text-zinc-500" /> Modern Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("luxury")} className="gap-2 font-bold text-[#C5A059]">
          <Crown className="h-4 h-4" /> Luxury (Default)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
