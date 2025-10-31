'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Building2 } from 'lucide-react';
import { getRoleDisplayName } from '@/lib/auth/utils';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your account details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user.full_name || 'User'}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <Badge className="mt-1">{getRoleDisplayName(user.role)}</Badge>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4" />
                  Full Name
                </div>
                <p className="text-sm text-gray-900">{user.full_name || 'Not set'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Shield className="h-4 w-4" />
                  Role
                </div>
                <p className="text-sm text-gray-900">{getRoleDisplayName(user.role)}</p>
              </div>

              {user.organization_id && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building2 className="h-4 w-4" />
                    Organization
                  </div>
                  <p className="text-sm text-gray-900 font-mono">{user.organization_id}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button>Edit Profile</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Password</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Last changed: Never
                </p>
                <Button variant="outline">Change Password</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

