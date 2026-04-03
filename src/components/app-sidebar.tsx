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
  Youtube,
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
    title: "Notes",
    url: "/dashboard/notes",
    icon: FileText,
  },
  {
    title: "YouTube",
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
    <Sidebar variant="inset" collapsible="icon" className="border-r border-yellow-500/10">
      <SidebarHeader className="flex h-14 items-center border-b border-yellow-500/10 px-4 bg-[#0B0F14]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-yellow-500/10 border border-yellow-500/20 rounded-md">
             <BirdLogo className="text-yellow-500 w-5 h-5" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium tracking-wide uppercase text-gray-400">Spurce</span>
            <span className="text-sm font-semibold text-yellow-400">Sanctuary</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#0B0F14]/95">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-medium uppercase tracking-wider text-gray-500 h-8 flex items-end pb-1">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 py-1 space-y-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                    tooltip={item.title}
                    onClick={() => setOpenMobile(false)}
                    className="h-9 rounded-md text-sm font-normal transition-colors data-[active=true]:bg-yellow-500/10 data-[active=true]:text-yellow-400 hover:bg-yellow-500/5 hover:text-white"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3">
                      <item.icon className="h-4 w-4 text-gray-500 data-[active=true]:text-yellow-400" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-yellow-500/10 p-4 bg-[#0B0F14]">
        <div className="text-[10px] text-gray-600 tracking-wide">
          v8.0 · Spurce Sanctuary
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
