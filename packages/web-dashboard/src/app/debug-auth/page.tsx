'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function DebugAuthPage() {
  const { user, supabaseUser, loading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>

        <div className="space-y-6">
          {/* Loading State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Loading State</h2>
            <p className="text-lg">
              Loading: <span className="font-mono">{loading ? 'true' : 'false'}</span>
            </p>
          </div>

          {/* Supabase User */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supabase User (from AuthContext)</h2>
            {supabaseUser ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(supabaseUser, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No Supabase user</p>
            )}
          </div>

          {/* User Profile */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Profile (from users table)</h2>
            {user ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No user profile</p>
            )}
          </div>

          {/* Session */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session (direct from Supabase)</h2>
            {session ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No session</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

