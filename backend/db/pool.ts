import { Pool } from "pg";

let pool: Pool | null = null;

export function getPoolOptional(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
  }

  return pool;
}

export function getPool(): Pool {
  const p = getPoolOptional();
  if (!p) throw new Error("DATABASE_URL is not set");
  return p;
}
