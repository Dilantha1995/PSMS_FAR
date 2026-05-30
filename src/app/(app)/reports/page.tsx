import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

const reports = [
  {
    href: "/reports/summary",
    title: "FAR Summary",
    desc: "Category-wise cost, depreciation and net book value — matches your summary sheet. PDF & Excel.",
  },
  {
    href: "/reports/disposals",
    title: "Disposal Report",
    desc: "All asset disposals with proceeds and gain/loss for a selected period. PDF & Excel.",
  },
  {
    href: "/reports/additions",
    title: "FAR Addition Report",
    desc: "Assets acquired in a selected year and month. PDF & Excel.",
  },
];

export default function ReportsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="Reports" subtitle="Generate and download reports as PDF or Excel" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="p-5 hover:border-brand-blue transition-colors h-full">
              <h3 className="font-semibold text-slate-800 mb-1">{r.title}</h3>
              <p className="text-sm text-slate-500">{r.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
