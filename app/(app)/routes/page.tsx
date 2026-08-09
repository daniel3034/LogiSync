import { requireAdmin } from "@/lib/auth-guard";
import { listPricedRoutes } from "@/lib/server/route-pricing";
import RoutesClient from "./RoutesClient";

export default async function RoutesPage() {
  await requireAdmin("/routes");

  const routes = await listPricedRoutes();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Route pricing</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Origin→destination pairs the system can price, with distance and the
        effective multiplier (including admin overrides from the admin panel).
      </p>

      <div className="mt-6">
        <RoutesClient routes={routes} />
      </div>
    </main>
  );
}
