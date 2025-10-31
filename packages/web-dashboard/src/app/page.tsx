export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to ChatDesk
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Customer Service Chat SaaS Platform
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">🚀 Phase 1: Foundation</h2>
          <p className="text-gray-700 mb-4">
            The monorepo is successfully initialized! Next steps:
          </p>
          <ul className="text-left space-y-2 text-gray-700">
            <li>✅ Turborepo monorepo structure</li>
            <li>✅ Shared package with TypeScript types</li>
            <li>✅ Next.js web dashboard</li>
            <li>✅ Tailwind CSS configuration</li>
            <li>⏳ Supabase setup (coming next)</li>
            <li>⏳ Authentication system</li>
            <li>⏳ Database schema implementation</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

