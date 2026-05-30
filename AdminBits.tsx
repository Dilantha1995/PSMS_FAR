"use client";

import { useMemo, useState } from "react";

export interface LabelItem {
  id: number;
  tag: string;
  name: string;
  location: string;
  qr: string;
}

export function LabelPicker({ labels }: { labels: LabelItem[] }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const query = q.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!query) return labels;
    return labels.filter(
      (l) => l.name.toLowerCase().includes(query) || l.tag.toLowerCase().includes(query)
    );
  }, [labels, query]);

  const shownIds = shown.map((l) => l.id);
  const allShownSelected = shownIds.length > 0 && shownIds.every((id) => selected.has(id));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAllShown() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) shownIds.forEach((id) => next.delete(id));
      else shownIds.forEach((id) => next.add(id));
      return next;
    });
  }
  function clearAll() {
    setSelected(new Set());
  }
  function printSelected() {
    if (selected.size === 0) return;
    window.print();
  }

  return (
    <div>
      <div className="no-print max-w-5xl mx-auto mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by asset name or code…"
            className="flex-1 min-w-[220px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <button
            onClick={selectAllShown}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {allShownSelected ? "Unselect shown" : "Select all shown"}
          </button>
          <button
            onClick={clearAll}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            onClick={printSelected}
            disabled={selected.size === 0}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blueDark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Print selected ({selected.size})
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Showing {shown.length} of {labels.length}. Tick the labels you want, then Print selected — only the ticked
          labels print.
        </p>
      </div>

      <div className="label-grid">
        {labels.map((l) => {
          const isShown = shown.includes(l);
          const isSel = selected.has(l.id);
          return (
            <label
              key={l.id}
              className={`label-card ${isSel ? "is-selected" : ""} ${isShown ? "" : "search-hidden"}`}
            >
              <input
                type="checkbox"
                className="no-print label-check"
                checked={isSel}
                onChange={() => toggle(l.id)}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.qr} alt="" className="label-qr" />
              <div className="label-info">
                <div className="label-tag">{l.tag}</div>
                <div className="label-name">{l.name}</div>
                {l.location && <div className="label-loc">{l.location}</div>}
                <div className="label-brand">Pro Synergy Medical Systems</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
