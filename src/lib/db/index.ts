import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Store SQLite database file in the project root
const dbPath = path.resolve(process.cwd(), 'fitness.db');

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
