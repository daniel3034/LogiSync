import { requireSession } from "@/lib/auth-guard";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await requireSession("/dashboard");

  if (session.user.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Your account doesn&apos;t have access to shipment data.
        </p>
      </main>
    );
  }

  return <DashboardClient />;
}
