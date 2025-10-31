'use client';

import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@chatdesk/shared';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 * Use this for UI elements that should only be visible to certain roles
 */
export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

