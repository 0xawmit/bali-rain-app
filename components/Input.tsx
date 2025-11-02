import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-base font-medium text-gray-900 mb-3 tracking-tight">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-6 py-5 
          bg-white
          border-2 rounded-2xl
          text-gray-900 text-lg placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-black focus:border-black
          transition-all duration-200
          ${error ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}
          disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-50
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-3 text-base text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-3 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
  }
)

Input.displayName = 'Input'

export default Input

