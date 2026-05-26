import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/tanstack-start'

export const Route = createFileRoute('/sign-in/')({
  ssr: false,
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--primary-container)]/5 rounded-full filter blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md flex flex-col items-center gap-6 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl">
            bolt
          </span>
          <span className="headline-lg font-black tracking-tight text-white m-0">KYBER PORTAL</span>
        </div>

        <div className="border border-white/5 rounded-[var(--rounded-lg)] bg-[var(--surface-container)] p-2 shadow-2xl">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/dashboard"
            signUpForceRedirectUrl="/onboarding"
            fallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/onboarding"
          />
        </div>
      </div>
    </div>
  )
}
