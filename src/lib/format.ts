export function fmtMVR(value: number | string | null | undefined, withSymbol = true): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (isNaN(n as number)) return withSymbol ? "MVR 0.00" : "0.00";
  const formatted = (n as number).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withSymbol ? `MVR ${formatted}` : formatted;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function num(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? 0 : n;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value.length === 10 ? value + "T00:00:00Z" : value) : value;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  DISPOSED: "Disposed",
  TRANSFERRED: "Transferred",
  WRITTEN_OFF: "Written Off",
  FULLY_DEPRECIATED: "Fully Depreciated",
};

export const METHOD_LABELS: Record<string, string> = {
  STRAIGHT_LINE: "Straight Line",
  REDUCING_BALANCE: "Reducing Balance",
};

export const DISPOSAL_METHOD_LABELS: Record<string, string> = {
  SALE: "Sale",
  SCRAP: "Scrap",
  DONATION: "Donation",
  WRITE_OFF: "Write-off",
  TRADE_IN: "Trade-in",
  LOST: "Lost / Stolen",
};

export const ADJUSTMENT_TYPE_LABELS: Record<string, string> = {
  COST_ADJUSTMENT: "Cost Adjustment",
  REVALUATION: "Revaluation",
  IMPAIRMENT: "Impairment",
  IMPAIRMENT_REVERSAL: "Impairment Reversal",
  RESIDUAL_CHANGE: "Residual Value Change",
  LIFE_CHANGE: "Useful Life / Rate Change",
  ACCUM_DEP_ADJUSTMENT: "Accumulated Depreciation Adjustment",
  OTHER: "Other",
};
