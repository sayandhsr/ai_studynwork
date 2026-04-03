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
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-[#0a0a0a] text-white selection:bg-primary/20">
      {/* Header */}
      <SidebarHeader className="h-20 flex items-center px-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-base font-black tracking-tight uppercase italic">Sanctuary</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none">v10.0 Stable</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Primary Action */}
      <div className="px-6 py-8 group-data-[collapsible=icon]:hidden">
        <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/10 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all active:scale-[0.98]">
          <Link href="/dashboard/notes/new" className="flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Note</span>
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 mb-4">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => setOpenMobile(false)}
                      className="h-12 rounded-xl text-sm font-bold transition-all hover:bg-white/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary group/item active:scale-[0.98]"
                    >
                      <Link href={item.url} className="flex items-center gap-4 px-4">
                        <item.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover/item:text-foreground'}`} />
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
      <SidebarFooter className="p-6 border-t border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-14 rounded-xl hover:bg-white/5 group/pref active:scale-[0.98] transition-all">
              <Link href="/dashboard/preferences" className="flex items-center w-full px-4">
                <Settings className="h-4 w-4 mr-4 text-muted-foreground group-hover/pref:text-primary transition-colors" />
                <span className="text-sm font-bold tracking-tight">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
