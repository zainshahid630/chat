'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Globe, Shield, Webhook, Building2, ChevronRight, Code } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  const settingsCategories = [
    {
      title: 'Organization',
      description: 'Manage organization profile, branding, and members',
      icon: Building2,
      href: '/dashboard/settings/organization',
      roles: ['super_admin', 'org_admin'],
    },
    {
      title: 'Chat Widget',
      description: 'Customize and embed the chat widget on your website',
      icon: Code,
      href: '/dashboard/settings/widget',
      roles: ['super_admin', 'org_admin'],
    },
    {
      title: 'General',
      description: 'Basic organization settings and preferences',
      icon: Settings,
      href: '/dashboard/settings/general',
      roles: ['super_admin', 'org_admin'],
    },
    {
      title: 'Notifications',
      description: 'Configure email and push notifications',
      icon: Bell,
      href: '/dashboard/settings/notifications',
      roles: ['super_admin', 'org_admin', 'agent'],
    },
    {
      title: 'Integrations',
      description: 'Connect third-party services and tools',
      icon: Globe,
      href: '/dashboard/settings/integrations',
      roles: ['super_admin', 'org_admin'],
    },
    {
      title: 'Security',
      description: 'Manage security settings and permissions',
      icon: Shield,
      href: '/dashboard/settings/security',
      roles: ['super_admin', 'org_admin'],
    },
    {
      title: 'Webhooks',
      description: 'Configure webhook endpoints and events',
      icon: Webhook,
      href: '/dashboard/settings/webhooks',
      roles: ['super_admin', 'org_admin'],
    },
  ];

  // Filter categories based on user role
  const filteredCategories = settingsCategories.filter(category =>
    category.roles.includes(user?.role || 'customer')
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization settings and preferences
          </p>
        </div>

        {/* Settings Categories Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Link key={category.title} href={category.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <category.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <CardDescription className="mt-2">
                    {category.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

