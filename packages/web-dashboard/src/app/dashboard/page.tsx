'use client';

import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Ticket, Users, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null; // Middleware will redirect
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.full_name || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your customer service today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {user.role !== 'customer' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Conversations
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Open Tickets
                  </CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    3 high priority
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Agents
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">
                    of 8 total agents
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Response Time
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4m</div>
                  <p className="text-xs text-muted-foreground">
                    -12% from last week
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === 'customer' && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Your Support</CardTitle>
                <CardDescription>
                  Start a conversation with our support team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You have 0 active conversations
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        {user.role !== 'customer' && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest conversations and tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New conversation from John Doe</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <Badge>New</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Ticket className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ticket #1234 updated</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Updated</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

