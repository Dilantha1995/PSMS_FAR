# ProSynergy FAR — Fixed Asset Register

A web app to manage the Fixed Asset Register for **Pro Synergy Medical Systems Pvt Ltd**.

Built with Next.js 14 (App Router), Drizzle ORM and Neon Postgres, styled with Tailwind CSS, and ready to deploy on Vercel.

## Features

- **Master FAR** — searchable, filterable asset register with cost / accumulated depreciation / NBV totals, and Excel & CSV export.
- **Assets** — add, edit and view assets; per-asset valuation, a projected depreciation schedule, documents and full history.
- **Categories** — asset classes with default depreciation method, rate and useful life that auto-fill new assets.
- **Depreciation** — create a draft run for any period (straight line or reducing balance), review the per-asset lines, then post it to record depreciation against accumulated depreciation. Supports "fully depreciated" status.
- **Disposals** — record disposals (sale, scrap, donation, write-off, trade-in, lost), auto-computes gain/loss, and generates a **Disposal Note** on the company letterhead with a reference number.
- **Transfers** — internal or external transfers; updates the asset's location/custodian/department and generates a **Transfer Note**.
- **Adjustments** — cost adjustments, revaluation, impairment, residual / useful-life changes, etc., with old → new tracking.
- **Documents** — every generated note is saved, numbered (`PSMS/FA-DSP/YYYY/0001`, `PSMS/FA-TRF/YYYY/0001`), rendered with the letterhead, page numbers, and print / save-as-PDF.
- **Activity Log** — a complete audit trail of every action.
- **Import** — load your existing FAR from `.xlsx` / `.csv`; columns are matched flexibly and unknown categories are created automatically.
- **Login** — a simple shared-password gate (set `APP_PASSWORD`).

## 1. Create the database (Neon)

1. Sign up at <https://neon.tech> and create a project (choose a region near you).
2. Copy the **connection string** (looks like `postgresql://user:password@host/dbname?sslmode=require`).

> Vercel Postgres also works — use its connection string instead.

## 2. Run locally

```bash
npm install
cp .env.example .env        # then edit .env
# DATABASE_URL="postgresql://...?sslmode=require"
# APP_PASSWORD="choose-a-password"

npm run db:push             # creates the tables in your database
npm run db:seed             # optional: starter categories + sample assets
npm run dev                 # http://localhost:3000
```

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — ProSynergy FAR"
git branch -M main
git remote add origin https://github.com/<you>/psms-far.git
git push -u origin main
```

## 4. Deploy on Vercel

1. Go to <https://vercel.com>, **Add New → Project**, and import the GitHub repo.
2. Under **Environment Variables**, add:
   - `DATABASE_URL` — your Neon connection string
   - `APP_PASSWORD` — the login password
   - *(optional)* `COMPANY_NAME`, `COMPANY_REG`
3. Click **Deploy**.

The tables need to exist in the database before first use. Run `npm run db:push` once locally (it points at the same Neon database), or run it from your machine after setting `DATABASE_URL`.

## Notes

- **Letterhead** is recreated in CSS (green diagonal accents, ProSynergy wordmark, Bismillah, registration number and footer). To use the exact logo artwork, drop a `logo.png` into `/public` and swap the placeholder mark in `src/components/DocumentSheet.tsx`.
- **Currency** is MVR throughout, stored to 2 decimals.
- **Depreciation**: straight line uses useful life if provided, otherwise the annual rate on (cost − residual); reducing balance applies the annual rate to the net book value and never depreciates below the residual value.
- **Reference numbers** are generated atomically via a counter table, so they never collide.

## Project structure

```
src/
  app/(app)/        dashboard, assets, categories, depreciation, disposals,
                    transfers, adjustments, documents, activity, import
  app/login         password gate
  app/api/export    XLSX / CSV export of the FAR
  components/        UI primitives, asset form, letterhead document sheet, nav
  db/               Drizzle schema, client, seed
  lib/              depreciation engine, formatting, references, auth,
                    activity log, queries, server actions
```
