"use client";

import Link from "next/link";

export function PrintBar({ backHref, pdfHref }: { backHref: string; pdfHref?: string }) {
  return (
    <div className="no-print flex items-center justify-between mb-4 max-w-[210mm] mx-auto">
      <Link href={backHref} className="text-sm text-brand-blue hover:underline">
        ← Back
      </Link>
      <div className="flex gap-2">
        {pdfHref && (
          <a
            href={pdfHref}
            className="bg-white border border-brand-blue text-brand-blue hover:bg-blue-50 rounded-md px-4 py-2 text-sm font-medium"
          >
            Download PDF
          </a>
        )}
        <button
          onClick={() => window.print()}
          className="bg-brand-blue hover:bg-brand-blueDark text-white rounded-md px-4 py-2 text-sm font-medium"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
