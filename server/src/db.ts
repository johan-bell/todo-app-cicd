import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Single-table schema. Kept inline (not a .sql file) so nothing extra needs to
// be copied into the runtime image. `IF NOT EXISTS` makes it safe to run on
// every boot.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS todos (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    completed  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

/**
 * Apply the schema. Retries because Postgres can still be starting up when the
 * API boots. Compose already waits for the db healthcheck, but this is a cheap
 * extra guard against races.
 */
export async function runMigrations(retries = 10, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(SCHEMA);
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`DB not ready (attempt ${attempt}/${retries}); retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
