import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  // Surface a clear message instead of a cryptic crash on Vercel.
  console.error("DATABASE_URL is not set. Configure it in your environment / Vercel project settings.");
}

// neon() only needs the URL string; it does not open a socket at import time,
// so this is safe during build. A placeholder keeps build-time type checks happy.
const sql = neon(connectionString || "postgresql://placeholder:placeholder@localhost/placeholder");

export const db = drizzle(sql, { schema });
export { schema };
