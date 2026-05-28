import { HeadContent, Scripts, Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser } from '@clerk/tanstack-start'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getCurrentUserProfile, getUnreadNotificationCount } from '../lib/actions'
import type { UserRecord } from '../types/domain'
import ThemeToggle from '../components/ThemeToggle'
import { createPostAuthRedirectUrl } from '../lib/auth-redirects'
import appCss from '../styles.css?url'

// Fetch the Clerk publishable key
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder'
const signInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL || '/sign-in'
const signUpUrl = import.meta.env.VITE_CLERK_SIGN_UP_URL || '/sign-up'
const signInFinalRedirectUrl = import.meta.env.VITE_CLERK_SIGN_IN_FORCE_REDIRECT_URL || '/dashboard'
const signUpFinalRedirectUrl =
  import.meta.env.VITE_CLERK_SIGN_UP_FORCE_REDIRECT_URL || '/onboarding'
const signInRedirectUrl = createPostAuthRedirectUrl(signInUrl, signInFinalRedirectUrl)
const signUpRedirectUrl = createPostAuthRedirectUrl(signUpUrl, signUpFinalRedirectUrl)
let cachedNavAuthState: {
  clerkUserId: string
  dbUser: UserRecord | null
  unreadNotifications: number
} | null = null
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
  const { isLoaded, isSignedIn, user } = useUser()
  const clerkUserId = user?.id
  const [dbUser, setDbUser] = useState<UserRecord | null>(() => {
    return cachedNavAuthState?.dbUser || null
  })
  const [loading, setLoading] = useState(() => !cachedNavAuthState)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    return cachedNavAuthState?.unreadNotifications || 0
  })

  // Check onboarding / db user status
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !clerkUserId) {
      cachedNavAuthState = null
      setDbUser(null)
      setUnreadNotifications(0)
      setLoading(false)
      return
    }

    let cancelled = false

    if (cachedNavAuthState?.clerkUserId === clerkUserId) {
      setDbUser(cachedNavAuthState.dbUser)
      setUnreadNotifications(cachedNavAuthState.unreadNotifications)
      setLoading(false)
      return
    }

    setDbUser(null)
    setUnreadNotifications(0)
    setLoading(true)

    getCurrentUserProfile()
      .then(async (res) => {
        if (cancelled) return

        if (res && res.authenticated) {
          const nextDbUser = res.user || null
          let nextUnreadNotifications = 0

          if (nextDbUser) {
            try {
              nextUnreadNotifications = (await getUnreadNotificationCount()) || 0
            } catch {
              nextUnreadNotifications = 0
            }
          }

          cachedNavAuthState = {
            clerkUserId,
            dbUser: nextDbUser,
            unreadNotifications: nextUnreadNotifications,
          }
          setDbUser(nextDbUser)
          setUnreadNotifications(nextUnreadNotifications)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, clerkUserId])

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  const canRenderSignedInNav = isLoaded && isSignedIn && !loading

  return (
    <div className="app-layout">
      {/* Sidebar - Visible only when signed in */}
      <SignedIn>
        {canRenderSignedInNav && (
          <>
            <header className="mobile-nav-header">
              <button
                type="button"
                className="mobile-menu-button"
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
              >
                <span className="material-symbols-outlined">menu</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary-container)] text-2xl">
                  bolt
                </span>
                <span className="headline-md text-lg font-extrabold tracking-tight m-0 text-[var(--on-surface)]">
                  KYBER
                </span>
              </div>

              <ThemeToggle />
            </header>

            <div
              className={`mobile-nav-backdrop ${mobileNavOpen ? 'open' : ''}`}
              onClick={() => setMobileNavOpen(false)}
            />

            <aside className={`mobile-nav-drawer ${mobileNavOpen ? 'open' : ''}`}>
              <div className="sidebar-header">
                <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl">
                  bolt
                </span>
                <div>
                  <h1 className="headline-md font-extrabold tracking-tight m-0 text-[var(--on-surface)] leading-none">
                    KYBER
                  </h1>
                  <p className="label-md text-[var(--on-surface-variant)] text-[10px] m-0 tracking-wider">
                    KINETIC PERFORMANCE
                  </p>
                </div>
                <button
                  type="button"
                  className="mobile-menu-button ml-auto"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <nav className="sidebar-nav mobile-drawer-nav">
                <NavLinks
                  dbUser={dbUser}
                  unreadNotifications={unreadNotifications}
                  loading={loading}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </nav>

              <SidebarFooter dbUser={dbUser} />
            </aside>

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
                <NavLinks
                  dbUser={dbUser}
                  unreadNotifications={unreadNotifications}
                  loading={loading}
                />
              </nav>

              {/* Sidebar Footer with Clerk User Button */}
              <SidebarFooter dbUser={dbUser} />
            </aside>
          </>
        )}
      </SignedIn>

      {/* Main Panel Content */}
      <main className="main-content flex-1">
        {/* Render a top navigation header for public/anonymous users */}
        <SignedOut>
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4 px-4 sm:px-6 border-b border-[var(--line)] bg-[var(--surface-container-lowest)] mb-6 rounded-[var(--rounded-lg)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[var(--primary-container)] text-2xl">
                bolt
              </span>
              <span className="headline-md font-bold tracking-tight text-[var(--on-surface)] m-0 text-lg sm:text-2xl truncate">
                KYBER FITNESS
              </span>
            </div>
            <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)] sm:flex sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="h-9 w-9 shrink-0">
                <ThemeToggle />
              </div>
              <Link to="/sign-in" className="btn btn-secondary py-1.5 px-3 sm:px-4 text-xs w-full">
                Sign In
              </Link>
              <Link to="/sign-up" className="btn btn-secondary py-1.5 px-3 sm:px-4 text-xs w-full">
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

function NavLinks({
  dbUser,
  unreadNotifications,
  loading,
  onNavigate,
}: {
  dbUser: UserRecord | null
  unreadNotifications: number
  loading: boolean
  onNavigate?: () => void
}) {
  return (
    <>
      <Link
        to="/dashboard"
        className="sidebar-link"
        activeProps={{ className: 'active' }}
        onClick={onNavigate}
      >
        <span className="material-symbols-outlined">dashboard</span>
        <span>Dashboard</span>
      </Link>
      <Link
        to="/workouts"
        className="sidebar-link"
        activeProps={{ className: 'active' }}
        onClick={onNavigate}
      >
        <span className="material-symbols-outlined">fitness_center</span>
        <span>Workouts</span>
      </Link>
      <Link
        to="/health"
        className="sidebar-link"
        activeProps={{ className: 'active' }}
        onClick={onNavigate}
      >
        <span className="material-symbols-outlined">monitoring</span>
        <span>Health Metrics</span>
      </Link>

      {dbUser && dbUser.role === 'trainer' && (
        <>
          <Link
            to="/clients"
            className="sidebar-link"
            activeProps={{ className: 'active' }}
            onClick={onNavigate}
          >
            <span className="material-symbols-outlined">groups</span>
            <span>My Clients</span>
          </Link>
          <Link
            to="/programs"
            className="sidebar-link"
            activeProps={{ className: 'active' }}
            onClick={onNavigate}
          >
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
          onClick={onNavigate}
        >
          <span className="material-symbols-outlined">badge</span>
          <span>My Trainers</span>
        </Link>
      )}

      {dbUser && (
        <Link
          to="/notifications"
          className="sidebar-link"
          activeProps={{ className: 'active' }}
          onClick={onNavigate}
        >
          <span className="material-symbols-outlined">notifications</span>
          <span>Notifications</span>
          {unreadNotifications > 0 && (
            <span className="ml-auto rounded-full bg-[var(--secondary-container)] px-2 py-0.5 text-[10px] font-black text-black">
              {unreadNotifications}
            </span>
          )}
        </Link>
      )}

      {dbUser && (
        <Link
          to="/settings"
          className="sidebar-link"
          activeProps={{ className: 'active' }}
          onClick={onNavigate}
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </Link>
      )}

      {!loading && !dbUser && (
        <Link
          to="/onboarding"
          className="sidebar-link"
          activeProps={{ className: 'active' }}
          onClick={onNavigate}
        >
          <span className="material-symbols-outlined">assignment_ind</span>
          <span>Setup Profile</span>
        </Link>
      )}
    </>
  )
}

function SidebarFooter({ dbUser }: { dbUser: UserRecord | null }) {
  return (
    <div className="border-t border-[var(--line)] pt-4 flex items-center justify-between mt-auto gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <UserButton afterSignOutUrl="/" />
        <div className="text-left min-w-0">
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
  )
}
