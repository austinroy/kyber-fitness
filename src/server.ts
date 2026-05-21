import './shim'
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import type { Register } from '@tanstack/react-router'
import type { RequestHandler } from '@tanstack/react-start/server'
import { createClerkHandler } from '@clerk/tanstack-start/server'

// Create the custom server fetch handler wrapped with Clerk
const fetch = createClerkHandler(createStartHandler)(defaultStreamHandler)

// Providing RequestHandler is required so that output types are resolved correctly
export type ServerEntry = { fetch: RequestHandler<Register> }

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      return await entry.fetch(...args)
    },
  }
}

export default createServerEntry({ fetch })
