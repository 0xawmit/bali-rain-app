'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Profile } from '../lib/types'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        setProfile(profileData)
      }
      
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          setProfile(profileData)
          
          const { data: walletData } = await supabase
            .from('point_wallets')
            .select('balance_cached')
            .eq('user_id', session.user.id)
            .single()
          setPoints(walletData?.balance_cached || 0)
        } else {
          setProfile(null)
          setPoints(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (user) {
      supabase
        .from('point_wallets')
        .select('balance_cached')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPoints(data.balance_cached || 0)
          }
        })
    }
  }, [user, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Don't show navigation on login page or test connection
  if (pathname === '/login' || pathname === '/test-connection') {
    return null
  }

  if (loading || !user) {
    return null
  }

  const navItems = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/quests', label: 'Quests', icon: '🎯' },
    { path: '/scan', label: 'Scan', icon: '📱' },
    { path: '/shop', label: 'Shop', icon: '🛍️' },
    { path: '/points', label: 'Points', icon: '⭐' },
  ]

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Menu Button */}
            <button className="px-4 py-2 text-base font-medium text-black hover:bg-gray-50 rounded-2xl transition-all">
              Menu
            </button>

            {/* Profile Button */}
            <Link href="/profile" className="px-4 py-2 text-base font-medium text-black hover:bg-gray-50 rounded-2xl transition-all">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around h-16">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all ${
                  pathname === item.path
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}
