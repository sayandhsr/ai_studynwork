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
  Bot,
  Activity,
  Search
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
    title: "AI Assistant",
    url: "/dashboard/assistant",
    icon: Bot,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r border-border/10">
      <SidebarHeader className="flex h-20 items-center border-b border-border/10 px-6 bg-[#0B0F14]">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)] group overflow-hidden">
             <BirdLogo className="text-primary w-7 h-7 opacity-90 group-hover:scale-110 transition-all duration-500" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted">Spurce</span>
            <span className="font-heading italic text-xl tracking-tight text-primary">Sanctuary</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="font-serif bg-[#0B0F14]/95 backdrop-blur-md">
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-[0.3em] text-muted/40 h-10 flex items-end pb-2">Technical Vault</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 py-2 space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
                  className="h-14 border border-primary/10 bg-primary/5 hover:bg-primary/10 rounded-none font-bold uppercase tracking-[0.2em] transition-all group flex items-center justify-between px-6"
                >
                  <div className="flex items-center gap-4">
                    <Search className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px]">Global Search</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">⌘K</kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <div className="h-px bg-border/5 my-4 mx-3" />

              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                    tooltip={item.title}
                    onClick={() => setOpenMobile(false)}
                    className="h-12 hover:bg-primary/5 rounded-none font-light italic tracking-wide transition-all duration-300 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary group"
                  >
                    <Link href={item.url} className="flex items-center gap-4 px-3 group-hover:translate-x-1 transition-transform duration-300 relative">
                      <item.icon className="h-4 w-4 text-muted group-data-[active=true]:text-primary group-hover:text-primary transition-colors" />
                      <span className="text-sm tracking-wide">{item.title}</span>
                      
                      {/* Subtle hover spark */}
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/10 p-6 bg-[#0B0F14] space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4 italic font-light text-[10px] text-muted/30 tracking-[0.3em] uppercase">
             <span>v8.0 Production Hub</span>
          </div>
          <div className="text-[8px] font-mono text-primary/40 uppercase tracking-tighter">
            Architected for SAYANDH Sr
          </div>
        </div>
      </SidebarFooter>
      <style jsx global>{`
        .font-heading { font-family: var(--font-heading), serif; }
      `}</style>
    </Sidebar>
  )
}
