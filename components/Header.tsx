'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Participant } from '@/lib/types'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<Participant | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('pesach_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const navLinks = [
    { href: '/', label: 'בית', icon: '🏠' },
    { href: '/learn', label: 'לימוד יומי', icon: '📖' },
    { href: '/leaderboard', label: 'לוח מובילים', icon: '🏆' },
  ]

  return (
    <header className="sticky top-0 z-50 glass border-b border-blue-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex-shrink-0 relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border border-ba-blue-100 group-hover:scale-105 transition-transform bg-white">
                <Image src="/logo.jpg" alt="ישיבת בני עקיבא עלי" width={48} height={48} className="w-full h-full object-contain" priority />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-ba-blue-800 text-sm leading-tight">חידון הלכות פסח</div>
              <div className="text-ba-blue-500 text-xs">ישיבת בני עקיבא עלי • תשפ"ו</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  pathname === link.href
                    ? 'bg-ba-blue-700 text-white shadow-md'
                    : 'text-ba-blue-700 hover:bg-ba-blue-50'
                }`}
              >
                <span className="ml-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User area */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden sm:flex items-center gap-2 bg-ba-blue-50 rounded-xl px-3 py-2 border border-ba-blue-200">
                <div className="w-7 h-7 bg-ba-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user.name.charAt(0)}</span>
                </div>
                <div className="text-right">
                  <div className="text-ba-blue-800 font-bold text-xs">{user.name}</div>
                  <div className="text-ba-blue-500 text-xs">{user.total_points} נקודות</div>
                </div>
              </div>
            ) : (
              <Link href="/register" className="btn-primary !py-2 !px-4 !text-sm hidden sm:flex">
                הרשמה
              </Link>
            )}

            {/* Mobile menu btn */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-ba-blue-50"
            >
              <span className={`block w-5 h-0.5 bg-ba-blue-700 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-ba-blue-700 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-ba-blue-700 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-blue-100 animate-fade-in">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 font-medium transition-all ${
                  pathname === link.href ? 'bg-ba-blue-700 text-white' : 'text-ba-blue-700 hover:bg-ba-blue-50'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary block text-center mt-2">
                הרשמה לחידון
              </Link>
            )}
            {user && (
              <div className="mt-3 p-3 bg-ba-blue-50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-ba-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{user.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="font-bold text-ba-blue-800">{user.name}</div>
                  <div className="text-ba-blue-500 text-sm">{user.total_points} נקודות • {user.class}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
