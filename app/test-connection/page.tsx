import { createClient } from '@/lib/supabase/server'

export default async function TestConnection() {
  const supabase = await createClient()
  
  // Try to query the profiles table (should be empty initially)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl w-full space-y-4">
        <h1 className="text-3xl font-bold">🔌 Supabase Connection Test</h1>
        
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">❌ Connection Error</p>
            <p className="text-sm">{error.message}</p>
            <p className="text-xs mt-2">Check your .env.local file and make sure migrations were applied.</p>
          </div>
        ) : (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-bold">✅ Connected to Supabase!</p>
            <p className="text-sm">Database connection is working. Found {profiles?.length || 0} profiles.</p>
            <p className="text-xs mt-2">All tables are accessible. Ready to proceed with Phase 2!</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <p className="font-semibold mb-2">Next Steps:</p>
          <ol className="text-sm list-decimal list-inside space-y-1">
            <li>If you see ✅ above, you&apos;re ready!</li>
            <li>Tell me &quot;ready&quot; and I&apos;ll start building Phase 2 (Auth + Wallet pages)</li>
            <li>If you see ❌, double-check your .env.local file</li>
          </ol>
        </div>

        <a 
          href="/"
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          ← Back to Home
        </a>
      </div>
    </main>
  )
}


