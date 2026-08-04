import Link from "next/link";
import { auth } from "@/auth";

export default async function Sidebar() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-8">
        LogiSync
      </h2>

      <nav className="flex flex-col gap-4">

        <Link href="/dashboard">Dashboard</Link>

        {/* Cosmetic only — access is enforced in proxy.ts and requireAdmin(). */}
        {isAdmin ? <Link href="/drivers">Drivers</Link> : null}

        <Link href="/routes">Routes</Link>

        <Link href="/calculator">Calculator</Link>

        <Link href="/waybill">Waybills</Link>

        <Link href="/admin/waybills">Admin Panel</Link>

      </nav>
    </aside>
  );
}