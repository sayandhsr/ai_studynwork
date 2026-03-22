"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Briefcase,
  FileText,
  Home,
  Settings,
  Youtube,
  FileEdit,
  Bot
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BirdLogo } from "./bird-logo"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
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
  {
    title: "Resume Builder",
    url: "/dashboard/resume",
    icon: FileEdit,
  },
  {
    title: "AI Assistant",
    url: "/dashboard/assistant",
    icon: Bot,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="flex h-20 items-center border-b border-border/20 px-6 bg-card">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center bg-primary/10 border border-primary/20 shadow-inner group overflow-hidden">
             <BirdLogo className="text-primary w-7 h-7 opacity-90 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-40 text-foreground">Study Nest</span>
            <span className="font-heading italic text-xl tracking-tight text-primary">Sanctuary</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="font-serif bg-background/50">
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 h-10 flex items-end pb-2">The Vault</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                    tooltip={item.title}
                    onClick={() => setOpenMobile(false)}
                    className="h-12 hover:bg-primary/5 rounded-none font-light italic tracking-wide transition-all data-[active=true]:bg-primary/10 data-[active=true]:text-primary group"
                  >
                    <Link href={item.url} className="flex items-center gap-4">
                      <item.icon className="h-4 w-4 opacity-40 group-data-[active=true]:opacity-100 group-data-[active=true]:text-primary transition-all" />
                      <span className="text-base">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/20 p-6 bg-card">
        <div className="flex items-center gap-4 italic font-light text-[10px] opacity-30 tracking-widest uppercase">
           <span>v4.1 Sanctuary Edition</span>
        </div>
      </SidebarFooter>
      <style jsx global>{`
        .font-heading { font-family: var(--font-heading), serif; }
      `}</style>
    </Sidebar>
  )
}
