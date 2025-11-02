import { render, screen, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '../../components/ToastContainer'
import Toast from '../../components/Toast'

// Test component that uses Toast
function TestToastComponent() {
  const { showToast } = useToast()
  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
    </div>
  )
}

describe('Toast Component', () => {
  it('renders toast with success message', () => {
    const mockOnClose = jest.fn()
    render(
      <Toast
        id="test-1"
        message="Success message"
        type="success"
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('renders toast with error message', () => {
    const mockOnClose = jest.fn()
    render(
      <Toast
        id="test-2"
        message="Error message"
        type="error"
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn()
    render(
      <Toast
        id="test-3"
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByLabelText('Close')
    closeButton.click()

    expect(mockOnClose).toHaveBeenCalledWith('test-3')
  })

  it('auto-closes after duration', async () => {
    jest.useFakeTimers()
    const mockOnClose = jest.fn()
    
    render(
      <Toast
        id="test-4"
        message="Auto close message"
        type="success"
        duration={1000}
        onClose={mockOnClose}
      />
    )

    expect(mockOnClose).not.toHaveBeenCalled()
    
    jest.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('test-4')
    })

    jest.useRealTimers()
  })
})

describe('ToastProvider', () => {
  it('provides showToast function', () => {
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    )

    const successButton = screen.getByText('Show Success')
    expect(successButton).toBeInTheDocument()
  })

  it('displays toast when showToast is called', async () => {
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    )

    const successButton = screen.getByText('Show Success')
    successButton.click()

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })
  })

  it('displays multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    )

    const successButton = screen.getByText('Show Success')
    const errorButton = screen.getByText('Show Error')

    successButton.click()
    errorButton.click()

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })
})

