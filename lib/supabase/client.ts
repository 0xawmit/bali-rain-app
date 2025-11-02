import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for use in browser/client components
 * This uses the anon key which is safe to expose to the browser
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

