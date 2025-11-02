/**
 * Utility functions for mocking Supabase in tests
 */

import { mockSupabaseClient, mockSession } from '../__mocks__/supabase'

/**
 * Create a mock Supabase client with configurable behavior
 */
export function createTestSupabaseClient(overrides?: {
  hasSession?: boolean
  sessionError?: Error | null
}) {
  const { hasSession = true, sessionError = null } = overrides || {}

  return {
    ...mockSupabaseClient,
    auth: {
      ...mockSupabaseClient.auth,
      getSession: jest.fn(() =>
        Promise.resolve({
          data: hasSession ? { session: mockSession } : { session: null },
          error: sessionError,
        })
      ),
    },
  }
}

/**
 * Mock fetch for API calls
 */
export function mockFetch(overrides?: {
  ok?: boolean
  response?: any
  error?: Error
}) {
  const { ok = true, response, error } = overrides || {}

  if (error) {
    global.fetch = jest.fn(() => Promise.reject(error)) as jest.Mock
  } else {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok,
        json: jest.fn(() => Promise.resolve(response || {})),
        status: ok ? 200 : 400,
        statusText: ok ? 'OK' : 'Bad Request',
      } as Response)
    ) as jest.Mock
  }

  return global.fetch as jest.Mock
}

/**
 * Reset all mocks between tests
 */
export function resetMocks() {
  jest.clearAllMocks()
  mockSupabaseClient.auth.getSession.mockClear()
}

