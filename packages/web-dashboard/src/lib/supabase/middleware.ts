import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser();

  // Log for debugging
  console.log('[Middleware]', {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    error: error?.message,
    cookies: request.cookies.getAll().map(c => c.name),
  });

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth/callback', '/forgot-password', '/debug-auth', '/fix-profile', '/api'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // NOTE: Middleware redirects are disabled because we're using localStorage for sessions
  // The AuthContext and client-side redirects handle authentication flow
  // TODO: Re-enable when we properly implement cookie-based sessions

  // // Redirect to login if accessing protected route without authentication
  // if (!user && !isPublicRoute && request.nextUrl.pathname !== '/') {
  //   console.log('[Middleware] Redirecting to login - no user found');
  //   const redirectUrl = new URL('/login', request.url);
  //   redirectUrl.searchParams.set('next', request.nextUrl.pathname);
  //   return NextResponse.redirect(redirectUrl);
  // }

  // // Redirect to dashboard if accessing auth pages while authenticated
  // if (user && isPublicRoute && request.nextUrl.pathname !== '/auth/callback' && !request.nextUrl.pathname.startsWith('/api')) {
  //   console.log('[Middleware] Redirecting to dashboard - user is authenticated');
  //   return NextResponse.redirect(new URL('/dashboard', request.url));
  // }

  return response;
}

