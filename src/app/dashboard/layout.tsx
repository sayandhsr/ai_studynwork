import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { SidebarProvider } from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AIAssistant } from "@/components/dashboard/ai-assistant"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Get user profile from metadata or db ideally
  const profile = {
    name: user.user_metadata?.full_name || null,
    email: user.email || null,
    avatar_url: user.user_metadata?.avatar_url || null,
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative selection:bg-primary/20">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav user={profile} />
          <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 relative">
            <div className="mx-auto max-w-7xl relative z-10">
              {children}
            </div>
            {/* Subtle luxury watermark/background element */}
            <div className="absolute bottom-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none">
              <span className="font-heading italic text-[20vw] leading-none">Nest</span>
            </div>
          </main>
        </div>
        <AIAssistant />
      </div>
    </SidebarProvider>
  )
}
