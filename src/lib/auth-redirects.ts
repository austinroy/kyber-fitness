import { useEffect } from 'react'

const postAuthTargetParam = 'kyber_post_auth_target'
const allowedPostAuthTargets = new Set(['/dashboard', '/onboarding'])

export function createPostAuthRedirectUrl(authPath: string, finalTarget: string) {
  const target = allowedPostAuthTargets.has(finalTarget) ? finalTarget : '/dashboard'
  const params = new URLSearchParams({ [postAuthTargetParam]: target })
  return `${authPath}?${params.toString()}`
}

export function useCleanPostAuthRedirect(isSignedIn: boolean | undefined) {
  useEffect(() => {
    if (!isSignedIn) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const target = params.get(postAuthTargetParam)
    if (!target) {
      return
    }

    const safeTarget = allowedPostAuthTargets.has(target) ? target : '/dashboard'
    window.history.replaceState(null, '', window.location.pathname)
    window.location.replace(safeTarget)
  }, [isSignedIn])
}
