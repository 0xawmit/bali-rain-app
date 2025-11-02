/**
 * Database table types
 * These match the Supabase schema that will be created in migrations
 */

export interface Profile {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  country: string | null
  timezone: string | null
  created_at: string
}

export interface PointWallet {
  user_id: string
  balance_cached: number
  updated_at: string
}

export interface PointLedger {
  id: number
  user_id: string
  source: 'scan' | 'social' | 'admin' | 'refund' | 'redeem'
  ref_id: string | null
  delta: number
  reason: string | null
  created_at: string
}

export interface QRCode {
  id: string
  code: string
  label: string | null
  points_value: number
  is_unique: boolean
  starts_at: string | null
  ends_at: string | null
  metadata: Record<string, any>
}

export interface ScanEvent {
  id: string
  user_id: string
  qr_code_id: string
  scanned_at: string
  client_nonce: string | null
  server_nonce: string | null
  result: 'accepted' | 'rejected'
  reject_reason: string | null
}

export interface SocialSubmission {
  id: string
  user_id: string
  platform: 'x' | 'instagram'
  post_url: string
  screenshot_url: string | null
  status: 'pending' | 'credited' | 'rejected'
  awarded_points: number | null
  reason: string | null
  created_at: string
  reviewed_at: string | null
  reviewer_user_id: string | null
}

export interface Leaderboard7d {
  user_id: string
  points_7d: number
}

/**
 * API response types
 */

export interface QRScanResponse {
  result: 'accepted' | 'rejected'
  points_awarded?: number
  new_balance?: number
  reason?: string
}

