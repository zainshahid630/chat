'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  Bell,
  LogOut,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { formatUserName, getRoleDisplayName } from '@/lib/auth/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open sidebar</span>
      </Button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      {/* Search / Breadcrumb area */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          {/* You can add breadcrumbs or search here */}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="sr-only">View notifications</span>
            {/* Notification badge */}
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex lg:flex-col lg:items-start lg:text-left">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatUserName(user!)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getRoleDisplayName(user!.role)}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {formatUserName(user!)}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="w-fit mt-1">
                    {getRoleDisplayName(user!.role)}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

