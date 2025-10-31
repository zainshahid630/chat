'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Globe, Shield, Webhook } from 'lucide-react';

export default function SettingsPage() {
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

        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>General</CardTitle>
            </div>
            <CardDescription>
              Basic organization settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Organization Name</label>
                <input
                  type="text"
                  placeholder="Your Organization"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive email updates for new messages</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sound Alerts</p>
                  <p className="text-sm text-gray-500">Play sound for new messages</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              <CardTitle>Webhooks</CardTitle>
            </div>
            <CardDescription>
              Configure webhook endpoints for events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Webhook className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No webhooks configured</h3>
              <p className="mt-2 text-sm text-gray-500">
                Add webhook endpoints to receive real-time event notifications
              </p>
              <div className="mt-6">
                <Button>Add Webhook</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

