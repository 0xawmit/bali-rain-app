'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Handle magic link callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code')
      if (code) {
        setLoading(true)
        setMessage('Signing you in...')
        
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setMessage(`Error: ${error.message}`)
            setLoading(false)
          } else {
            // Success - redirect to home
            router.push('/home')
          }
        } catch (error) {
          setMessage('An unexpected error occurred')
          setLoading(false)
        }
      }
    }

    handleAuthCallback()
  }, [searchParams, supabase, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        },
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Check your email for the magic link!')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
        setLoading(false)
      }
      // If successful, user will be redirected to Google, then back to /wallet
    } catch (error) {
      setMessage('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="text-8xl mb-4">🌧️</div>
          <h1 className="text-7xl font-light tracking-tight text-black">Bali Rain</h1>
          <p className="text-xl text-gray-600">Start earning points</p>
        </div>

        {/* Login Form */}
        <Card className="space-y-8">
          {/* Email Magic Link */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              Send Magic Link
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-600 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </Button>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-xl text-sm border-2 ${
              message.includes('Error') 
                ? 'bg-red-50/50 text-red-800 border-red-300 font-medium' 
                : 'bg-green-50/50 text-green-800 border-green-300 font-medium'
            }`}>
              {message}
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </main>
  )
}

