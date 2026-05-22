import { getContext } from 'unctx'

// Shim globalThis.app for Vinxi/Nitro asyncContext compatibility
const globalApp = (globalThis as any).app || {}
globalApp.config = globalApp.config || {}
globalApp.config.server = globalApp.config.server || {}
if (globalApp.config.server.experimental === undefined) {
  globalApp.config.server.experimental = { asyncContext: true }
}
;(globalThis as any).app = globalApp

// Retrieve the Nitro app context and set a fallback mock event singleton
// so that Clerk's initialization/eval queries do not throw "Context is not available"
try {
  const nitroAppCtx = getContext('nitro-app')
  if (nitroAppCtx) {
    const mockEvent = {
      __is_event__: true,
      context: {},
      node: {
        req: {},
        res: {},
      },
    }
    nitroAppCtx.set({ event: mockEvent }, true)
  }
} catch (e) {
  console.warn('Failed to register nitro-app context shim:', e)
}

export {}
