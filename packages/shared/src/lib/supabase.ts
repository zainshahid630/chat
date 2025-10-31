import { createClient } from '@supabase/supabase-js';

// Types for Supabase client configuration
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

// Create a Supabase client for browser/client-side usage
export function createBrowserClient(config: Omit<SupabaseConfig, 'serviceRoleKey'>) {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Create a Supabase client for server-side usage with service role
export function createServerClient(config: Required<SupabaseConfig>) {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Create a Supabase client for admin operations (bypasses RLS)
export function createAdminClient(config: Required<SupabaseConfig>) {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
}

// Helper to get Supabase config from environment variables
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  };
}

