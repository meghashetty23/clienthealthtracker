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
    <nav className="bg-[#27272A] border-b border-[#3F3F46] px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-gray-100">
            Health Tracker
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/clients"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive('/clients')
                  ? 'bg-[#1E1B4B] text-[#818CF8]'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-[#1F1F23]'
              }`}
            >
              Clients
            </Link>
            <Link
              href="/overview"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === '/overview'
                  ? 'bg-[#1E1B4B] text-[#818CF8]'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-[#1F1F23]'
              }`}
            >
              Overview
            </Link>
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'bg-[#1E1B4B] text-[#818CF8]'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-[#1F1F23]'
              }`}
            >
              Alerts
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
