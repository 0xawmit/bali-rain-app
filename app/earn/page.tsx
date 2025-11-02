'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { SocialSubmission } from '../../lib/types'
import { useToast } from '../../components/ToastContainer'

interface QRScanResponse {
  result: 'accepted' | 'rejected'
  points_awarded?: number
  new_balance?: number
  reason?: string
}

export default function EarnPage() {
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  
  // Social submission state
  const [platform, setPlatform] = useState<'x' | 'instagram'>('x')
  const [postUrl, setPostUrl] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<SocialSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  // Load user's submissions
  useEffect(() => {
    loadSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSubmissions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('social_submissions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setSubmissions(data || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleQRScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      console.log('🔍 Starting QR scan process...')
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Session:', session ? 'Found' : 'Not found')
      
      if (!session) {
        setMessage('Please sign in to scan QR codes')
        setMessageType('error')
        setLoading(false)
        return
      }

      // Call the Edge Function
      const edgeFunctionUrl = process.env.NEXT_PUBLIC_QR_SCAN_ENDPOINT
      console.log('🔍 Edge Function URL:', edgeFunctionUrl)
      
      if (!edgeFunctionUrl || edgeFunctionUrl === 'your-edge-function-url-here') {
        setMessage('QR scanning is not yet configured. Please contact support.')
        setMessageType('error')
        setLoading(false)
        return
      }

      console.log('🔍 Making request to Edge Function...')
      console.log('🔍 Code being sent:', qrCode.trim().toUpperCase())
      console.log('🔍 Access token:', session.access_token ? 'Present' : 'Missing')
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: qrCode.trim().toUpperCase() }),
      })

      console.log('🔍 Response status:', response.status)
      const data: QRScanResponse = await response.json()
      console.log('🔍 Response data:', data)

      if (data.result === 'accepted') {
        showToast(`🎉 You earned ${data.points_awarded} points! New balance: ${data.new_balance}`, 'success')
        setQrCode('') // Clear the input
        setMessage('')
        setMessageType('')
        
        // Refresh the page after a short delay to show updated balance
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

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setMessageType('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage('Please sign in to submit social posts')
        setMessageType('error')
        setSubmitting(false)
        return
      }

      let screenshotUrl = null

      // Upload screenshot if provided
      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop()
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('social-screenshots')
          .upload(fileName, screenshot, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Failed to upload screenshot: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('social-screenshots')
          .getPublicUrl(uploadData.path)

        screenshotUrl = publicUrl
      }

      // Insert submission
      const { error: insertError } = await supabase
        .from('social_submissions')
        .insert({
          user_id: session.user.id,
          platform,
          post_url: postUrl.trim(),
          screenshot_url: screenshotUrl,
          status: 'pending'
        })

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          setMessage('You have already submitted this post URL')
          setMessageType('error')
        } else {
          throw insertError
        }
      } else {
        showToast('✅ Submission received! We\'ll review it soon and award points if approved.', 'success')
        setMessage('')
        setMessageType('')
        setPostUrl('')
        setScreenshot(null)
        loadSubmissions() // Refresh the list
      }

    } catch (error) {
      console.error('Social submission error:', error)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string, points?: number | null) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
    
    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending Review</span>
      case 'credited':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved (+{points} pts)</span>
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-bold text-gradient-bali-rain mb-2 tracking-tight">Earn Points</h1>
        <p className="text-slate-600 text-xl font-medium">Scan QR codes or submit social posts to earn points</p>
      </div>

      {/* QR Code Section */}
      <Card>
        <div className="space-y-8">
          <div className="text-center">
            <div className="text-7xl mb-4">📱</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Scan QR Code</h2>
            <p className="text-slate-600 text-lg font-medium">Enter the code from your Bali Rain bottle or poster</p>
          </div>

          <form onSubmit={handleQRScan} className="space-y-4">
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

          {/* Help Text */}
          <div className="bg-gradient-to-r from-sky-50/50 to-teal-50/50 border-2 border-sky-200 p-6 rounded-2xl shadow-soft">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center text-lg">
              <span className="mr-3">💡</span> How it works:
            </h3>
            <ul className="text-base text-slate-700 space-y-3 font-medium">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Find a QR code on your Bali Rain bottle or poster</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Enter the code above (case doesn&apos;t matter)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Earn 25 points for each valid scan</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Generic codes can be scanned once per 24 hours</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Special codes can only be used once</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Social Media Section */}
      <Card>
        <div className="space-y-8">
          <div className="text-center">
            <div className="text-7xl mb-4">📸</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Submit Social Post</h2>
            <p className="text-slate-600 text-lg font-medium">Share your Bali Rain experience on social media</p>
          </div>

          <form onSubmit={handleSocialSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as 'x' | 'instagram')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                disabled={submitting}
              >
                <option value="x">X (Twitter)</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <Input
              label="Post URL"
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://x.com/username/status/1234567890"
              required
              disabled={submitting}
            />

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Screenshot (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                disabled={submitting}
              />
              <p className="text-xs text-black mt-1">Upload a screenshot of your post as proof</p>
            </div>

            <Button
              type="submit"
              loading={submitting}
              className="w-full"
              disabled={!postUrl.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Post'}
            </Button>
          </form>

          {/* Help Text */}
          <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-2 border-green-200 p-6 rounded-2xl shadow-soft">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center text-lg">
              <span className="mr-3">💡</span> How it works:
            </h3>
            <ul className="text-base text-slate-700 space-y-3 font-medium">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Share a post about Bali Rain on X or Instagram</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Copy the post URL and paste it above</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Optionally upload a screenshot as proof</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We&apos;ll review your submission and award 20 points if approved</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You&apos;ll see the status update in &quot;My Submissions&quot; below</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* My Submissions */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Submissions</h2>
        
        {loadingSubmissions ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-black">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-black">
            <div className="text-4xl mb-4">📝</div>
            <p>No submissions yet</p>
            <p className="text-sm">Submit a social post above to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {submission.platform === 'x' ? '🐦' : '📷'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 mb-1">
                      {submission.platform === 'x' ? 'X (Twitter)' : 'Instagram'}
                    </div>
                    <div className="text-sm text-gray-600 truncate max-w-xs mb-1">
                      {submission.post_url}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(submission.created_at).toLocaleDateString()} at{' '}
                      {new Date(submission.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(submission.status, submission.awarded_points)}
                </div>
              </div>
            ))}
          </div>
        )}
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
