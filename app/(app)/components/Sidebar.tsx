import Link from "next/link";
import { logout } from "@/app/actions/auth";
import Button from "./Button";

type SidebarProps = {
  isAdmin: boolean;
};

export default function Sidebar({ isAdmin }: SidebarProps) {
  return (
    <aside className="flex h-full min-h-screen flex-col bg-slate-900 p-6 text-white">
      <h2 className="mb-8 text-2xl font-bold">LogiSync</h2>

      <nav className="flex flex-col gap-4">
        <Link href="/dashboard">Dashboard</Link>

        {/* Cosmetic only — access is enforced in proxy.ts and requireAdmin(). */}
        {isAdmin ? <Link href="/drivers">Drivers</Link> : null}

        <Link href="/routes">Routes</Link>

        <Link href="/calculator">Calculator</Link>

        <Link href="/waybill">Waybills</Link>

        {isAdmin ? <Link href="/admin/waybills">Admin Panel</Link> : null}
      </nav>

      <form action={logout} className="mt-auto pt-8">
        <Button>Sign out</Button>
      </form>
    </aside>
  );
}
