"use client"

import * as React from "react"
import { useFont } from "./font-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Type } from "lucide-react"
import { cn } from "@/lib/utils"

const fonts = [
  { name: 'Modern Sans', id: 'font-inter' },
  { name: 'Clean Sans', id: 'font-roboto' },
  { name: 'Elegant Serif', id: 'font-lora' },
  { name: 'Classic Serif', id: 'font-baskerville' },
  { name: 'Modern Mono', id: 'font-jetbrains' }
] as const

export function FontPicker() {
  const { font: currentFont, setFont } = useFont()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none border border-transparent hover:border-border/30 hover:bg-primary/5 transition-all group">
          <Type className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          <span className="sr-only">Toggle font</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none border-border/30 bg-card shadow-2xl min-w-[180px] p-2 font-serif">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
          Typography
        </div>
        {fonts.map((f) => (
          <DropdownMenuItem
            key={f.id}
            onClick={() => setFont(f.id)}
            className={cn(
              "h-10 px-4 rounded-none italic font-light cursor-pointer transition-colors",
              currentFont === f.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-primary/5"
            )}
          >
            <span className={f.id}>{f.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
