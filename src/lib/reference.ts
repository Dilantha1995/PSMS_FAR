import { sql } from "drizzle-orm";
import { db } from "@/db";
import { counters } from "@/db/schema";

export type RefKind = "DISPOSAL" | "TRANSFER";

const PREFIX: Record<RefKind, string> = {
  DISPOSAL: "FA-DSP",
  TRANSFER: "FA-TRF",
};

/**
 * Generates the next sequential reference number for a document kind, e.g.
 *   PSMS/FA-DSP/2026/0001
 * Uses an atomic upsert on the counters table so numbers never collide.
 */
export async function nextReference(kind: RefKind, year = new Date().getFullYear()): Promise<string> {
  const key = `${kind}-${year}`;
  const rows = await db
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({
      target: counters.key,
      set: { value: sql`${counters.value} + 1` },
    })
    .returning({ value: counters.value });

  const seq = rows[0]?.value ?? 1;
  const padded = String(seq).padStart(4, "0");
  return `PSMS/${PREFIX[kind]}/${year}/${padded}`;
}
