'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function FixProfilePage() {
  const { supabaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFix = async () => {
    if (!supabaseUser) {
      setResult({ error: 'No authenticated user found' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/fix-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: supabaseUser.id }),
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        // Reload the page after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Fix User Profile</h1>
        
        {supabaseUser ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">User ID:</p>
              <p className="font-mono text-sm">{supabaseUser.id}</p>
              <p className="text-sm text-gray-600 mt-2">Email:</p>
              <p className="font-mono text-sm">{supabaseUser.email}</p>
            </div>

            <button
              onClick={handleFix}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Create User Profile'}
            </button>

            {result && (
              <div className={`p-4 rounded ${result.error ? 'bg-red-50' : 'bg-green-50'}`}>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No authenticated user found. Please log in first.</p>
        )}
      </div>
    </div>
  );
}

