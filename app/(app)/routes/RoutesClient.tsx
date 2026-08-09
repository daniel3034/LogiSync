"use client";

import { useState } from "react";
import type { PricedRoute } from "@/lib/server/route-pricing";

type RoutesClientProps = {
  routes: PricedRoute[];
};

export default function RoutesClient({ routes }: RoutesClientProps) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filteredRoutes = query
    ? routes.filter(
        (route) =>
          route.origin.toLowerCase().includes(query) ||
          route.destination.toLowerCase().includes(query),
      )
    : routes;

  const overrideCount = routes.filter((route) => route.isOverride).length;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label
            htmlFor="route-search"
            className="block text-sm font-medium text-zinc-900"
          >
            Filter routes
          </label>
          <input
            id="route-search"
            type="search"
            placeholder="Search origin or destination…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-600"
          />
        </div>
        <p className="text-sm text-zinc-500">
          {filteredRoutes.length} of {routes.length} routes
          {overrideCount > 0 ? ` · ${overrideCount} with overrides` : ""}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Origin</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Distance</th>
              <th className="px-4 py-3 font-medium">Default ×</th>
              <th className="px-4 py-3 font-medium">Effective ×</th>
              <th className="px-4 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  {query
                    ? `No routes match “${search.trim()}”.`
                    : "No priced routes available."}
                </td>
              </tr>
            ) : (
              filteredRoutes.map((route) => (
                <tr
                  key={`${route.origin}|${route.destination}`}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="px-4 py-3 text-zinc-900">{route.origin}</td>
                  <td className="px-4 py-3 text-zinc-900">{route.destination}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {route.distanceKm.toLocaleString()} km
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {route.defaultMultiplier.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {route.effectiveMultiplier.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {route.isOverride ? (
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                        Admin override
                      </span>
                    ) : (
                      <span className="text-zinc-500">Default</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
