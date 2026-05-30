import { login } from "@/lib/actions/auth";
import { passwordRequired } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  if (!passwordRequired()) {
    // No password configured — go straight in.
    redirect(searchParams.next || "/");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-brand-blue">ProSynergy</div>
          <div className="text-sm text-slate-500">Fixed Asset Register</div>
        </div>
        {searchParams.error && (
          <div className="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
            Incorrect password. Please try again.
          </div>
        )}
        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={searchParams.next || "/"} />
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Username</span>
            <input
              name="name"
              required
              placeholder="your username (or name)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Password</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-brand-blue hover:bg-brand-blueDark text-white rounded-md py-2 text-sm font-medium"
          >
            Sign in
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4 text-center">
          Your name is recorded against every action for the audit trail.
        </p>
      </div>
    </div>
  );
}
