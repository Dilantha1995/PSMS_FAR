import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export interface LogInput {
  action: string;
  entityType: string;
  entityId?: number | null;
  entityLabel?: string | null;
  summary: string;
  details?: Record<string, unknown> | null;
  user?: string;
}

export async function logActivity(input: LogInput): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? null,
      summary: input.summary,
      details: input.details ?? null,
      user: input.user || "system",
    });
  } catch (e) {
    // Never let logging failures break the main operation.
    console.error("Failed to write activity log:", e);
  }
}

export async function recentActivity(limit = 20) {
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

export async function activityForEntity(entityType: string, entityId: number) {
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.entityId, entityId))
    .orderBy(desc(activityLogs.createdAt));
}
