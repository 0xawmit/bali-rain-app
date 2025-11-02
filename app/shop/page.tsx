'use client'

import Card from '../../components/Card'

export default function ShopPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-10">
      <Card className="text-center" padding="lg">
        <div className="text-9xl mb-8">🛍️</div>
        <h1 className="text-5xl font-light text-black mb-4">Shop</h1>
        <p className="text-2xl text-gray-600 mb-10">Redeem your points for rewards</p>
      </Card>

      <div className="text-center py-20">
        <div className="text-8xl mb-8">🎁</div>
        <p className="text-3xl font-light text-gray-700 mb-4">Coming Soon</p>
        <p className="text-xl text-gray-500">We&apos;re preparing amazing rewards for you!</p>
      </div>
    </div>
  )
}
