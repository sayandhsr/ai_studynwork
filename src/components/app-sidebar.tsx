"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FileText, 
  Youtube, 
  Search, 
  Briefcase, 
  Settings,
  Plus,
  Cloud,
  ChevronRight
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Notes",
    url: "/dashboard/notes",
    icon: FileText,
  },
  {
    title: "YouTube Summarizer",
    url: "/dashboard/youtube",
    icon: Youtube,
  },
  {
    title: "Deep Research",
    url: "/dashboard/research",
    icon: Search,
  },
  {
    title: "Job Search",
    url: "/dashboard/jobs",
    icon: Briefcase,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background text-foreground selection:bg-primary/20 transition-all duration-300">
      {/* Header */}
      <SidebarHeader className="h-24 flex items-center px-6 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-4 transition-all hover:opacity-80 group/logo">
          <div className="flex h-12 w-12 items-center justify-center bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover/logo:scale-105">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold tracking-tight text-foreground">Sanctuary</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none opacity-50">v10.0 Stable</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Primary Action */}
      <div className="px-6 py-10 group-data-[collapsible=icon]:hidden">
        <Button asChild className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/10 rounded-[20px] font-bold uppercase tracking-widest text-[10px] transition-all premium-hover active:scale-[0.96]">
          <Link href="/dashboard/notes/new" className="flex items-center justify-center gap-3">
            <Plus className="h-4 w-4" />
            <span>Create Note</span>
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-6 opacity-40">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => setOpenMobile(false)}
                      className="h-14 rounded-2xl text-sm font-semibold transition-all hover:bg-secondary/80 data-[active=true]:bg-primary/10 data-[active=true]:text-primary group/item active:scale-[0.98] premium-hover hover:translate-x-1"
                    >
                      <Link href={item.url} className="flex items-center gap-4 px-4">
                        <item.icon className={`h-5 w-5 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-muted-foreground group-hover/item:text-foreground group-hover/item:scale-110'}`} />
                        <span className="tracking-tight">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Settings */}
      <SidebarFooter className="p-6 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-14 rounded-2xl hover:bg-secondary/50 group/pref active:scale-[0.98] transition-all">
              <Link href="/dashboard/preferences" className="flex items-center w-full px-4">
                <Settings className="h-5 w-5 mr-4 text-muted-foreground group-hover/pref:text-primary transition-colors" />
                <span className="text-sm font-semibold tracking-tight">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
