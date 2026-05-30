import { Nav } from "@/components/Nav";
import { currentUser } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = currentUser();
  return (
    <div className="flex min-h-screen">
      <div className="no-print">
        <Nav user={user} />
      </div>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
