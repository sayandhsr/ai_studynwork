/* eslint-disable */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url
  }
  return "http://localhost:54321"
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (key && key !== 'your_supabase_anon_key') {
    return key
  }
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Standard user check - No timeout hacks that cause redirect loops
  const { data: { user } } = await supabase.auth.getUser();

  // Array of public routes
  const publicRoutes = ["/", "/auth/callback"];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

  // If no user and not public -> Redirect to Landing
  if (!user && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access landing -> Redirect to Dashboard
  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
