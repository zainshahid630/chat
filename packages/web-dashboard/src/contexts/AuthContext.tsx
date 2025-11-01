'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User, UserRole } from '@chatdesk/shared';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOTP: (email: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Create client once
  const [supabase] = useState(() => {
    console.log('AuthProvider: Creating Supabase client');
    return createBrowserClient();
  });

  // Fetch user profile from users table
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as User;
  };

  // Initialize auth state
  useEffect(() => {
    console.log('AuthContext: useEffect triggered');
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth...');
        console.log('AuthContext: localStorage keys:', Object.keys(localStorage));

        // Get current session from localStorage with timeout
        console.log('AuthContext: Calling getSession...');

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('getSession timeout after 3s')), 3000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        console.log('AuthContext: getSession completed', result);

        if (!mounted) return;

        const { data: { session }, error } = result;

        if (error) {
          console.error('AuthContext: Session error:', error);
        }

        console.log('AuthContext: Session:', session ? 'exists' : 'null');

        if (session?.user) {
          console.log('AuthContext: User ID:', session.user.id);
          setSupabaseUser(session.user);
          console.log('AuthContext: Fetching user profile...');
          const profile = await fetchUserProfile(session.user.id);
          console.log('AuthContext: Profile:', profile);
          if (mounted) {
            setUser(profile);
          }
        } else {
          console.log('AuthContext: No session found');
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        // Even on error, try to set loading to false so UI doesn't hang
      } finally {
        console.log('AuthContext: Setting loading to false');
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setSupabaseUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch user profile immediately after sign in
    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
      setSupabaseUser(data.user);
    }
  };

  // Sign in with magic link (OTP)
  const signInWithOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  // Sign up new user
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'customer'
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setUser(null);
    setSupabaseUser(null);
  };

  // Check if user has specific role(s)
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signInWithOTP,
    signUp,
    signOut,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Hook to require authentication
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo;
    }
  }, [user, loading, redirectTo]);
  
  return { user, loading };
}

// Hook to require specific role(s)
export function useRequireRole(roles: UserRole | UserRole[], redirectTo: string = '/') {
  const { user, loading, hasRole } = useAuth();
  
  useEffect(() => {
    if (!loading && (!user || !hasRole(roles))) {
      window.location.href = redirectTo;
    }
  }, [user, loading, roles, redirectTo]);
  
  return { user, loading };
}

