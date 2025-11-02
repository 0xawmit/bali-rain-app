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

export default function PointsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
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

      const { data: leaderboardData } = await supabase
        .from('leaderboard_7d')
        .select(`
          user_id,
          points_7d,
          profiles!inner(display_name, avatar_url)
        `)
        .order('points_7d', { ascending: false })
        .limit(20)

      const { data: userRankData } = await supabase
        .from('leaderboard_7d')
        .select('points_7d')
        .eq('user_id', session.user.id)
        .single()

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
    try {
      const { error } = await supabase.rpc('refresh_leaderboard_7d')
      if (error) {
        console.error('Error refreshing:', error)
      } else {
        loadLeaderboard()
      }
    } catch (error) {
      console.error('Failed to refresh leaderboard', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-6"></div>
          <p className="text-xl text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-10">
      <Card className="text-center" padding="lg">
        <div className="text-8xl mb-6">🏆</div>
        <h1 className="text-5xl font-light text-black mb-4">Leaderboard</h1>
        <p className="text-2xl text-gray-600 mb-8">Top performers this week</p>
        <Button onClick={handleRefresh} loading={refreshing} variant="secondary" className="px-10">
          Refresh
        </Button>
      </Card>

      {userRank && userRank > 20 && (
        <Card className="bg-gray-50">
          <div className="text-center py-8">
            <div className="text-6xl font-light text-black mb-4">#{userRank}</div>
            <div className="text-3xl text-gray-600 mb-2">{userPoints} points</div>
            <div className="text-xl text-gray-500">Your rank</div>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-3xl font-light mb-10 text-black tracking-tight">Top 20</h2>
        
        {leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-8">📊</div>
            <p className="text-2xl font-light text-gray-700 mb-3">No activity yet</p>
            <p className="text-lg text-gray-500">Start earning points to appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-6 rounded-3xl ${
                  entry.user_id === currentUserId ? 'bg-black text-white' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-light ${
                    entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                    entry.rank === 2 ? 'bg-gray-300 text-gray-900' :
                    entry.rank === 3 ? 'bg-orange-300 text-orange-900' :
                    entry.user_id === currentUserId ? 'bg-white text-black' : 'bg-white'
                  }`}>
                    {entry.rank <= 3 ? 
                      (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉') : 
                      entry.rank
                    }
                  </div>

                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    entry.user_id === currentUserId ? 'bg-white border-white' : 'bg-gray-200 border-gray-300'
                  }`}>
                    <span className={`text-xl font-medium ${
                      entry.user_id === currentUserId ? 'text-black' : 'text-gray-600'
                    }`}>
                      {(entry.display_name || 'User').charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <div className={`font-medium text-xl ${
                      entry.user_id === currentUserId ? 'text-white' : 'text-black'
                    }`}>
                      {entry.display_name || 'Anonymous User'}
                    </div>
                  </div>
                </div>

                <div className={`text-3xl font-light ${
                  entry.user_id === currentUserId ? 'text-white' : 'text-black'
                }`}>
                  {entry.points_7d}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
