import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN
const configuredDbPath =
  process.env.KYBER_DATABASE_PATH ||
  process.env.FITNESS_DATABASE_PATH ||
  process.env.SQLITE_DATABASE_PATH

function getDatabaseUrl() {
  if (tursoDatabaseUrl) {
    if (!tursoAuthToken && /^(libsql|https):\/\//.test(tursoDatabaseUrl)) {
      throw new Error('TURSO_AUTH_TOKEN or LIBSQL_AUTH_TOKEN is required for remote Turso/libSQL.')
    }

    return tursoDatabaseUrl
  }

  const dbPath = path.resolve(configuredDbPath || path.resolve(process.cwd(), 'fitness.db'))
  const dbDir = path.dirname(dbPath)

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  return pathToFileURL(dbPath).href
}

const client = createClient({
  url: getDatabaseUrl(),
  authToken: tursoAuthToken,
})

export const db = drizzle(client, { schema })
