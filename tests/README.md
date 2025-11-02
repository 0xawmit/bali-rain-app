# Testing Guide

This directory contains all tests for the Bali Rain app.

## Test Structure

```
tests/
├── __mocks__/          # Mock implementations (Supabase, etc.)
├── components/         # Jest unit tests for React components
├── e2e/               # Playwright end-to-end tests
└── utils/             # Test utilities and helpers
```

## Running Tests

### Unit Tests (Jest)

Run all unit tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### E2E Tests (Playwright)

Run all E2E tests:
```bash
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

Debug E2E tests:
```bash
npm run test:e2e:debug
```

### Run All Tests

```bash
npm run test:all
```

### CI Test Suite

Runs lint, build, and all tests:
```bash
npm run test:ci
```

## Test Files

### Component Tests

- `tests/components/Toast.test.tsx` - Tests for Toast component rendering and behavior
- `tests/components/ToastContainer.test.tsx` - Tests for ToastProvider and context

### E2E Tests

- `tests/e2e/qr-scan.spec.ts` - Complete QR scan flow including toast verification

## Mocking

### Supabase Mock

The `tests/__mocks__/supabase.ts` file provides a mock Supabase client for testing. Use `createTestSupabaseClient()` from `tests/utils/mockSupabase.ts` to customize behavior.

### Example Usage

```typescript
import { createTestSupabaseClient, mockFetch } from '../utils/mockSupabase'

test('my test', () => {
  const supabase = createTestSupabaseClient({ hasSession: true })
  mockFetch({ ok: true, response: { result: 'success' } })
  // ... your test code
})
```

## Writing New Tests

### Component Tests

Use React Testing Library for component tests:

```typescript
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

test('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

### E2E Tests

Use Playwright for E2E tests:

```typescript
import { test, expect } from '@playwright/test'

test('user flow', async ({ page }) => {
  await page.goto('/my-page')
  await expect(page.getByText('Hello')).toBeVisible()
})
```

## Environment Variables

Check environment variable configuration:
```bash
npm run check:env
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_QR_SCAN_ENDPOINT`

## Continuous Integration

The `test:ci` script runs:
1. Lint check (`npm run lint`)
2. Build check (`npm run build`)
3. Unit tests (`npm run test`)
4. E2E tests (`npm run test:e2e`)

This should be run before pushing to production.

