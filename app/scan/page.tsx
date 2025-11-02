'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useToast } from '../../components/ToastContainer'

interface QRScanResponse {
  result: 'accepted' | 'rejected'
  points_awarded?: number
  new_balance?: number
  reason?: string
}

export default function ScanPage() {
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const handleQRScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setMessage('Please sign in to scan QR codes')
        setMessageType('error')
        setLoading(false)
        return
      }

      const edgeFunctionUrl = process.env.NEXT_PUBLIC_QR_SCAN_ENDPOINT
      
      if (!edgeFunctionUrl || edgeFunctionUrl === 'your-edge-function-url-here') {
        setMessage('QR scanning is not yet configured. Please contact support.')
        setMessageType('error')
        setLoading(false)
        return
      }

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: qrCode.trim().toUpperCase() }),
      })

      const data: QRScanResponse = await response.json()

      if (data.result === 'accepted') {
        showToast(`🎉 You earned ${data.points_awarded} points! New balance: ${data.new_balance}`, 'success')
        setQrCode('')
        setMessage('')
        setMessageType('')
        
        setTimeout(() => {
          router.refresh()
        }, 1500)
      } else {
        showToast(data.reason || 'Scan failed', 'error')
        setMessage(`❌ ${data.reason || 'Scan failed'}`)
        setMessageType('error')
      }

    } catch (error) {
      console.error('QR scan error:', error)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-10">
      <Card padding="lg">
        <div className="space-y-10">
          <div className="text-center">
            <div className="text-9xl mb-8">📱</div>
            <h2 className="text-5xl font-light text-black mb-6">Scan QR Code</h2>
            <p className="text-2xl text-gray-600">Enter the code from your Bali Rain bottle</p>
          </div>

          <form onSubmit={handleQRScan} className="space-y-8">
            <Input
              label="QR Code"
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Enter code (e.g., BOTTLE-ABC123)"
              required
              disabled={loading}
            />
            
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              disabled={!qrCode.trim()}
            >
              {loading ? 'Scanning...' : 'Redeem Code'}
            </Button>
          </form>

          {message && (
            <div className={`p-6 rounded-3xl text-lg border-2 ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-800 border-green-300' 
                : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              {message}
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-gray-50">
        <div className="space-y-6">
          <h3 className="text-2xl font-light text-black mb-6">📖 How it works</h3>
          <div className="space-y-4 text-lg text-gray-700">
            <p>• Find a QR code on your Bali Rain bottle or poster</p>
            <p>• Enter the code above (case doesn&apos;t matter)</p>
            <p>• Earn 25 points for each valid scan</p>
            <p>• Generic codes can be scanned once per 24 hours</p>
            <p>• Special codes can only be used once</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
