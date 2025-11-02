import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
  glow?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false,
  glow = false
}: CardProps) {
  const paddingClasses = {
    sm: 'p-6',
    md: 'p-10',
    lg: 'p-14'
  }

  return (
    <div className={`
      bg-white rounded-3xl border border-gray-100 shadow-sm
      ${paddingClasses[padding]}
      ${hover ? 'hover:shadow-md cursor-pointer transition-all duration-200' : ''}
      ${glow ? 'shadow-lg' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}




