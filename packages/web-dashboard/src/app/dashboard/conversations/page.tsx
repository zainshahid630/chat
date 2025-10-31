'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Filter } from 'lucide-react';

export default function ConversationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
            <p className="mt-2 text-gray-600">
              Manage all customer conversations
            </p>
          </div>
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Conversations</CardTitle>
            <CardDescription>
              12 active conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No conversations yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Conversations will appear here when customers start chatting
              </p>
              <div className="mt-6">
                <Button>Start First Conversation</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

