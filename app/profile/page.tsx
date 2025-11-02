'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { Profile } from '../../lib/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  
  // Form state
  const [displayName, setDisplayName] = useState('')
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setDisplayName(profileData.display_name || '')
        setCountry(profileData.country || '')
        setTimezone(profileData.timezone || '')
        setAvatarPreview(profileData.avatar_url)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setMessageType('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage('Please sign in to update your profile')
        setMessageType('error')
        setSaving(false)
        return
      }

      let avatarUrl = profile?.avatar_url

      // Upload new avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${session.user.id}/avatar.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true, // Allow overwriting existing avatar
          })

        if (uploadError) {
          throw new Error(`Failed to upload avatar: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path)

        avatarUrl = publicUrl
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          country: country.trim() || null,
          timezone: timezone.trim() || null,
          avatar_url: avatarUrl
        })
        .eq('user_id', session.user.id)

      if (updateError) {
        throw updateError
      }

      setMessage('✅ Profile updated successfully!')
      setMessageType('success')
      setAvatarFile(null) // Clear file input
      
      // Refresh profile data
      loadProfile()

    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-black">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-bold text-gradient-bali-rain mb-2 tracking-tight">👤 Profile</h1>
        <p className="text-slate-600 text-xl font-medium">Manage your account settings and preferences</p>
      </div>

      {/* Profile Form */}
      <Card>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-gray-600">
                      {displayName.charAt(0).toUpperCase() || '👤'}
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={saving}
              />
              <p className="text-xs text-black mt-1">Upload a profile picture (optional)</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              disabled={saving}
            />

            <Input
              label="Country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Enter your country"
              disabled={saving}
            />
          </div>

          <Input
            label="Timezone"
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g., America/New_York, Europe/London"
            helperText="Enter your timezone for better experience"
            disabled={saving}
          />

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

          {/* Save Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              loading={saving}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Info */}
      <Card>
        <h2 className="text-xl font-semibold text-black mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-black">Member since:</span>
            <span className="text-black">
              {profile?.created_at 
                ? new Date(profile.created_at).toLocaleDateString()
                : 'Unknown'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">User ID:</span>
            <span className="text-black font-mono text-xs">
              {profile?.user_id?.slice(0, 8)}...
            </span>
          </div>
        </div>
      </Card>

    </div>
  )
}


