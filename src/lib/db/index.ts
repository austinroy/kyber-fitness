import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

// Check if running in a serverless/Netlify environment
const isServerless =
  process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV

let dbPath = path.resolve(process.cwd(), 'fitness.db')

if (isServerless) {
  const tmpPath = path.resolve('/tmp', 'fitness.db')

  try {
    // Copy the bundled seed database to /tmp if not already initialized
    if (!fs.existsSync(tmpPath)) {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpPath)
        console.log('Successfully copied bundled fitness.db to writable /tmp')
      } else {
        // Fallback: search in potential bundle paths relative to the server module
        const fallbackPath = path.resolve(__dirname, 'fitness.db')
        if (fs.existsSync(fallbackPath)) {
          fs.copyFileSync(fallbackPath, tmpPath)
          console.log('Successfully copied fallback fitness.db to writable /tmp')
        } else {
          console.warn('Could not locate base fitness.db for copying to /tmp')
        }
      }
    }
    dbPath = tmpPath
  } catch (err) {
    console.error('Failed to copy database to writable /tmp directory:', err)
  }
}

const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
