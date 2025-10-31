import { createBrowserClient as createClient } from '@chatdesk/shared';

// Create a singleton Supabase client for browser usage
export function createBrowserClient() {
  return createClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });
}

