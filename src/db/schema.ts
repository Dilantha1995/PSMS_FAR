import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---- Enums ----
export const depMethodEnum = pgEnum("dep_method", ["STRAIGHT_LINE", "REDUCING_BALANCE"]);
export const assetStatusEnum = pgEnum("asset_status", [
  "ACTIVE",
  "DISPOSED",
  "TRANSFERRED",
  "WRITTEN_OFF",
  "FULLY_DEPRECIATED",
]);
export const disposalMethodEnum = pgEnum("disposal_method", [
  "SALE",
  "SCRAP",
  "DONATION",
  "WRITE_OFF",
  "TRADE_IN",
  "LOST",
]);
export const adjustmentTypeEnum = pgEnum("adjustment_type", [
  "COST_ADJUSTMENT",
  "REVALUATION",
  "IMPAIRMENT",
  "IMPAIRMENT_REVERSAL",
  "RESIDUAL_CHANGE",
  "LIFE_CHANGE",
  "ACCUM_DEP_ADJUSTMENT",
  "OTHER",
]);
export const runStatusEnum = pgEnum("run_status", ["DRAFT", "POSTED"]);
export const docTypeEnum = pgEnum("doc_type", ["DISPOSAL", "TRANSFER"]);

// ---- Categories ----
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  defaultMethod: depMethodEnum("default_method").notNull().default("STRAIGHT_LINE"),
  // rate as annual percentage e.g. 20 = 20% (used for reducing balance, or to derive SL life)
  defaultRate: numeric("default_rate", { precision: 6, scale: 2 }).notNull().default("0"),
  defaultUsefulLife: integer("default_useful_life").default(0), // years (for straight line)
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Sub Categories (belong to a main category; used for asset coding) ----
export const subCategories = pgTable("sub_categories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  code: text("code").notNull(), // e.g. CH (Chairs & Seating)
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Locations (used for asset coding) ----
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. HO (Head Office)
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Assets ----
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetTag: text("asset_tag").notNull().unique(), // e.g. PSMS/FF/CH/HO/001
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  subCategoryId: integer("sub_category_id").references(() => subCategories.id),
  locationId: integer("location_id").references(() => locations.id),
  location: text("location"),
  custodian: text("custodian"),
  department: text("department"),
  supplier: text("supplier"),
  invoiceNo: text("invoice_no"),
  serialNo: text("serial_no"),
  acquisitionDate: date("acquisition_date").notNull(),
  // monetary values stored in MVR
  cost: numeric("cost", { precision: 16, scale: 2 }).notNull().default("0"),
  residualValue: numeric("residual_value", { precision: 16, scale: 2 }).notNull().default("0"),
  method: depMethodEnum("method").notNull().default("STRAIGHT_LINE"),
  rate: numeric("rate", { precision: 6, scale: 2 }).notNull().default("0"), // annual %
  usefulLife: integer("useful_life").default(0), // years
  // depreciation start date — defaults to acquisition date
  depreciationStart: date("depreciation_start"),
  accumulatedDepreciation: numeric("accumulated_depreciation", { precision: 16, scale: 2 })
    .notNull()
    .default("0"),
  status: assetStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Depreciation Runs (a period) ----
export const depreciationRuns = pgTable("depreciation_runs", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(), // e.g. "Jan 2026" or "FY2025"
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  status: runStatusEnum("status").notNull().default("DRAFT"),
  totalDepreciation: numeric("total_depreciation", { precision: 16, scale: 2 })
    .notNull()
    .default("0"),
  assetCount: integer("asset_count").notNull().default(0),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  postedBy: text("posted_by"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
});

// ---- Depreciation Lines (per asset within a run) ----
export const depreciationLines = pgTable("depreciation_lines", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => depreciationRuns.id, { onDelete: "cascade" }).notNull(),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  assetTag: text("asset_tag").notNull(),
  assetName: text("asset_name").notNull(),
  openingNbv: numeric("opening_nbv", { precision: 16, scale: 2 }).notNull().default("0"),
  depreciation: numeric("depreciation", { precision: 16, scale: 2 }).notNull().default("0"),
  closingNbv: numeric("closing_nbv", { precision: 16, scale: 2 }).notNull().default("0"),
  method: depMethodEnum("method").notNull(),
});

// ---- Disposals ----
export const disposals = pgTable("disposals", {
  id: serial("id").primaryKey(),
  referenceNo: text("reference_no").notNull().unique(),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  assetTag: text("asset_tag").notNull(),
  assetName: text("asset_name").notNull(),
  disposalDate: date("disposal_date").notNull(),
  method: disposalMethodEnum("method").notNull(),
  proceeds: numeric("proceeds", { precision: 16, scale: 2 }).notNull().default("0"),
  costAtDisposal: numeric("cost_at_disposal", { precision: 16, scale: 2 }).notNull().default("0"),
  accumDepAtDisposal: numeric("accum_dep_at_disposal", { precision: 16, scale: 2 })
    .notNull()
    .default("0"),
  nbvAtDisposal: numeric("nbv_at_disposal", { precision: 16, scale: 2 }).notNull().default("0"),
  gainLoss: numeric("gain_loss", { precision: 16, scale: 2 }).notNull().default("0"),
  buyer: text("buyer"),
  reason: text("reason"),
  approvedBy: text("approved_by"),
  documentId: integer("document_id"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Transfers ----
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  referenceNo: text("reference_no").notNull().unique(),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  assetTag: text("asset_tag").notNull(),
  assetName: text("asset_name").notNull(),
  transferDate: date("transfer_date").notNull(),
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
  fromCustodian: text("from_custodian"),
  toCustodian: text("to_custodian"),
  fromDepartment: text("from_department"),
  toDepartment: text("to_department"),
  reason: text("reason"),
  approvedBy: text("approved_by"),
  documentId: integer("document_id"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Adjustments ----
export const adjustments = pgTable("adjustments", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  assetTag: text("asset_tag").notNull(),
  assetName: text("asset_name").notNull(),
  type: adjustmentTypeEnum("type").notNull(),
  adjustmentDate: date("adjustment_date").notNull(),
  field: text("field"), // which field changed
  oldValue: text("old_value"),
  newValue: text("new_value"),
  amount: numeric("amount", { precision: 16, scale: 2 }).notNull().default("0"),
  reason: text("reason"),
  approvedBy: text("approved_by"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Documents (generated, saved with letterhead) ----
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  referenceNo: text("reference_no").notNull().unique(),
  type: docTypeEnum("type").notNull(),
  title: text("title").notNull(),
  relatedAssetId: integer("related_asset_id"),
  relatedAssetTag: text("related_asset_tag"),
  // structured payload used to render the document body
  payload: jsonb("payload").notNull(),
  pageCount: integer("page_count").notNull().default(1),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Activity Log (full audit history) ----
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // e.g. ASSET_CREATED, DISPOSAL_POSTED
  entityType: text("entity_type").notNull(), // ASSET / CATEGORY / DISPOSAL ...
  entityId: integer("entity_id"),
  entityLabel: text("entity_label"),
  summary: text("summary").notNull(),
  details: jsonb("details"),
  user: text("user").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Counters (reference number sequences) ----
export const counters = pgTable("counters", {
  key: text("key").primaryKey(), // e.g. DISPOSAL-2026
  value: integer("value").notNull().default(0),
});

// ---- App Settings (key/value) ----
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---- Users ----
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("USER"), // ADMIN | USER
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type SubCategory = typeof subCategories.$inferSelect;
export type LocationRow = typeof locations.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type DepreciationRun = typeof depreciationRuns.$inferSelect;
export type DepreciationLine = typeof depreciationLines.$inferSelect;
export type Disposal = typeof disposals.$inferSelect;
export type Transfer = typeof transfers.$inferSelect;
export type Adjustment = typeof adjustments.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type Setting = typeof settings.$inferSelect;
