'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function BottomNav() {
  const pathname = usePathname()

  // Don't show bottom nav on login or test pages
  if (pathname === '/login' || pathname === '/test-connection') {
    return null
  }

  const navItems = [
    { href: '/home', label: 'Home', icon: '🏠' },
    { href: '/quests', label: 'Quests', icon: '🎯' },
    { href: '/scan', label: 'Scan', icon: '📱' },
    { href: '/shop', label: 'Shop', icon: '🛍️' },
    { href: '/points', label: 'Points', icon: '🏆' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center 
                  w-full h-full
                  transition-all
                  ${isActive 
                    ? 'bg-black rounded-2xl mx-1 text-white' 
                    : 'text-gray-600 hover:text-black'
                  }
                `}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

