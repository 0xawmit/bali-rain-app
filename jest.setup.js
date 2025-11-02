// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_QR_SCAN_ENDPOINT = 'https://test.supabase.co/functions/v1/qr-scan'

// Mock Supabase client module
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => {
    const { mockSupabaseClient } = require('./tests/__mocks__/supabase')
    return mockSupabaseClient
  }),
}))

