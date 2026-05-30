import { PageHeader, Card, Empty } from "@/components/ui";
import { recentActivity } from "@/lib/activity";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTION_COLORS: Record<string, string> = {
  ASSET_CREATED: "bg-green-100 text-green-700",
  ASSET_UPDATED: "bg-blue-100 text-blue-700",
  ASSET_DISPOSED: "bg-red-100 text-red-700",
  ASSET_TRANSFERRED: "bg-amber-100 text-amber-700",
  ADJUSTMENT_POSTED: "bg-purple-100 text-purple-700",
  CATEGORY_CREATED: "bg-green-100 text-green-700",
  CATEGORY_UPDATED: "bg-blue-100 text-blue-700",
  DEPRECIATION_RUN_CREATED: "bg-slate-100 text-slate-700",
  DEPRECIATION_RUN_POSTED: "bg-green-100 text-green-700",
  DEPRECIATION_RUN_DELETED: "bg-red-100 text-red-700",
  ASSETS_IMPORTED: "bg-green-100 text-green-700",
};

export default async function ActivityPage() {
  const logs = await recentActivity(300);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="Activity Log" subtitle="Complete audit trail of every action in the system" />
      <Card className="p-5">
        {logs.length === 0 ? (
          <Empty message="No activity recorded yet." />
        ) : (
          <ul className="space-y-4">
            {logs.map((l) => (
              <li key={l.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0">
                <span
                  className={`shrink-0 h-fit px-2 py-0.5 rounded text-[10px] font-medium ${
                    ACTION_COLORS[l.action] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {l.action.replace(/_/g, " ")}
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-slate-800">{l.summary}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {l.entityLabel ? `${l.entityLabel} · ` : ""}
                    {l.user} · {fmtDateTime(l.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
