'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PointLedger, Profile } from '../../lib/types'
import Card from '../../components/Card'
import UserInfo from '../../components/UserInfo'

export default function HomePage() {
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<PointLedger[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Get wallet
      const { data: walletData } = await supabase
        .from('point_wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      setWallet(walletData)

      // Get transactions
      const { data: transactionsData } = await supabase
        .from('point_ledger')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full py-8 space-y-10">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-3xl"></div>
          <div className="h-32 bg-gray-200 rounded-3xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 space-y-8">
      <UserInfo />
      {/* Points Balance Card - Large Feature */}
      <Card className="overflow-hidden bg-gray-50" padding="lg">
        <div className="text-center py-16">
          <div className="text-8xl font-light text-black mb-4 tracking-tight">
            {wallet?.balance_cached?.toLocaleString() || 0}
          </div>
          <div className="text-2xl text-gray-600 font-light">Points Balance</div>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <h2 className="text-2xl font-light mb-8 text-black tracking-tight">Recent Activity</h2>
        
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-7xl mb-6">📝</div>
            <p className="text-xl font-light text-gray-700 mb-2">No transactions yet</p>
            <p className="text-base text-gray-500">Start earning points to see your activity here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction: PointLedger) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-gray-200 flex-shrink-0">
                    <span className="text-2xl">
                      {transaction.delta > 0 ? '⬆️' : '⬇️'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-black text-lg truncate">
                      {transaction.reason || `${transaction.source} transaction`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })} at{' '}
                      {new Date(transaction.created_at).toLocaleTimeString('en-US', { 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className={`text-2xl font-light ml-3 flex-shrink-0 ${
                  transaction.delta > 0 ? 'text-black' : 'text-gray-600'
                }`}>
                  {transaction.delta > 0 ? '+' : ''}{transaction.delta.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
