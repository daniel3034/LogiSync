import Link from "next/link";

type SidebarProps = {
  isAdmin: boolean;
};

export default function Sidebar({ isAdmin }: SidebarProps) {

  return (
    <aside className="h-full min-h-screen bg-slate-900 p-6 text-white">
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