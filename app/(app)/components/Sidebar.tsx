import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-8">
        LogiSync
      </h2>

      <nav className="flex flex-col gap-4">

        <Link href="/dashboard">Dashboard</Link>

        <Link href="/drivers">Drivers</Link>

        <Link href="/routes">Routes</Link>

        <Link href="/calculator">Calculator</Link>

        <Link href="/waybill">Waybills</Link>

      </nav>
    </aside>
  );
}