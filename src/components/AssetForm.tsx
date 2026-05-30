"use client";

import { useState, useEffect } from "react";
import type { Category, SubCategory, LocationRow, Asset } from "@/db/schema";

interface Props {
  categories: Category[];
  subCategories: SubCategory[];
  locations: LocationRow[];
  action: (formData: FormData) => void;
  asset?: Asset;
}

function input(name: string, label: string, props: any = {}, value?: any) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      <input
        name={name}
        defaultValue={value ?? ""}
        {...props}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
      />
    </label>
  );
}

const selectCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white";

export function AssetForm({ categories, subCategories, locations, action, asset }: Props) {
  const [method, setMethod] = useState(asset?.method || "STRAIGHT_LINE");
  const [rate, setRate] = useState(asset?.rate ?? "");
  const [life, setLife] = useState(asset?.usefulLife ?? "");

  const [catId, setCatId] = useState<string>(asset?.categoryId ? String(asset.categoryId) : "");
  const [subId, setSubId] = useState<string>(asset?.subCategoryId ? String(asset.subCategoryId) : "");
  const [locId, setLocId] = useState<string>(asset?.locationId ? String(asset.locationId) : "");
  const [tag, setTag] = useState<string>(asset?.assetTag ?? "");
  const [suggesting, setSuggesting] = useState(false);

  const subsForCat = subCategories.filter((s) => String(s.categoryId) === catId);

  function onCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setCatId(v);
    setSubId("");
    const c = categories.find((x) => String(x.id) === v);
    if (c && !asset) {
      setMethod(c.defaultMethod);
      setRate(c.defaultRate);
      setLife(c.defaultUsefulLife ?? "");
    }
  }

  useEffect(() => {
    if (asset) return;
    const cat = categories.find((c) => String(c.id) === catId)?.code;
    const sub = subCategories.find((s) => String(s.id) === subId)?.code;
    const loc = locations.find((l) => String(l.id) === locId)?.code;
    if (!cat || !sub || !loc) return;
    let cancelled = false;
    setSuggesting(true);
    fetch(`/api/next-code?cat=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}&loc=${encodeURIComponent(loc)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.code) setTag(d.code);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSuggesting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catId, subId, locId, asset, categories, subCategories, locations]);

  return (
    <form action={action} className="space-y-6">
      {asset && <input type="hidden" name="id" value={asset.id} />}

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Classification &amp; Code</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Main Category *</span>
            <select name="categoryId" required value={catId} onChange={onCategoryChange} className={selectCls}>
              <option value="" disabled>
                Select…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Sub Category</span>
            <select name="subCategoryId" value={subId} onChange={(e) => setSubId(e.target.value)} className={selectCls}>
              <option value="">{catId ? "Select…" : "Pick a category first"}</option>
              {subsForCat.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Location</span>
            <select name="locationId" value={locId} onChange={(e) => setLocId(e.target.value)} className={selectCls}>
              <option value="">Select…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Asset Tag *{" "}
              <span className="text-xs font-normal text-slate-400">
                {asset ? "" : suggesting ? "(generating…)" : "(auto-filled — you can edit it)"}
              </span>
            </span>
            <input
              name="assetTag"
              required
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="PSMS/FF/CH/HO/001"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </label>
          {!asset && (
            <p className="text-xs text-slate-400 mt-1">
              Pick category, sub-category and location and the next code is suggested automatically (continuing your
              existing numbering). You can still type your own.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("name", "Asset Name *", { required: true }, asset?.name)}
          {input("serialNo", "Serial Number", {}, asset?.serialNo)}
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-slate-700 mb-1">Description</span>
            <textarea
              name="description"
              defaultValue={asset?.description ?? ""}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </label>
          {input("supplier", "Supplier", {}, asset?.supplier)}
          {input("invoiceNo", "Invoice No.", {}, asset?.invoiceNo)}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Location &amp; Custody</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {input("location", "Location (text)", { placeholder: "Synergy Care Clinic" }, asset?.location)}
          {input("department", "Department / Unit", {}, asset?.department)}
          {input("custodian", "Custodian", {}, asset?.custodian)}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Cost &amp; Depreciation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {input("acquisitionDate", "Acquisition Date *", { type: "date", required: true }, asset?.acquisitionDate)}
          {input("depreciationStart", "Depreciation Start", { type: "date" }, asset?.depreciationStart)}
          <div />
          {input("cost", "Cost (MVR) *", { type: "number", step: "0.01", required: true }, asset?.cost)}
          {input("residualValue", "Residual Value (MVR)", { type: "number", step: "0.01" }, asset?.residualValue)}
          {!asset &&
            input("accumulatedDepreciation", "Opening Accum. Dep (MVR)", { type: "number", step: "0.01" }, "0")}

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Method</span>
            <select
              name="method"
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="STRAIGHT_LINE">Straight Line</option>
              <option value="REDUCING_BALANCE">Reducing Balance</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Annual Rate (%)</span>
            <input
              name="rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Useful Life (yrs){method === "STRAIGHT_LINE" ? " — overrides rate" : ""}
            </span>
            <input
              name="usefulLife"
              type="number"
              value={life}
              onChange={(e) => setLife(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Straight line uses useful life if provided, otherwise the annual rate on (cost − residual). Reducing balance
          applies the annual rate to the net book value.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Notes</span>
          <textarea
            name="notes"
            defaultValue={asset?.notes ?? ""}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-brand-blue hover:bg-brand-blueDark text-white rounded-md px-5 py-2 text-sm font-medium"
        >
          {asset ? "Save Changes" : "Add Asset"}
        </button>
      </div>
    </form>
  );
}
