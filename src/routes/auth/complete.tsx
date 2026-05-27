import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth/complete')({
  ssr: false,
  component: AuthCompletePage,
})

const allowedTargets = new Set(['/dashboard', '/onboarding'])

function getSafeTarget() {
  const target = new URLSearchParams(window.location.search).get('target') || '/dashboard'
  return allowedTargets.has(target) ? target : '/dashboard'
}

function AuthCompletePage() {
  useEffect(() => {
    const target = getSafeTarget()
    window.history.replaceState(null, '', '/auth/complete')
    window.location.replace(target)
  }, [])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--primary-container)]" />
      <p className="body-md text-[var(--on-surface-variant)]">Finalizing secure redirect...</p>
    </div>
  )
}
