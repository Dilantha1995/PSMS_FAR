import { PageHeader, Card, Empty, StatusBadge } from "@/components/ui";
import { CodingForm, DangerDelete } from "@/components/AdminBits";
import { getCodingSettings } from "@/lib/settings";
import { getAllCategories } from "@/lib/queries";
import { updateCoding, deleteAllAssets } from "@/lib/actions/settings";
import { createUser, setUserActive, deleteUser } from "@/lib/actions/users";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import { METHOD_LABELS } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
  if (!isAdmin()) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <PageHeader title="Settings" />
        <Card className="p-6">
          <Empty message="Settings are available to administrators only. Sign in with the admin password to manage them." />
        </Card>
      </div>
    );
  }

  const cfg = await getCodingSettings();
  const cats = await getAllCategories();
  const userList = await db.select().from(users).orderBy(asc(users.username));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <PageHeader title="Settings" subtitle="Configuration, users and maintenance" />

      {searchParams.ok !== undefined && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-800">Done — {searchParams.ok} asset(s) deleted.</p>
        </Card>
      )}
      {searchParams.err && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{searchParams.err}</p>
        </Card>
      )}

      {/* Asset code rules */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Asset code rules</h2>
        <p className="text-sm text-slate-500 mb-4">
          How new asset tags are built: Prefix / Category / Sub-category / Location / Number.
        </p>
        <Card className="p-5">
          <CodingForm action={updateCoding} prefix={cfg.prefix} separator={cfg.separator} padding={cfg.padding} />
        </Card>
      </section>

      {/* Depreciation rates */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Depreciation rates by category</h2>
        <p className="text-sm text-slate-500 mb-4">
          These defaults auto-fill when you add an asset in that category. Edit a category to change its rate.
        </p>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium text-right">Rate</th>
                <th className="px-4 py-2 font-medium text-right">Life</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-2 text-slate-800">{c.name}</td>
                  <td className="px-4 py-2 text-slate-600">{METHOD_LABELS[c.defaultMethod]}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.defaultRate}%</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.defaultUsefulLife || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/categories/${c.id}/edit`} className="text-brand-blue hover:underline text-xs">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* User management */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">User management</h2>
        <p className="text-sm text-slate-500 mb-4">
          Add logins for your team. Admins can access Settings; Users can do everything else. The master password set
          on the server always works as an admin.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {userList.length === 0 ? (
                <Empty message="No additional users yet. Everyone signs in with the master password until you add some." />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium">Username</th>
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Role</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-xs">{u.username}</td>
                        <td className="px-4 py-2 text-slate-800">{u.fullName || "—"}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {u.active ? (
                            <span className="text-xs text-green-600">Active</span>
                          ) : (
                            <span className="text-xs text-slate-400">Disabled</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                          <form action={setUserActive} className="inline">
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                            <button className="text-brand-blue hover:underline text-xs">
                              {u.active ? "Disable" : "Enable"}
                            </button>
                          </form>
                          <form action={deleteUser} className="inline">
                            <input type="hidden" name="id" value={u.id} />
                            <button className="text-red-600 hover:underline text-xs">Delete</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <Card className="p-5 h-fit">
            <h3 className="font-semibold text-slate-800 mb-4">Add user</h3>
            <form action={createUser} className="space-y-3">
              <input name="username" required placeholder="Username (e.g. ahmed)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="fullName" placeholder="Full name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="password" type="text" required placeholder="Password" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <select name="role" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button className="w-full bg-brand-blue hover:bg-brand-blueDark text-white rounded-md py-2 text-sm font-medium">
                Add user
              </button>
            </form>
          </Card>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-lg font-semibold text-red-700 mb-1">Danger zone</h2>
        <Card className="p-5 border-red-200">
          <DangerDelete action={deleteAllAssets} />
        </Card>
      </section>
    </div>
  );
}
