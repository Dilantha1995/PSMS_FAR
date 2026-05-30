"use client";

import { useState } from "react";

export function CodingForm({
  action,
  prefix,
  separator,
  padding,
}: {
  action: (fd: FormData) => void;
  prefix: string;
  separator: string;
  padding: number;
}) {
  const [p, setP] = useState(prefix);
  const [s, setS] = useState(separator);
  const [n, setN] = useState(padding);

  const example = [p || "PSMS", "FF", "CH", "HO", "1".padStart(Math.max(1, n), "0")].join(s || "/");

  const fld = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Prefix</span>
          <input name="prefix" value={p} onChange={(e) => setP(e.target.value)} className={fld + " font-mono"} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Separator</span>
          <input
            name="separator"
            value={s}
            maxLength={1}
            onChange={(e) => setS(e.target.value)}
            className={fld + " font-mono"}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Number digits</span>
          <input
            name="padding"
            type="number"
            min={1}
            max={8}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className={fld}
          />
        </label>
      </div>
      <div className="text-sm text-slate-600">
        Preview: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{example}</span>
      </div>
      <button className="bg-brand-blue hover:bg-brand-blueDark text-white rounded-md px-5 py-2 text-sm font-medium">
        Save code rules
      </button>
    </form>
  );
}

export function DangerDelete({ action }: { action: (fd: FormData) => void }) {
  const [text, setText] = useState("");
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-slate-600">
        This permanently deletes <strong>all assets</strong> and their depreciation runs, disposals, transfers,
        adjustments and documents. Categories, sub-categories and locations are kept. This cannot be undone.
      </p>
      <label className="block">
        <span className="block text-sm font-medium text-slate-700 mb-1">
          Type <span className="font-mono">DELETE</span> to confirm
        </span>
        <input
          name="confirm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full sm:w-64 rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
        />
      </label>
      <button
        type="submit"
        disabled={text !== "DELETE"}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md px-5 py-2 text-sm font-medium"
      >
        Delete all assets
      </button>
    </form>
  );
}
