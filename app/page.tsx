import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // User is logged in, redirect to wallet (main dashboard)
    redirect('/wallet')
  } else {
    // User is not logged in, redirect to login
    redirect('/login')
  }
}

