import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { SidebarProvider } from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageTransition } from "@/components/page-transition"
import { Shield } from "lucide-react"

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

  const profile = {
    name: user.user_metadata?.full_name || null,
    email: user.email || null,
    avatar_url: user.user_metadata?.avatar_url || null,
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative selection:bg-primary/10 overflow-hidden">
        {/* Subtle Background Pattern for SaaS depth */}
        <div className="absolute inset-0 bg-gradient-premium opacity-[0.03] pointer-events-none" />
        
        <AppSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <TopNav user={profile} />
          
          <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-10 relative">
            <div className="mx-auto max-w-7xl">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
            
            {/* Branding Indicator */}
            <div className="absolute bottom-8 right-8 flex items-center gap-3 opacity-[0.05] pointer-events-none select-none grayscale">
               <Shield className="w-12 h-12" />
               <div className="flex flex-col leading-none">
                  <span className="text-xl font-bold tracking-tighter">SANCTUARY</span>
                  <span className="text-[8px] font-bold tracking-[0.3em] uppercase">Security Tier Alpha</span>
               </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
