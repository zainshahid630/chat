import { createServerClient as createClient } from '@chatdesk/shared';
import { cookies } from 'next/headers';

// Create a Supabase client for server-side usage (Server Components, Route Handlers)
export async function createServerClient() {
  const cookieStore = await cookies();

  return createClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  });
}

// Create an admin client that bypasses RLS (use with caution!)
export async function createAdminClient() {
  return createClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  });
}

