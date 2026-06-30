'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/clients') return pathname === '/clients' || pathname.startsWith('/clients/')
    return pathname === path
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Health Tracker
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/clients"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive('/clients')
                  ? 'bg-[#EEF2FF] text-[#4F46E5]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-[#F3F4F6]'
              }`}
            >
              Clients
            </Link>
            <Link
              href="/overview"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === '/overview'
                  ? 'bg-[#EEF2FF] text-[#4F46E5]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-[#F3F4F6]'
              }`}
            >
              Overview
            </Link>
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'bg-[#EEF2FF] text-[#4F46E5]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-[#F3F4F6]'
              }`}
            >
              Alerts
            </Link>
            <Link
              href="/performance"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === '/performance'
                  ? 'bg-[#EEF2FF] text-[#4F46E5]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-[#F3F4F6]'
              }`}
            >
              Performance
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
