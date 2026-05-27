import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/tanstack-start'

const signInRedirectUrl = '/auth/complete?target=%2Fdashboard'
const signUpRedirectUrl = '/auth/complete?target=%2Fonboarding'

export const Route = createFileRoute('/sign-up/$')({
  ssr: false,
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Mesh glow */}
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

        {/* Custom styling container for Clerk */}
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
