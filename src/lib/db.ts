import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from '@/db/schema';

// Use the Vercel Postgres pool
export const db = drizzle(sql, { schema });
