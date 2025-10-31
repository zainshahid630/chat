'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getRoleDisplayName, formatUserName } from '@/lib/auth/utils';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Middleware will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">ChatDesk Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome, {formatUserName(user)}!
          </h2>
          <p className="text-gray-600">
            You are logged in as <span className="font-medium">{getRoleDisplayName(user.role)}</span>
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.full_name || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">{getRoleDisplayName(user.role)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            {user.organization_id && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{user.organization_id}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {user.role === 'agent' || user.role === 'org_admin' || user.role === 'super_admin' ? (
              <>
                <button className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-left">
                  <div className="font-medium">View Conversations</div>
                  <div className="text-sm text-blue-600">Manage customer chats</div>
                </button>
                <button className="px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-left">
                  <div className="font-medium">View Tickets</div>
                  <div className="text-sm text-green-600">Track support tickets</div>
                </button>
              </>
            ) : null}
            
            {user.role === 'customer' ? (
              <button className="px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-left">
                <div className="font-medium">Start Chat</div>
                <div className="text-sm text-purple-600">Get support now</div>
              </button>
            ) : null}

            {user.role === 'org_admin' || user.role === 'super_admin' ? (
              <button className="px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-left">
                <div className="font-medium">Settings</div>
                <div className="text-sm text-orange-600">Manage organization</div>
              </button>
            ) : null}
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">🚧 Development Mode</h4>
          <p className="text-sm text-yellow-700">
            This is a basic dashboard for testing authentication. Full dashboard features will be implemented in Phase 2.
          </p>
        </div>
      </main>
    </div>
  );
}

