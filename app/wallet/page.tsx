import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { PointWallet, PointLedger } from '../../lib/types'
import Card from '../../components/Card'
import { SkeletonCard, SkeletonList } from '../../components/Loader'

async function getWalletData(userId: string) {
  const supabase = await createClient()
  
  // Get wallet balance
  const { data: wallet } = await supabase
    .from('point_wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('point_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return { wallet, transactions }
}

export default async function WalletPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { wallet, transactions } = await getWalletData(session.user.id)

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-8 space-y-10">
      {/* Points Balance Card - Large Feature */}
      <Card className="overflow-hidden bg-gray-50" padding="lg">
        <div className="text-center py-20">
          <div className="text-9xl font-light text-black mb-6 tracking-tight">
            {wallet?.balance_cached?.toLocaleString() || 0}
          </div>
          <div className="text-3xl text-gray-600 mb-8 font-light">Points Balance</div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card hover className="text-center">
          <div className="text-7xl mb-8">📱</div>
          <h3 className="font-light text-3xl mb-4 text-black">Scan QR Code</h3>
          <p className="text-lg text-gray-600 mb-10">Enter a bottle code to earn points</p>
          <a
            href="/earn"
            className="inline-block bg-black text-white px-10 py-5 rounded-2xl font-medium"
          >
            Start Earning →
          </a>
        </Card>

        <Card hover className="text-center">
          <div className="text-7xl mb-8">📸</div>
          <h3 className="font-light text-3xl mb-4 text-black">Submit Social Post</h3>
          <p className="text-lg text-gray-600 mb-10">Share your Bali Rain experience</p>
          <a
            href="/earn"
            className="inline-block bg-black text-white px-10 py-5 rounded-2xl font-medium"
          >
            Submit Post →
          </a>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <h2 className="text-3xl font-light mb-10 text-black tracking-tight">Recent Activity</h2>
        
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-8">📝</div>
            <p className="text-2xl font-light text-gray-700 mb-3">No transactions yet</p>
            <p className="text-lg text-gray-500">Start earning points to see your activity here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction: PointLedger) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl"
              >
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white border border-gray-200">
                    <span className="text-3xl">
                      {transaction.delta > 0 ? '⬆️' : '⬇️'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-black text-xl">
                      {transaction.reason || `${transaction.source} transaction`}
                    </div>
                    <div className="text-base text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })} at{' '}
                      {new Date(transaction.created_at).toLocaleTimeString('en-US', { 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className={`text-3xl font-light ${
                  transaction.delta > 0 ? 'text-black' : 'text-gray-600'
                }`}>
                  {transaction.delta > 0 ? '+' : ''}{transaction.delta.toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
