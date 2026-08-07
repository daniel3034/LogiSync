"use client";

import { useEffect, useMemo, useState } from "react";
import { getRouteMultiplier } from "@/lib/waybill-options";

type Driver = {
  id: string;
  name: string;
  truckSize: string;
};

type Waybill = {
  id: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  status: string;
  createdAt: string;
  clientCost: number;
  driverPayment: number;
  netMargin: number;
  driverId: string | null;
  driver: {
    id: string;
    name: string;
    truckSize: string;
  } | null | undefined;
};

type RoutePricingOverride = {
  id: string;
  origin: string;
  destination: string;
  multiplier: number;
  defaultMultiplier: number;
};

const statusOptions = ["pending", "in_transit", "delivered"];

export default function AdminWaybillsClient() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<RoutePricingOverride[]>([]);
  const [overrideOrigin, setOverrideOrigin] = useState("");
  const [overrideDestination, setOverrideDestination] = useState("");
  const [overrideMultiplier, setOverrideMultiplier] = useState("1.00");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  const defaultSelectedRouteMultiplier = useMemo(() => {
    if (!overrideOrigin || !overrideDestination) return null;
    return getRouteMultiplier(overrideOrigin, overrideDestination);
  }, [overrideOrigin, overrideDestination]);

  const loadData = async () => {
    try {
      const [driversResponse, waybillsResponse, routePricingResponse] = await Promise.all([
        fetch("/api/drivers", { cache: "no-store" }),
        fetch("/api/admin/waybills", { cache: "no-store" }),
        fetch("/api/admin/route-pricing", { cache: "no-store" }),
      ]);

      const driversData = (await driversResponse.json()) as Driver[] | { error?: string };
      const waybillsData = (await waybillsResponse.json()) as Waybill[] | { error?: string };
      const routePricingData =
        (await routePricingResponse.json()) as
          | {
              origins: string[];
              destinations: string[];
              overrides: RoutePricingOverride[];
            }
          | { error?: string };

      if (!driversResponse.ok) {
        throw new Error("error" in driversData ? driversData.error || "Failed to fetch drivers" : "Failed to fetch drivers");
      }

      if (!waybillsResponse.ok) {
        throw new Error("error" in waybillsData ? waybillsData.error || "Failed to fetch waybills" : "Failed to fetch waybills");
      }

      if (!routePricingResponse.ok) {
        throw new Error(
          "error" in routePricingData
            ? routePricingData.error || "Failed to fetch route pricing"
            : "Failed to fetch route pricing"
        );
      }

      setDrivers(Array.isArray(driversData) ? driversData : []);
      setWaybills(Array.isArray(waybillsData) ? waybillsData : []);
      // Narrow on a required key of the success shape: `error` is optional in
      // the failure shape, so `"error" in data` cannot rule it out.
      if ("origins" in routePricingData) {
        setOrigins(routePricingData.origins);
        setDestinations(routePricingData.destinations);
        setOverrides(routePricingData.overrides);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial admin data fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  const updateWaybill = async (id: string, payload: { driverId?: string | null; status?: string }) => {
    setSavingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/waybills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as Waybill | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error || "Failed to update waybill" : "Failed to update waybill");
      }

      const updated = data as Waybill;
      setWaybills((current) => current.map((waybill) => (waybill.id === id ? updated : waybill)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update waybill");
    } finally {
      setSavingId(null);
    }
  };

  const saveRouteOverride = async () => {
    if (!overrideOrigin || !overrideDestination) {
      setError("Origin and destination are required for route override.");
      return;
    }

    setIsSavingOverride(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/route-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: overrideOrigin,
          destination: overrideDestination,
          multiplier: Number(overrideMultiplier),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save route override");
      }

      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save route override");
    } finally {
      setIsSavingOverride(false);
    }
  };

  const deleteRouteOverride = async (origin: string, destination: string) => {
    setIsSavingOverride(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/route-pricing?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
        {
          method: "DELETE",
        }
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete route override");
      }

      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete route override");
    } finally {
      setIsSavingOverride(false);
    }
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Internal Admin Panel</p>
        <h1 className="mt-2 text-3xl font-bold">Waybill Driver Assignment</h1>
        <p className="mt-2 text-sm text-slate-200">
          Use this internal panel to assign drivers and tune route pricing rules.
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-zinc-900">Route Pricing Overrides</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Override specific origin-destination multipliers stored in the database.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            value={overrideOrigin}
            onChange={(event) => setOverrideOrigin(event.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">Select origin</option>
            {origins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>

          <select
            value={overrideDestination}
            onChange={(event) => setOverrideDestination(event.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">Select destination</option>
            {destinations.map((destination) => (
              <option key={destination} value={destination}>
                {destination}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0.01"
            max="3"
            step="0.01"
            value={overrideMultiplier}
            onChange={(event) => setOverrideMultiplier(event.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            placeholder="Multiplier"
          />

          <button
            type="button"
            onClick={saveRouteOverride}
            disabled={isSavingOverride}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-70"
          >
            {isSavingOverride ? "Saving..." : "Save Override"}
          </button>
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          Default multiplier for selected pair: {defaultSelectedRouteMultiplier?.toFixed(2) || "-"}
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Origin</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Destination</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Default</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Override</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {overrides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    No overrides saved yet.
                  </td>
                </tr>
              ) : (
                overrides.map((override) => (
                  <tr key={override.id}>
                    <td className="px-4 py-3 text-zinc-800">{override.origin}</td>
                    <td className="px-4 py-3 text-zinc-800">{override.destination}</td>
                    <td className="px-4 py-3 text-zinc-700">{override.defaultMultiplier.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{override.multiplier.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void deleteRouteOverride(override.origin, override.destination)}
                        disabled={isSavingOverride}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-70"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-zinc-900">Waybill Operations</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Assign drivers and update shipment status.
        </p>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="overflow-x-auto rounded-xl ring-1 ring-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Waybill</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Route</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Driver Payout</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Net Margin</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Driver (Internal)</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    Loading internal assignments...
                  </td>
                </tr>
              ) : waybills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    No waybills found.
                  </td>
                </tr>
              ) : (
                waybills.map((waybill) => (
                  <tr key={waybill.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-800">{waybill.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-zinc-500">{new Date(waybill.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-800">{waybill.origin}{" -> "}{waybill.destination}</p>
                      <p className="text-xs text-zinc-500">{waybill.senderName}{" -> "}{waybill.receiverName}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-800">{formatMoney(waybill.clientCost)}</td>
                    <td className="px-4 py-3 font-medium text-zinc-800">{formatMoney(waybill.driverPayment)}</td>
                    <td className="px-4 py-3 font-medium text-zinc-800">{formatMoney(waybill.netMargin)}</td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900"
                        value={waybill.driverId ?? ""}
                        disabled={savingId === waybill.id}
                        onChange={(event) => {
                          const selectedDriverId = event.target.value || null;
                          void updateWaybill(waybill.id, { driverId: selectedDriverId });
                        }}
                      >
                        <option value="">Unassigned</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} - {driver.truckSize}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900"
                        value={waybill.status}
                        disabled={savingId === waybill.id}
                        onChange={(event) => {
                          void updateWaybill(waybill.id, { status: event.target.value });
                        }}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(`/api/waybills/${waybill.id}/pdf`, "_blank")
                      }
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Download PDF
                    </button>
                  </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
