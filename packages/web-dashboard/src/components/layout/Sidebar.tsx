'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Ticket,
  Users,
  Building2,
  Settings,
  LayoutDashboard,
  UserCircle,
  Inbox,
  BarChart3,
} from 'lucide-react';
import type { UserRole } from '@chatdesk/shared';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'org_admin', 'agent', 'customer'],
  },
  {
    name: 'Chat',
    href: '/dashboard/chat',
    icon: MessageSquare,
    roles: ['org_admin', 'agent'],
  },
  {
    name: 'Conversations',
    href: '/dashboard/conversations',
    icon: Ticket,
    roles: ['super_admin', 'org_admin', 'agent'],
  },
  {
    name: 'My Chats',
    href: '/dashboard/chats',
    icon: Inbox,
    roles: ['customer'],
  },
  {
    name: 'Tickets',
    href: '/dashboard/tickets',
    icon: Ticket,
    roles: ['super_admin', 'org_admin', 'agent'],
  },
  {
    name: 'Agents',
    href: '/dashboard/agents',
    icon: Users,
    roles: ['super_admin', 'org_admin'],
  },
  {
    name: 'Departments',
    href: '/dashboard/departments',
    icon: Building2,
    roles: ['super_admin', 'org_admin'],
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['super_admin', 'org_admin'],
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: UserCircle,
    roles: ['super_admin', 'org_admin', 'agent', 'customer'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['super_admin', 'org_admin'],
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) =>
    hasRole(item.roles)
  );

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">ChatDesk</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User Info */}
          <li className="mt-auto">
            <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900 border-t border-gray-200">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}

