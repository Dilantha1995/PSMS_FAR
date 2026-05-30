import { db } from "@/db";
import { settings } from "@/db/schema";
import { inArray } from "drizzle-orm";

export interface CodingSettings {
  prefix: string;
  separator: string;
  padding: number;
}

export const DEFAULT_CODING: CodingSettings = { prefix: "PSMS", separator: "/", padding: 3 };

const KEYS = ["code_prefix", "code_separator", "code_padding"];

export async function getCodingSettings(): Promise<CodingSettings> {
  try {
    const rows = await db.select().from(settings).where(inArray(settings.key, KEYS));
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const padding = parseInt(map.get("code_padding") || "", 10);
    return {
      prefix: map.get("code_prefix") || DEFAULT_CODING.prefix,
      separator: map.get("code_separator") || DEFAULT_CODING.separator,
      padding: Number.isFinite(padding) && padding > 0 ? padding : DEFAULT_CODING.padding,
    };
  } catch {
    return DEFAULT_CODING;
  }
}

/** Build an asset code from its parts using the configured rules. */
export function buildCode(cfg: CodingSettings, cat: string, sub: string, loc: string, n: number): string {
  const seq = String(n).padStart(cfg.padding, "0");
  return [cfg.prefix, cat, sub, loc, seq].join(cfg.separator);
}
