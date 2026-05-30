CREATE TYPE "public"."adjustment_type" AS ENUM('COST_ADJUSTMENT', 'REVALUATION', 'IMPAIRMENT', 'IMPAIRMENT_REVERSAL', 'RESIDUAL_CHANGE', 'LIFE_CHANGE', 'ACCUM_DEP_ADJUSTMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('ACTIVE', 'DISPOSED', 'TRANSFERRED', 'WRITTEN_OFF', 'FULLY_DEPRECIATED');--> statement-breakpoint
CREATE TYPE "public"."dep_method" AS ENUM('STRAIGHT_LINE', 'REDUCING_BALANCE');--> statement-breakpoint
CREATE TYPE "public"."disposal_method" AS ENUM('SALE', 'SCRAP', 'DONATION', 'WRITE_OFF', 'TRADE_IN', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('DISPOSAL', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('DRAFT', 'POSTED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"entity_label" text,
	"summary" text NOT NULL,
	"details" jsonb,
	"user" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"asset_tag" text NOT NULL,
	"asset_name" text NOT NULL,
	"type" "adjustment_type" NOT NULL,
	"adjustment_date" date NOT NULL,
	"field" text,
	"old_value" text,
	"new_value" text,
	"amount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"reason" text,
	"approved_by" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_tag" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"location" text,
	"custodian" text,
	"department" text,
	"supplier" text,
	"invoice_no" text,
	"serial_no" text,
	"acquisition_date" date NOT NULL,
	"cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"residual_value" numeric(16, 2) DEFAULT '0' NOT NULL,
	"method" "dep_method" DEFAULT 'STRAIGHT_LINE' NOT NULL,
	"rate" numeric(6, 2) DEFAULT '0' NOT NULL,
	"useful_life" integer DEFAULT 0,
	"depreciation_start" date,
	"accumulated_depreciation" numeric(16, 2) DEFAULT '0' NOT NULL,
	"status" "asset_status" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_asset_tag_unique" UNIQUE("asset_tag")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_method" "dep_method" DEFAULT 'STRAIGHT_LINE' NOT NULL,
	"default_rate" numeric(6, 2) DEFAULT '0' NOT NULL,
	"default_useful_life" integer DEFAULT 0,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "depreciation_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"asset_tag" text NOT NULL,
	"asset_name" text NOT NULL,
	"opening_nbv" numeric(16, 2) DEFAULT '0' NOT NULL,
	"depreciation" numeric(16, 2) DEFAULT '0' NOT NULL,
	"closing_nbv" numeric(16, 2) DEFAULT '0' NOT NULL,
	"method" "dep_method" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "depreciation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" "run_status" DEFAULT 'DRAFT' NOT NULL,
	"total_depreciation" numeric(16, 2) DEFAULT '0' NOT NULL,
	"asset_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_by" text,
	"posted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_no" text NOT NULL,
	"asset_id" integer NOT NULL,
	"asset_tag" text NOT NULL,
	"asset_name" text NOT NULL,
	"disposal_date" date NOT NULL,
	"method" "disposal_method" NOT NULL,
	"proceeds" numeric(16, 2) DEFAULT '0' NOT NULL,
	"cost_at_disposal" numeric(16, 2) DEFAULT '0' NOT NULL,
	"accum_dep_at_disposal" numeric(16, 2) DEFAULT '0' NOT NULL,
	"nbv_at_disposal" numeric(16, 2) DEFAULT '0' NOT NULL,
	"gain_loss" numeric(16, 2) DEFAULT '0' NOT NULL,
	"buyer" text,
	"reason" text,
	"approved_by" text,
	"document_id" integer,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disposals_reference_no_unique" UNIQUE("reference_no")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_no" text NOT NULL,
	"type" "doc_type" NOT NULL,
	"title" text NOT NULL,
	"related_asset_id" integer,
	"related_asset_tag" text,
	"payload" jsonb NOT NULL,
	"page_count" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_reference_no_unique" UNIQUE("reference_no")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_no" text NOT NULL,
	"asset_id" integer NOT NULL,
	"asset_tag" text NOT NULL,
	"asset_name" text NOT NULL,
	"transfer_date" date NOT NULL,
	"from_location" text,
	"to_location" text,
	"from_custodian" text,
	"to_custodian" text,
	"from_department" text,
	"to_department" text,
	"reason" text,
	"approved_by" text,
	"document_id" integer,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfers_reference_no_unique" UNIQUE("reference_no")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_lines" ADD CONSTRAINT "depreciation_lines_run_id_depreciation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."depreciation_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_lines" ADD CONSTRAINT "depreciation_lines_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disposals" ADD CONSTRAINT "disposals_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transfers" ADD CONSTRAINT "transfers_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
