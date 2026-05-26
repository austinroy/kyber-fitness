import { defineConfig } from 'drizzle-kit'

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: tursoDatabaseUrl ? 'turso' : 'sqlite',
  dbCredentials: tursoDatabaseUrl
    ? {
        url: tursoDatabaseUrl,
        authToken: tursoAuthToken,
      }
    : {
        url:
          process.env.KYBER_DATABASE_PATH ||
          process.env.FITNESS_DATABASE_PATH ||
          process.env.SQLITE_DATABASE_PATH ||
          'fitness.db',
      },
})
