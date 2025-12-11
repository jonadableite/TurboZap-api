import { Pool } from "pg";
import { DATABASE_URL } from "./env";

// Shared PostgreSQL pool for server-side routes.
// During build time, create a dummy pool that won't be used
// The actual pool will be created at runtime when DATABASE_URL is available
let db: Pool;

// Check if we're in build phase
const isBuildPhase = 
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development";

if (isBuildPhase || !DATABASE_URL || DATABASE_URL.trim() === "") {
  // During build, create a minimal pool that won't actually connect
  // This prevents errors during build but won't work at runtime
  db = new Pool({
    connectionString: "postgres://dummy:dummy@localhost:5432/dummy",
  });
  // Mark as dummy so we know it's not real
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db as any)._isDummy = true;
} else {
  // Runtime: create real pool
  db = new Pool({
    connectionString: DATABASE_URL,
  });
}

export { db };
export default db;

