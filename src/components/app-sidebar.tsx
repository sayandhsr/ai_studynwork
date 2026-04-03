"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  Youtube,
  Cloud,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Notes Saver",
    url: "/dashboard/notes",
    icon: FileText,
  },
  {
    title: "YouTube Summarizer",
    url: "/dashboard/youtube",
    icon: Youtube,
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
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar selection:bg-primary/10">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center bg-primary rounded-lg text-primary-foreground">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight">Sanctuary</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">v9.0 Alpha</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => setOpenMobile(false)}
                      className="relative h-10 rounded-md text-sm font-medium transition-all hover:bg-accent/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary group/item"
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <item.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover/item:text-foreground'}`} />
                        <span className="group-hover/item:translate-x-0.5 transition-transform">{item.title}</span>
                        {isActive && (
                          <motion.div 
                            layoutId="active-nav"
                            className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-10 rounded-md text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4 mr-3" />
              <span className="text-sm font-medium">Preferences</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
