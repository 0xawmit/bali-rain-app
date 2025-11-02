'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import UserInfo from '../../components/UserInfo'
import { SocialSubmission } from '../../lib/types'
import { useToast } from '../../components/ToastContainer'

export default function QuestsPage() {
  const [platform, setPlatform] = useState<'x' | 'instagram'>('x')
  const [postUrl, setPostUrl] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<SocialSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

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

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast('Please sign in to submit social posts', 'error')
        setSubmitting(false)
        return
      }

      let screenshotUrl = null

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

        const { data: { publicUrl } } = supabase.storage
          .from('social-screenshots')
          .getPublicUrl(uploadData.path)

        screenshotUrl = publicUrl
      }

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
        if (insertError.code === '23505') {
          showToast('You have already submitted this post URL', 'error')
        } else {
          throw insertError
        }
      } else {
        showToast('✅ Submission received! We\'ll review it soon.', 'success')
        setPostUrl('')
        setScreenshot(null)
        loadSubmissions()
      }

    } catch (error) {
      console.error('Social submission error:', error)
      showToast('An unexpected error occurred', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string, points?: number | null) => {
    const baseClasses = 'px-4 py-2 rounded-full text-base font-medium'
    
    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>
      case 'credited':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved +{points} pts</span>
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>
    }
  }

  return (
    <div className="w-full py-8 space-y-8">
      <UserInfo />
      <Card padding="lg">
        <div className="space-y-10">
          <div className="text-center">
            <div className="text-7xl mb-6">📸</div>
            <h2 className="text-4xl font-light text-black mb-4">Submit Social Post</h2>
            <p className="text-xl text-gray-600">Share your Bali Rain experience</p>
          </div>

          <form onSubmit={handleSocialSubmit} className="space-y-8">
            <div>
              <label className="block text-lg font-medium text-black mb-3">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as 'x' | 'instagram')}
                className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
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
              <label className="block text-lg font-medium text-black mb-3">Screenshot (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                disabled={submitting}
              />
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
        </div>
      </Card>

      {submissions.length > 0 && (
        <Card>
          <h2 className="text-2xl font-light mb-8 text-black tracking-tight">My Submissions</h2>
          
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl"
              >
                <div className="flex items-center space-x-6">
                  <div className="text-5xl">
                    {submission.platform === 'x' ? '🐦' : '📷'}
                  </div>
                  <div>
                    <div className="font-medium text-black text-xl mb-2">
                      {submission.platform === 'x' ? 'X (Twitter)' : 'Instagram'}
                    </div>
                    <div className="text-base text-gray-500">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div>
                  {getStatusBadge(submission.status, submission.awarded_points)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
