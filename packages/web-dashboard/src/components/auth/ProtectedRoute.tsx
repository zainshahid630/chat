'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@chatdesk/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole | UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = '/login',
  fallback = <div>Loading...</div>,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, hasRole } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Check role if required
    if (requiredRoles && !hasRole(requiredRoles)) {
      router.push('/unauthorized');
      return;
    }
  }, [user, loading, requiredRoles, redirectTo, router, hasRole]);

  // Show loading state
  if (loading) {
    return <>{fallback}</>;
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Check role
  if (requiredRoles && !hasRole(requiredRoles)) {
    return null;
  }

  return <>{children}</>;
}

