import { createBrowserClient } from '@/lib/supabase/client';
import type { UserRole } from '@chatdesk/shared';

/**
 * Get the current authenticated user's session
 */
export async function getSession() {
  const supabase = createBrowserClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = createBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}

/**
 * Get the current user's profile from the users table
 */
export async function getUserProfile(userId?: string) {
  const supabase = createBrowserClient();
  
  // If no userId provided, get current user
  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getCurrentUser();
    if (!user) return null;
    targetUserId = user.id;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', targetUserId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(profile.role);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Redirect to login if not authenticated
 */
export async function requireAuth(redirectTo: string = '/login') {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    window.location.href = redirectTo;
    return false;
  }
  
  return true;
}

/**
 * Redirect if user doesn't have required role
 */
export async function requireRole(
  roles: UserRole | UserRole[],
  redirectTo: string = '/'
) {
  const hasRequiredRole = await hasRole(roles);
  
  if (!hasRequiredRole) {
    window.location.href = redirectTo;
    return false;
  }
  
  return true;
}

/**
 * Sign out and redirect
 */
export async function signOutAndRedirect(redirectTo: string = '/login') {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
  window.location.href = redirectTo;
}

/**
 * Get user's organization
 */
export async function getUserOrganization() {
  const profile = await getUserProfile();
  if (!profile || !profile.organization_id) return null;
  
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single();
  
  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
  
  return data;
}

/**
 * Check if user belongs to an organization
 */
export async function hasOrganization(): Promise<boolean> {
  const profile = await getUserProfile();
  return !!(profile && profile.organization_id);
}

/**
 * Format user display name
 */
export function formatUserName(user: { full_name?: string; email: string }): string {
  return user.full_name || user.email.split('@')[0];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    org_admin: 'Organization Admin',
    agent: 'Agent',
    customer: 'Customer',
  };
  
  return roleNames[role] || role;
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    super_admin: 'purple',
    org_admin: 'blue',
    agent: 'green',
    customer: 'gray',
  };
  
  return roleColors[role] || 'gray';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

