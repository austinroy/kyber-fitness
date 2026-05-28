import { createFileRoute } from '@tanstack/react-router'
import { SignUp, useUser } from '@clerk/tanstack-start'
import { createPostAuthRedirectUrl, useCleanPostAuthRedirect } from '../../lib/auth-redirects'

const signInRedirectUrl = createPostAuthRedirectUrl('/sign-in', '/dashboard')
const signUpRedirectUrl = createPostAuthRedirectUrl('/sign-up', '/onboarding')

export const Route = createFileRoute('/sign-up/')({
  ssr: false,
  component: SignUpPage,
})

function SignUpPage() {
  const { isLoaded, isSignedIn } = useUser()
  useCleanPostAuthRedirect(isSignedIn)

  if (isLoaded && isSignedIn) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--secondary-container)]" />
        <p className="body-md text-[var(--on-surface-variant)]">Finalizing secure redirect...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--secondary-container)]/5 rounded-full filter blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md flex flex-col items-center gap-6 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[var(--secondary-container)] text-3xl">
            bolt
          </span>
          <span className="headline-lg font-black tracking-tight text-white m-0">
            CREATE PORTAL
          </span>
        </div>

        <div className="border border-white/5 rounded-[var(--rounded-lg)] bg-[var(--surface-container)] p-2 shadow-2xl">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl={signUpRedirectUrl}
            signInForceRedirectUrl={signInRedirectUrl}
            fallbackRedirectUrl={signUpRedirectUrl}
            signInFallbackRedirectUrl={signInRedirectUrl}
          />
        </div>
      </div>
    </div>
  )
}
