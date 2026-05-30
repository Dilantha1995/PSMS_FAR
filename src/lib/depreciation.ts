// Depreciation engine — pure functions, no DB access.
// All monetary values are in MVR and rounded to 2 decimal places.

export type DepMethod = "STRAIGHT_LINE" | "REDUCING_BALANCE";

export interface DepAssetInput {
  id: number;
  assetTag: string;
  name: string;
  cost: number;
  residualValue: number;
  accumulatedDepreciation: number;
  method: DepMethod;
  rate: number; // annual %
  usefulLife: number | null; // years
  acquisitionDate: string; // yyyy-mm-dd
  depreciationStart: string | null; // yyyy-mm-dd
  status: string;
}

export interface DepLineResult {
  assetId: number;
  assetTag: string;
  assetName: string;
  openingNbv: number;
  depreciation: number;
  closingNbv: number;
  method: DepMethod;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Inclusive count of calendar months the asset is in service during [periodStart, periodEnd]. */
export function serviceMonths(depStart: Date, periodStart: Date, periodEnd: Date): number {
  const effStart = depStart > periodStart ? depStart : periodStart;
  if (effStart > periodEnd) return 0;
  const months =
    (periodEnd.getFullYear() - effStart.getFullYear()) * 12 +
    (periodEnd.getMonth() - effStart.getMonth()) +
    1;
  return Math.max(0, months);
}

function parseDate(s: string): Date {
  // Treat as UTC midnight to avoid timezone drift.
  return new Date(s + "T00:00:00Z");
}

/** Annual depreciation for one asset given its current opening NBV. */
function annualDepreciation(asset: DepAssetInput, openingNbv: number): number {
  if (asset.method === "REDUCING_BALANCE") {
    return openingNbv * (asset.rate / 100);
  }
  // Straight line — prefer useful life if provided, else use rate on depreciable base.
  const base = asset.cost - asset.residualValue;
  if (asset.usefulLife && asset.usefulLife > 0) {
    return base / asset.usefulLife;
  }
  return base * (asset.rate / 100);
}

/** Compute depreciation for a single asset over a period. */
export function depreciateAsset(
  asset: DepAssetInput,
  periodStartStr: string,
  periodEndStr: string
): DepLineResult {
  const openingNbv = round2(asset.cost - asset.accumulatedDepreciation);
  const result: DepLineResult = {
    assetId: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.name,
    openingNbv,
    depreciation: 0,
    closingNbv: openingNbv,
    method: asset.method,
  };

  // Skip assets that should not depreciate.
  if (["DISPOSED", "TRANSFERRED", "WRITTEN_OFF", "FULLY_DEPRECIATED"].includes(asset.status)) {
    return result;
  }

  const depStart = parseDate(asset.depreciationStart || asset.acquisitionDate);
  const periodStart = parseDate(periodStartStr);
  const periodEnd = parseDate(periodEndStr);

  const months = serviceMonths(depStart, periodStart, periodEnd);
  if (months <= 0) return result;

  const annual = annualDepreciation(asset, openingNbv);
  let dep = round2((annual / 12) * months);

  // Never depreciate below residual value.
  const maxRemaining = round2(openingNbv - asset.residualValue);
  if (dep > maxRemaining) dep = Math.max(maxRemaining, 0);
  if (dep < 0) dep = 0;

  result.depreciation = round2(dep);
  result.closingNbv = round2(openingNbv - dep);
  return result;
}

/** Build a full year-by-year schedule for an asset (for the detail view). */
export function buildSchedule(
  asset: DepAssetInput,
  years = 15
): { year: number; opening: number; depreciation: number; closing: number }[] {
  const rows: { year: number; opening: number; depreciation: number; closing: number }[] = [];
  const startYear = parseDate(asset.depreciationStart || asset.acquisitionDate).getUTCFullYear();
  let opening = round2(asset.cost);
  let accum = 0;
  for (let i = 0; i < years; i++) {
    const remaining = round2(opening - asset.residualValue);
    if (remaining <= 0) break;
    let annual: number;
    if (asset.method === "REDUCING_BALANCE") {
      annual = opening * (asset.rate / 100);
    } else {
      const base = asset.cost - asset.residualValue;
      annual = asset.usefulLife && asset.usefulLife > 0 ? base / asset.usefulLife : base * (asset.rate / 100);
    }
    let dep = round2(annual);
    if (dep > remaining) dep = remaining;
    if (dep <= 0) break;
    const closing = round2(opening - dep);
    rows.push({ year: startYear + i, opening, depreciation: dep, closing });
    accum = round2(accum + dep);
    opening = closing;
  }
  return rows;
}
