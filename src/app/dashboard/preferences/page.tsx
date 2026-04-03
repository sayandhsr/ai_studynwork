import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PreferencesActions } from "./preferences-actions"

export default async function PreferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const profile = {
    name: user.user_metadata?.full_name || null,
    email: user.email || null,
    avatar_url: user.user_metadata?.avatar_url || null,
  }

  const initials = profile.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : profile.email?.substring(0, 2).toUpperCase() || "U"

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground font-medium">Manage your workspace identity and technical protocols.</p>
      </div>

      <div className="grid gap-6">
        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Identity Profile</CardTitle>
            <CardDescription className="text-xs">Synced via external provider</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-border shadow-lg">
              <AvatarImage src={profile.avatar_url || ""} alt={profile.name || "User"} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
               <p className="font-bold text-xl leading-none">{profile.name}</p>
               <p className="text-xs text-muted-foreground font-medium tracking-tight">{profile.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Appearance Mode</CardTitle>
            <CardDescription className="text-xs">Standardized workspace visuals</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-bold text-sm">Visual Identity</p>
              <p className="text-[11px] text-muted-foreground font-medium">Toggle between Luxury (Default) and Dark interface.</p>
            </div>
            <div className="">
               <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <PreferencesActions />
      </div>
    </div>
  )
}
