import { QRScanResponse } from './types'

/**
 * API helper functions for calling Edge Functions and external APIs
 */

/**
 * Call the QR scan Edge Function to validate and redeem a QR code
 * @param code - The QR code string (e.g., "BOTTLE-25")
 * @param accessToken - The user's Supabase access token (JWT)
 * @returns QR scan response with result and points
 */
export async function scanQRCode(
  code: string,
  accessToken: string
): Promise<QRScanResponse> {
  const endpoint = process.env.NEXT_PUBLIC_QR_SCAN_ENDPOINT

  if (!endpoint || endpoint === 'your-edge-function-url-here') {
    throw new Error('QR scan endpoint not configured. Please set NEXT_PUBLIC_QR_SCAN_ENDPOINT in .env.local')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || 'Failed to scan QR code')
  }

  const data: QRScanResponse = await response.json()
  return data
}

/**
 * Get the Edge Function URL for QR scanning
 * This will be set after deploying the Edge Function
 */
export function getQRScanEndpoint(): string {
  return process.env.NEXT_PUBLIC_QR_SCAN_ENDPOINT || 'your-edge-function-url-here'
}

