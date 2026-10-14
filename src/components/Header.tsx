import { Link } from '@tanstack/react-router'
import { SignedIn, SignedOut, UserButton } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import type { UserRecord } from '../types/domain'

interface HeaderProps {
  dbUser?: UserRecord | null
  receivedNotifications?: number
  preferredLayout?: 'floating' | 'full-bleed'
}

export default function Header({
  dbUser,
  receivedNotifications = 0,
  preferredLayout,
}: HeaderProps) {
  const [layout, setLayout] = useState<'floating' | 'full-bleed'>(() => {
    if (preferredLayout) return preferredLayout
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('kyber_header_layout')
      if (stored === 'full-bleed' || stored === 'floating') return stored
    }
    return 'floating'
  })

  useEffect(() => {
    if (preferredLayout) {
      setLayout(preferredLayout)
      return
    }

    const handler = () => {
      const stored = window.localStorage.getItem('kyber_header_layout')
      if (stored === 'full-bleed' || stored === 'floating') {
        setLayout(stored)
      }
    }

    window.addEventListener('storage', handler)
    window.addEventListener('kyber_header_layout_change', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('kyber_header_layout_change', handler)
    }
  }, [preferredLayout])

  const isFloating = layout === 'floating'

  return (
    <div
      className={
        isFloating
          ? 'sticky top-3 z-50 px-4 mb-6 transition-all duration-300'
          : 'sticky top-0 z-50 w-full mb-6 transition-all duration-300'
      }
    >
      <header
        className={
          isFloating
            ? 'max-w-6xl mx-auto px-4 sm:px-6 py-2.5 rounded-2xl bg-[#0D1018]/85 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-center justify-between transition-all duration-300'
            : 'w-full px-4 sm:px-8 py-3 bg-[#0A0D14]/90 backdrop-blur-md border-b border-white/10 shadow-md flex items-center justify-between transition-all duration-300'
        }
      >
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4FF00] to-[#00F0FF] p-[2px] shadow-[0_0_15px_rgba(212,255,0,0.35)] transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#0A0D14] rounded-[10px] flex items-center justify-center font-black text-xs text-[#D4FF00]">
              ⚡
            </div>
          </div>
          <div className="flex items-center">
            <span className="font-display font-black text-lg tracking-tight text-white group-hover:text-zinc-100 transition">
              KYBER
            </span>
            <span className="text-[#D4FF00] font-black text-lg">.FIT</span>
          </div>
        </Link>

        {/* Center Links (Signed In) */}
        <SignedIn>
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 text-xs font-semibold">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
              activeProps={{
                className:
                  'px-3 py-1.5 rounded-lg bg-[#D4FF00] text-black font-extrabold shadow-sm',
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/workouts"
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
              activeProps={{
                className:
                  'px-3 py-1.5 rounded-lg bg-[#D4FF00] text-black font-extrabold shadow-sm',
              }}
            >
              Workouts
            </Link>
            <Link
              to="/health"
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
              activeProps={{
                className:
                  'px-3 py-1.5 rounded-lg bg-[#00F0FF] text-black font-extrabold shadow-sm',
              }}
            >
              Health
            </Link>
            {dbUser?.role === 'trainer' ? (
              <>
                <Link
                  to="/clients"
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
                  activeProps={{
                    className:
                      'px-3 py-1.5 rounded-lg bg-[#00F0FF] text-black font-extrabold shadow-sm',
                  }}
                >
                  Clients
                </Link>
                <Link
                  to="/programs"
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
                  activeProps={{
                    className:
                      'px-3 py-1.5 rounded-lg bg-[#00F0FF] text-black font-extrabold shadow-sm',
                  }}
                >
                  Programs
                </Link>
              </>
            ) : (
              <Link
                to="/programs"
                className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
                activeProps={{
                  className:
                    'px-3 py-1.5 rounded-lg bg-[#00F0FF] text-black font-extrabold shadow-sm',
                }}
              >
                My Plans
              </Link>
            )}
          </nav>
        </SignedIn>

        {/* Center Links (Signed Out / Public) */}
        <SignedOut>
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300">
            <a href="#features" className="hover:text-[#D4FF00] transition">
              Features
            </a>
            <a href="#coaching" className="hover:text-[#00F0FF] transition">
              Coaching
            </a>
            <a href="#telemetry" className="hover:text-[#D4FF00] transition">
              Progress
            </a>
          </nav>
        </SignedOut>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <SignedIn>
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-zinc-300 hover:text-white transition"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-lg">notifications</span>
              {receivedNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00F0FF] text-black text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_#00F0FF]">
                  {receivedNotifications}
                </span>
              )}
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <div className="flex items-center gap-2">
              <Link
                to="/sign-in"
                className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="btn btn-primary text-xs !py-2 px-4 shadow-[0_0_16px_rgba(212,255,0,0.3)]"
              >
                Sign Up
              </Link>
            </div>
          </SignedOut>
        </div>
      </header>
    </div>
  )
}
