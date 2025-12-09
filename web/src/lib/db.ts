import { Pool } from "pg";
import { DATABASE_URL } from "./env";

// Shared PostgreSQL pool for server-side routes.
export const db = new Pool({
  connectionString: DATABASE_URL,
});

export default db;

