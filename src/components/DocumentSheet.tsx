import React from "react";

interface SheetProps {
  referenceNo?: string;
  page?: number;
  pages?: number;
  metaText?: string;
  children: React.ReactNode;
}

const COMPANY = process.env.COMPANY_NAME || "Pro Synergy Medical Systems Pvt Ltd";
const REG = process.env.COMPANY_REG || "C-0516/2012";

/** A single A4 sheet rendered on the actual Pro Synergy letterhead artwork. */
export function DocumentSheet({ referenceNo, page = 1, pages = 1, metaText, children }: SheetProps) {
  const meta = metaText || (referenceNo ? `Ref: ${referenceNo}  ·  Page ${page} of ${pages}` : "");
  return (
    <div className="sheet">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/letterhead.png" alt="" className="lh-bg" />
      <div className="sheet-content">{children}</div>
      {meta && <div className="doc-ref">{meta}</div>}
    </div>
  );
}

export { COMPANY, REG };
