import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url:
      process.env.KYBER_DATABASE_PATH ||
      process.env.FITNESS_DATABASE_PATH ||
      process.env.SQLITE_DATABASE_PATH ||
      'fitness.db',
  },
})
