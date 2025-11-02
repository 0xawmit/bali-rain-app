import { render, screen, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '../../components/ToastContainer'

function TestComponent() {
  const { showToast } = useToast()

  return (
    <div>
      <button onClick={() => showToast('Test toast', 'success', 2000)}>
        Trigger Toast
      </button>
    </div>
  )
}

describe('ToastContainer Integration', () => {
  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useToast must be used within ToastProvider')

    console.error = originalError
  })

  it('creates toast with custom duration', async () => {
    jest.useFakeTimers()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Trigger Toast')
    button.click()

    await waitFor(() => {
      expect(screen.getByText('Test toast')).toBeInTheDocument()
    })

    // Advance time but not enough to close
    jest.advanceTimersByTime(1000)
    expect(screen.getByText('Test toast')).toBeInTheDocument()

    // Advance to duration time
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(screen.queryByText('Test toast')).not.toBeInTheDocument()
    })

    jest.useRealTimers()
  })
})

