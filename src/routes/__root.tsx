import { HeadContent, Scripts, Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser } from '@clerk/tanstack-start'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getCurrentUserProfile } from '../lib/actions'
import type { UserRecord } from '../types/domain'
import ThemeToggle from '../components/ThemeToggle'
import appCss from '../styles.css?url'

// Fetch the Clerk publishable key
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder'
const signInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL || '/sign-in'
const signUpUrl = import.meta.env.VITE_CLERK_SIGN_UP_URL || '/sign-up'
const signInRedirectUrl = import.meta.env.VITE_CLERK_SIGN_IN_FORCE_REDIRECT_URL || '/dashboard'
const signUpRedirectUrl = import.meta.env.VITE_CLERK_SIGN_UP_FORCE_REDIRECT_URL || '/onboarding'
const themeBootScript = `
(() => {
  try {
    const mode = window.localStorage.getItem('theme') || 'auto'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    if (mode === 'auto') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', mode)
    }
    document.documentElement.style.colorScheme = resolved
  } catch {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  }
})()
`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Kyber Fitness — Kinetic Performance System' },
      {
        name: 'description',
        content: 'Track workouts, health data, and manage client-trainer relationships.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 max-w-md mx-auto relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--primary-container)]/5 rounded-full filter blur-[80px] pointer-events-none"></div>

      <span className="material-symbols-outlined text-[var(--primary-container)] text-6xl mb-6 animate-bounce">
        explore_off
      </span>

      <h1 className="headline-lg font-black tracking-tight text-white mb-2">ROUTE NOT FOUND</h1>
      <p className="body-md text-[var(--on-surface-variant)] mb-8">
        The coordinates you entered do not exist on the Kyber grid. Let's redirect your training
        session back to base.
      </p>

      <Link to="/" className="btn btn-primary px-8 py-3 flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-sm">home</span>
        <span>Return to Base</span>
      </Link>
    </div>
  )
}

function RootDocument() {
  const isClerkConfigured = publishableKey && publishableKey !== 'pk_test_placeholder'

  if (!isClerkConfigured) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
          <HeadContent />
        </head>
        <body
          className="font-sans antialiased selection:bg-[rgba(195,244,0,0.2)] selection:text-[var(--on-surface)]"
          suppressHydrationWarning
        >
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 max-w-lg mx-auto relative">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--primary-container)]/5 rounded-full filter blur-[80px] pointer-events-none"></div>

            <div className="chip mb-6 flex items-center gap-1.5 bg-red-950/40 border border-red-900/30 text-red-400">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>Sync Offline</span>
            </div>

            <h1 className="headline-lg font-black tracking-tight text-white mb-4">
              PORTAL KEYS MISSING
            </h1>
            <p className="body-md text-[var(--on-surface-variant)] mb-8">
              The Kyber portal cannot establish client synchronization because the Clerk Publishable
              Key is missing or set to placeholder. Please configure{' '}
              <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> in your hosting environment.
            </p>
          </div>
          <Scripts />
        </body>
      </html>
    )
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      signInForceRedirectUrl={signInRedirectUrl}
      signUpForceRedirectUrl={signUpRedirectUrl}
      signInFallbackRedirectUrl={signInRedirectUrl}
      signUpFallbackRedirectUrl={signUpRedirectUrl}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
          <HeadContent />
        </head>
        <body
          className="font-sans antialiased selection:bg-[rgba(195,244,0,0.2)] selection:text-white"
          suppressHydrationWarning
        >
          <AppLayout />
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          <Scripts />
        </body>
      </html>
    </ClerkProvider>
  )
}

function AppLayout() {
  const { isSignedIn } = useUser()
  const [dbUser, setDbUser] = useState<UserRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // Check onboarding / db user status
  useEffect(() => {
    if (isSignedIn) {
      getCurrentUserProfile()
        .then((res) => {
          if (res && res.authenticated) {
            setDbUser(res.user || null)
          }
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    } else {
      setDbUser(null)
      setLoading(false)
    }
  }, [isSignedIn])

  return (
    <div className="app-layout">
      {/* Sidebar - Visible only when signed in */}
      <SignedIn>
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl">
              bolt
            </span>
            <div>
              <h1 className="headline-md font-extrabold tracking-tight m-0 text-white leading-none">
                KYBER
              </h1>
              <p className="label-md text-[var(--on-surface-variant)] text-[10px] m-0 tracking-wider">
                KINETIC PERFORMANCE
              </p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <Link to="/dashboard" className="sidebar-link" activeProps={{ className: 'active' }}>
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link to="/workouts" className="sidebar-link" activeProps={{ className: 'active' }}>
              <span className="material-symbols-outlined">fitness_center</span>
              <span>Workouts</span>
            </Link>
            <Link to="/health" className="sidebar-link" activeProps={{ className: 'active' }}>
              <span className="material-symbols-outlined">monitoring</span>
              <span>Health Metrics</span>
            </Link>

            {/* Role-based navigation */}
            {dbUser && dbUser.role === 'trainer' && (
              <>
                <Link to="/clients" className="sidebar-link" activeProps={{ className: 'active' }}>
                  <span className="material-symbols-outlined">groups</span>
                  <span>My Clients</span>
                </Link>
                <Link to="/programs" className="sidebar-link" activeProps={{ className: 'active' }}>
                  <span className="material-symbols-outlined">edit_note</span>
                  <span>Program Builder</span>
                </Link>
              </>
            )}

            {dbUser && dbUser.role === 'individual' && (
              <Link
                to="/my-trainers"
                className="sidebar-link"
                activeProps={{ className: 'active' }}
              >
                <span className="material-symbols-outlined">badge</span>
                <span>My Trainers</span>
              </Link>
            )}

            {dbUser && (
              <Link to="/settings" className="sidebar-link" activeProps={{ className: 'active' }}>
                <span className="material-symbols-outlined">settings</span>
                <span>Settings</span>
              </Link>
            )}

            {!loading && !dbUser && (
              <Link to="/onboarding" className="sidebar-link" activeProps={{ className: 'active' }}>
                <span className="material-symbols-outlined">assignment_ind</span>
                <span>Setup Profile</span>
              </Link>
            )}
          </nav>

          {/* Sidebar Footer with Clerk User Button */}
          <div className="border-t border-[var(--line)] pt-4 flex items-center justify-between mt-auto gap-3">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <div className="text-left">
                <p className="text-xs font-semibold text-[var(--on-surface)] truncate max-w-[150px] m-0">
                  {dbUser?.name || 'Kyber Athlete'}
                </p>
                <p className="text-[10px] text-[var(--on-surface-variant)] capitalize m-0">
                  {dbUser?.role || 'Onboarding'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </aside>
      </SignedIn>

      {/* Main Panel Content */}
      <main className="main-content flex-1">
        {/* Render a top navigation header for public/anonymous users */}
        <SignedOut>
          <header className="flex justify-between items-center py-4 px-6 border-b border-[var(--line)] bg-[var(--surface-container-lowest)] mb-6 rounded-[var(--rounded-lg)]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary-container)] text-2xl">
                bolt
              </span>
              <span className="headline-md font-bold tracking-tight text-[var(--on-surface)] m-0">
                KYBER FITNESS
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/sign-in" className="btn btn-secondary py-1.5 px-4 text-xs">
                Sign In
              </Link>
              <Link to="/sign-up" className="btn btn-primary py-1.5 px-4 text-xs">
                Sign Up
              </Link>
            </div>
          </header>
        </SignedOut>

        <Outlet />
      </main>
    </div>
  )
}
