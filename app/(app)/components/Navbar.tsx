import Link from "next/link";
import { logout } from "@/app/actions/auth";
import Button from "./Button";

type NavbarProps = {
  isAdmin: boolean;
};

export default function Navbar({ isAdmin }: NavbarProps) {
  return (
    <header className="w-full border-b border-zinc-200 bg-white px-4 py-3 shadow-sm sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-blue-700">LogiSync</h1>
          <p className="hidden text-sm text-zinc-600 sm:block">
            Shipment operations hub
          </p>
        </div>
        <form action={logout}>
          <Button>Sign out</Button>
        </form>
      </div>

      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        <Link href="/dashboard" className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800">
          Dashboard
        </Link>
        <Link href="/waybill" className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800">
          Waybills
        </Link>
        <Link href="/routes" className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800">
          Routes
        </Link>
        <Link href="/calculator" className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800">
          Calculator
        </Link>
        {isAdmin ? (
          <>
            <Link href="/drivers" className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800">
              Drivers
            </Link>
            <Link href="/admin/waybills" className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800">
              Admin
            </Link>
          </>
        ) : null}
      </nav>
    </header>
  );
}
