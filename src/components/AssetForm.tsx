"use client";

import { useState } from "react";
import type { Category, Asset } from "@/db/schema";

interface Props {
  categories: Category[];
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

export function AssetForm({ categories, action, asset }: Props) {
  const [method, setMethod] = useState(asset?.method || "STRAIGHT_LINE");
  const [rate, setRate] = useState(asset?.rate ?? "");
  const [life, setLife] = useState(asset?.usefulLife ?? "");

  function onCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const c = categories.find((x) => String(x.id) === e.target.value);
    if (c && !asset) {
      setMethod(c.defaultMethod);
      setRate(c.defaultRate);
      setLife(c.defaultUsefulLife ?? "");
    }
  }

  return (
    <form action={action} className="space-y-6">
      {asset && <input type="hidden" name="id" value={asset.id} />}

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("assetTag", "Asset Tag *", { required: true, placeholder: "PSMS-IT-0001" }, asset?.assetTag)}
          {input("name", "Asset Name *", { required: true }, asset?.name)}
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-slate-700 mb-1">Category *</span>
            <select
              name="categoryId"
              required
              defaultValue={asset?.categoryId ?? ""}
              onChange={onCategoryChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white"
            >
              <option value="" disabled>
                Select category…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-slate-700 mb-1">Description</span>
            <textarea
              name="description"
              defaultValue={asset?.description ?? ""}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </label>
          {input("serialNo", "Serial Number", {}, asset?.serialNo)}
          {input("supplier", "Supplier", {}, asset?.supplier)}
          {input("invoiceNo", "Invoice No.", {}, asset?.invoiceNo)}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Location & Custody</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {input("location", "Location", { placeholder: "Synergy Care Clinic" }, asset?.location)}
          {input("department", "Department / Unit", {}, asset?.department)}
          {input("custodian", "Custodian", {}, asset?.custodian)}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Cost & Depreciation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {input("acquisitionDate", "Acquisition Date *", { type: "date", required: true }, asset?.acquisitionDate)}
          {input(
            "depreciationStart",
            "Depreciation Start",
            { type: "date" },
            asset?.depreciationStart
          )}
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
          Straight line uses useful life if provided, otherwise the annual rate on (cost − residual). Reducing
          balance applies the annual rate to the net book value.
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
