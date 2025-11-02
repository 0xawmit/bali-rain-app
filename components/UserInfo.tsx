'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { Profile } from '../lib/types'

export default function UserInfo() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      setProfile(profileData)

      // Get points
      const { data: walletData } = await supabase
        .from('point_wallets')
        .select('balance_cached')
        .eq('user_id', session.user.id)
        .single()
      
      setPoints(walletData?.balance_cached || 0)
    } catch (error) {
      console.error('Error loading user info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full p-6 bg-gray-50 rounded-3xl mb-8">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6 bg-gray-50 rounded-3xl mb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-light text-black mb-2">
            {profile?.display_name || 'User'}
          </div>
          <div className="text-base text-gray-600">
            {points !== null ? `${points.toLocaleString()} points` : 'Loading...'}
          </div>
        </div>
        {profile?.avatar_url ? (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
            <img src={profile.avatar_url} alt={profile.display_name || 'Avatar'} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
            <span className="text-2xl text-gray-600">
              {(profile?.display_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

