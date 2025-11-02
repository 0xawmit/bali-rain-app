import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    // User is logged in, redirect to home
    redirect('/home')
  } else {
    // User is not logged in, redirect to login
    redirect('/login')
  }
}

