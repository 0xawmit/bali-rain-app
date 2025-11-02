'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Leaderboard7d, Profile } from '../../lib/types'

interface LeaderboardEntry extends Leaderboard7d {
  display_name: string | null
  avatar_url: string | null
  rank: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadLeaderboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadLeaderboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      setCurrentUserId(session.user.id)

      // Get top 20 users from leaderboard
      const { data: leaderboardData } = await supabase
        .from('leaderboard_7d')
        .select(`
          user_id,
          points_7d,
          profiles!inner(display_name, avatar_url)
        `)
        .order('points_7d', { ascending: false })
        .limit(20)

      // Get current user's rank
      const { data: userRankData } = await supabase
        .from('leaderboard_7d')
        .select('points_7d')
        .eq('user_id', session.user.id)
        .single()

      // Calculate user's rank
      let userRankPosition = null
      if (userRankData) {
        const { count } = await supabase
          .from('leaderboard_7d')
          .select('*', { count: 'exact', head: true })
          .gt('points_7d', userRankData.points_7d)
        
        userRankPosition = (count || 0) + 1
      }

      setLeaderboard(leaderboardData?.map((entry: any, index) => ({
        ...entry,
        display_name: entry.profiles?.display_name || null,
        avatar_url: entry.profiles?.avatar_url || null,
        rank: index + 1
      })) || [])
      setUserRank(userRankPosition)
      setUserPoints(userRankData?.points_7d || 0)

    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setMessage('')
    setMessageType('')

    try {
      const { error } = await supabase.rpc('refresh_leaderboard_7d')
      if (error) {
        setMessage(`Error: ${error.message}`)
        setMessageType('error')
      } else {
        setMessage('✅ Leaderboard refreshed!')
        setMessageType('success')
        loadLeaderboard() // Reload data
      }
    } catch (error) {
      setMessage('Failed to refresh leaderboard')
      setMessageType('error')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-black">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-bold text-gradient-bali-rain mb-2 tracking-tight">🏆 Leaderboard</h1>
        <p className="text-slate-600 text-xl font-medium">Top performers in the last 7 days</p>
      </div>

      {/* User's Rank (if not in top 20) */}
      {userRank && userRank > 20 && (
        <Card>
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h2 className="text-lg font-semibold text-black mb-2">Your Rank</h2>
            <div className="text-3xl font-bold text-blue-600 mb-2">#{userRank}</div>
            <div className="text-lg text-black">{userPoints} points (7 days)</div>
          </div>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <Button 
          onClick={handleRefresh}
          loading={refreshing}
          variant="outline"
        >
          🔄 Refresh Leaderboard
        </Button>
        <p className="text-xs text-black mt-2">Click to update rankings with latest points</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          messageType === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Leaderboard */}
      <Card>
        <h2 className="text-xl font-semibold text-black mb-4">Top 20 (Last 7 Days)</h2>
        
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-black">
            <div className="text-4xl mb-4">📊</div>
            <p>No activity yet</p>
            <p className="text-sm">Start earning points to appear on the leaderboard</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  entry.user_id === currentUserId
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                    entry.rank === 2 ? 'bg-gray-300 text-gray-900' :
                    entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {entry.avatar_url ? (
                      <img 
                        src={entry.avatar_url} 
                        alt={entry.display_name || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {(entry.display_name || 'User').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div>
                    <div className="font-medium text-black">
                      {entry.display_name || 'Anonymous User'}
                      {entry.user_id === currentUserId && (
                        <span className="ml-2 text-blue-600 text-sm">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-black">
                      {entry.points_7d} points this week
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-lg font-bold text-black">
                    {entry.points_7d}
                  </div>
                  <div className="text-xs text-black">points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info */}
      <Card>
        <div className="text-center">
          <h3 className="font-semibold text-black mb-2">📈 How Rankings Work</h3>
          <div className="text-sm text-black space-y-1">
            <p>• Rankings are based on points earned in the last 7 days</p>
            <p>• QR code scans: 25 points each</p>
            <p>• Approved social posts: 20 points each</p>
            <p>• Leaderboard updates when you click &quot;Refresh&quot;</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => router.push('/wallet')}
        >
          ← Back to Wallet
        </Button>
      </div>
    </div>
  )
}
