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
      <div className="flex min-h-screen w-full bg-secondary/20 relative">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav user={profile} />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
        <AIAssistant />
      </div>
    </SidebarProvider>
  )
}
