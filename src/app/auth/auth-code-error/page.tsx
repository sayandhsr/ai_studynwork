import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-secondary/30 px-4">
      <div className="mx-auto flex max-w-[400px] flex-col items-center justify-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-10 w-10 text-destructive"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Authentication Error</h1>
          <p className="text-muted-foreground">
            There was a problem signing you in. The Google authentication code was invalid or expired.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            (If you are the developer: Ensure your Supabase Dashboard has Google Auth enabled, and the Redirect URI perfectly matches http://127.0.0.1:3000/auth/callback)
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/">Return to Login</Link>
        </Button>
      </div>
    </div>
  )
}
