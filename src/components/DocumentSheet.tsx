import React from "react";

interface SheetProps {
  referenceNo: string;
  page?: number;
  pages?: number;
  children: React.ReactNode;
}

const COMPANY = process.env.COMPANY_NAME || "Pro Synergy Medical Systems Pvt Ltd";
const REG = process.env.COMPANY_REG || "C-0516/2012";

/** A single A4 sheet rendered with the Pro Synergy letterhead, accents and footer. */
export function DocumentSheet({ referenceNo, page = 1, pages = 1, children }: SheetProps) {
  return (
    <div className="sheet">
      <div className="lh-accent-tr" />
      <div className="lh-header">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            aria-hidden
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background:
                "conic-gradient(var(--brand-green) 0 40%, var(--brand-blue) 40% 75%, var(--brand-orange) 75% 100%)",
              flexShrink: 0,
            }}
          />
          <div className="lh-logo-text">
            <div className="lh-logo-pro">ProSynergy</div>
            <div className="lh-logo-sub">Medical Systems Pvt Ltd</div>
            <div className="lh-reg">Company Registration No.: {REG}</div>
          </div>
        </div>
        <div className="lh-bismillah">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
      </div>

      <div className="sheet-body">{children}</div>

      <div className="doc-page-number">
        Ref: {referenceNo} &nbsp;·&nbsp; Page {page} of {pages}
      </div>
      <div className="lh-accent-bl" />
      <div className="lh-footer">
        <div>Infinity Hub, 3rd Floor, Lot 11629 [N2-31A], Bageechaa Hingun, Hulhumale&apos; 23000, Malé City</div>
        <div>Tel: 333 6661, info@prosynergymaldives.com, www.prosynergymaldives.com</div>
      </div>
    </div>
  );
}

export { COMPANY, REG };
