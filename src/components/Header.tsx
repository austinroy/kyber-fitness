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

  const [mobileOpen, setMobileOpen] = useState(false)

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

  // Lock body scroll and listen for Escape when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileOpen(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = originalOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [mobileOpen])

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
            ? 'max-w-6xl mx-auto px-4 sm:px-6 py-2.5 rounded-2xl bg-white/80 dark:bg-[#0D1018]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-center justify-between transition-all duration-300'
            : 'w-full px-4 sm:px-8 py-3 bg-white/90 dark:bg-[#0A0D14]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-sm dark:shadow-md flex items-center justify-between transition-all duration-300'
        }
      >
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-lime-500 to-cyan-500 dark:from-[#D4FF00] dark:to-[#00F0FF] p-[2px] shadow-[0_0_15px_rgba(212,255,0,0.35)] transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-slate-900 dark:bg-[#0A0D14] rounded-[10px] flex items-center justify-center font-black text-xs text-[#D4FF00]">
              ⚡
            </div>
          </div>
          <div className="flex items-center">
            <span className="font-display font-black text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-zinc-100 transition">
              KYBER
            </span>
            <span className="text-lime-600 dark:text-[#D4FF00] font-black text-lg">.FIT</span>
          </div>
        </Link>

        {/* Center Links (Signed In) */}
        <SignedIn>
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.03] p-1 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-semibold">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition"
              activeProps={{
                className:
                  'px-3 py-1.5 rounded-lg bg-[#D4FF00] text-black font-extrabold shadow-sm',
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/workouts"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition"
              activeProps={{
                className:
                  'px-3 py-1.5 rounded-lg bg-[#D4FF00] text-black font-extrabold shadow-sm',
              }}
            >
              Workouts
            </Link>
            <Link
              to="/health"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition"
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
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition"
                  activeProps={{
                    className:
                      'px-3 py-1.5 rounded-lg bg-[#00F0FF] text-black font-extrabold shadow-sm',
                  }}
                >
                  Clients
                </Link>
                <Link
                  to="/programs"
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition"
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
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition"
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
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-zinc-300">
            <a
              href="#features"
              className="hover:text-lime-700 dark:hover:text-[#D4FF00] transition"
            >
              Features
            </a>
            <a
              href="#coaching"
              className="hover:text-cyan-700 dark:hover:text-[#00F0FF] transition"
            >
              Coaching
            </a>
            <a
              href="#telemetry"
              className="hover:text-lime-700 dark:hover:text-[#D4FF00] transition"
            >
              Progress
            </a>
          </nav>
        </SignedOut>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <SignedIn>
            <Link
              to="/notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition hover:-translate-y-0.5"
              title="Notifications"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-lg">notifications</span>
              {receivedNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 dark:bg-[#00F0FF] text-white dark:text-black text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_#00F0FF]">
                  {receivedNotifications}
                </span>
              )}
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/sign-in"
                className="text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="btn btn-primary text-xs !py-2 px-4 shadow-sm dark:shadow-[0_0_16px_rgba(212,255,0,0.3)]"
              >
                Sign Up
              </Link>
            </div>
          </SignedOut>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer & Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        aria-label="Mobile Navigation Drawer"
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 sm:w-80 bg-white dark:bg-[#0C101A] border-l border-slate-200 dark:border-white/10 shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden pb-[max(1.5rem,env(safe-area-inset-bottom))] ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-lime-500 to-cyan-500 dark:from-[#D4FF00] dark:to-[#00F0FF] p-[2px] shadow-[0_0_15px_rgba(212,255,0,0.35)]">
                <div className="w-full h-full bg-slate-900 dark:bg-[#0A0D14] rounded-[10px] flex items-center justify-center font-black text-xs text-[#D4FF00]">
                  ⚡
                </div>
              </div>
              <span className="font-display font-black text-lg tracking-tight text-slate-900 dark:text-white">
                KYBER<span className="text-lime-600 dark:text-[#D4FF00]">.FIT</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close mobile navigation"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-300 transition"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="flex flex-col gap-1">
            <SignedIn>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-lime-500/15 dark:bg-[#D4FF00]/15 text-lime-800 dark:text-[#D4FF00] border-l-2 border-lime-600 dark:border-[#D4FF00]',
                }}
              >
                <span className="material-symbols-outlined text-lg">dashboard</span>
                <span>Dashboard</span>
              </Link>
              <Link
                to="/workouts"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-lime-500/15 dark:bg-[#D4FF00]/15 text-lime-800 dark:text-[#D4FF00] border-l-2 border-lime-600 dark:border-[#D4FF00]',
                }}
              >
                <span className="material-symbols-outlined text-lg">fitness_center</span>
                <span>Workouts</span>
              </Link>
              <Link
                to="/health"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-cyan-800 dark:text-[#00F0FF] bg-cyan-500/15 dark:bg-[#00F0FF]/15 border-l-2 border-cyan-600 dark:border-[#00F0FF]',
                }}
              >
                <span className="material-symbols-outlined text-lg">monitoring</span>
                <span>Health & Vitals</span>
              </Link>

              {dbUser?.role === 'trainer' ? (
                <>
                  <Link
                    to="/clients"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                    activeProps={{
                      className:
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-cyan-800 dark:text-[#00F0FF] bg-cyan-500/15 dark:bg-[#00F0FF]/15 border-l-2 border-cyan-600 dark:border-[#00F0FF]',
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">groups</span>
                    <span>Client Roster</span>
                  </Link>
                  <Link
                    to="/programs"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                    activeProps={{
                      className:
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-cyan-800 dark:text-[#00F0FF] bg-cyan-500/15 dark:bg-[#00F0FF]/15 border-l-2 border-cyan-600 dark:border-[#00F0FF]',
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">splitscreen</span>
                    <span>Workout Programs</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/programs"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                    activeProps={{
                      className:
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-cyan-800 dark:text-[#00F0FF] bg-cyan-500/15 dark:bg-[#00F0FF]/15 border-l-2 border-cyan-600 dark:border-[#00F0FF]',
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">splitscreen</span>
                    <span>My Programs</span>
                  </Link>
                  <Link
                    to="/my-trainers"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                    activeProps={{
                      className:
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-cyan-800 dark:text-[#00F0FF] bg-cyan-500/15 dark:bg-[#00F0FF]/15 border-l-2 border-cyan-600 dark:border-[#00F0FF]',
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">badge</span>
                    <span>My Coaches</span>
                  </Link>
                </>
              )}

              <div className="my-2 border-t border-slate-200 dark:border-white/10" />

              <Link
                to="/notifications"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                activeProps={{
                  className:
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-950 dark:text-white bg-slate-100 dark:bg-white/10',
                }}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">notifications</span>
                  <span>Notifications</span>
                </span>
                {receivedNotifications > 0 && (
                  <span className="rounded-full bg-cyan-500 dark:bg-[#00F0FF] px-2 py-0.5 text-[10px] font-black text-white dark:text-black">
                    {receivedNotifications}
                  </span>
                )}
              </Link>

              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-950 dark:text-white bg-slate-100 dark:bg-white/10',
                }}
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                <span>Settings</span>
              </Link>
            </SignedIn>

            <SignedOut>
              <a
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
              >
                <span className="material-symbols-outlined text-lg">bolt</span>
                <span>Features</span>
              </a>
              <a
                href="#coaching"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
              >
                <span className="material-symbols-outlined text-lg">sports</span>
                <span>Coaching</span>
              </a>
              <a
                href="#telemetry"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
              >
                <span className="material-symbols-outlined text-lg">trending_up</span>
                <span>Progress</span>
              </a>

              <div className="my-3 border-t border-slate-200 dark:border-white/10" />

              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-secondary w-full text-xs justify-center py-2.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary w-full text-xs justify-center py-2.5"
                >
                  Sign Up
                </Link>
              </div>
            </SignedOut>
          </nav>
        </div>

        {/* Drawer Bottom User Info */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10">
          <SignedIn>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <UserButton afterSignOutUrl="/" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate m-0">
                    {dbUser?.name || 'Athlete'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 capitalize m-0">
                    {dbUser?.role || 'User'}
                  </p>
                </div>
              </div>
            </div>
          </SignedIn>
          <SignedOut>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 m-0 text-center font-mono">
              KYBER FITNESS © 2026
            </p>
          </SignedOut>
        </div>
      </aside>
    </div>
  )
}
