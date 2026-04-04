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
      <div className="flex min-h-screen w-full bg-background relative selection:bg-primary/10 overflow-hidden font-sans">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-premium opacity-[0.4] pointer-events-none" />
        
        <AppSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <TopNav user={profile} />
          
          <main className="flex-1 overflow-auto p-6 md:p-10 lg:p-14 relative scroll-smooth">
            <div className="mx-auto max-w-7xl">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
            
            {/* Elegant Branding Indicator */}
            <div className="fixed bottom-10 right-10 flex items-center gap-4 opacity-[0.1] hover:opacity-[0.3] transition-opacity pointer-events-none select-none grayscale">
               <div className="h-10 w-10 rounded-full border-2 border-foreground flex items-center justify-center">
                 <Shield className="w-5 h-5 fill-current" />
               </div>
               <div className="flex flex-col leading-none">
                  <span className="text-xl font-black tracking-tighter">SANCTUARY</span>
                  <span className="text-[8px] font-bold tracking-[0.4em] uppercase">Intelligence Core</span>
               </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
