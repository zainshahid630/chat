import { createClient } from '@supabase/supabase-js';

// Singleton client instance
let client: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  // Return existing client if available
  if (client) {
    return client;
  }

  // Create new client with localStorage persistence
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  return client;
}

