'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Search, Filter, Plus } from 'lucide-react';

export default function TicketsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
            <p className="mt-2 text-gray-600">
              Track and manage support tickets
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Closed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">123</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
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

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>
              Showing 8 open tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No tickets yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Tickets will appear here when conversations are escalated
              </p>
              <div className="mt-6">
                <Button>Create First Ticket</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

