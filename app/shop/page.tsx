'use client'

import Card from '../../components/Card'
import UserInfo from '../../components/UserInfo'

export default function ShopPage() {
  return (
    <div className="w-full py-8 space-y-8">
      <UserInfo />
      <Card className="text-center" padding="lg">
        <div className="text-7xl mb-6">🛍️</div>
        <h1 className="text-4xl font-light text-black mb-3">Shop</h1>
        <p className="text-xl text-gray-600 mb-8">Redeem your points for rewards</p>
      </Card>

      <div className="text-center py-16">
        <div className="text-7xl mb-6">🎁</div>
        <p className="text-2xl font-light text-gray-700 mb-3">Coming Soon</p>
        <p className="text-lg text-gray-500">We&apos;re preparing amazing rewards for you!</p>
      </div>
    </div>
  )
}
