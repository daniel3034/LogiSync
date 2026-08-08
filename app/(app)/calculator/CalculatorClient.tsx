"use client";

import { useState } from "react";
import CitySearch from "../components/CitySearch";

type PricingResult = {
  clientCost: number;
  driverPayment: number;
  netMargin: number;
  marginPercent: number;
  breakdown: {
    baseFee: number;
    billableWeightKg: number;
    volumetricWeightKg: number;
    distanceKm: number;
    distanceCharge: number;
    destinationMultiplier: number;
    routeMultiplier: number;
    fuelSurcharge: number;
  };
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function CalculatorClient() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [volume, setVolume] = useState("");
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateCost = async () => {
    setError(null);
    setResult(null);

    if (!origin || !destination) {
      setError("Please select origin and destination.");
      return;
    }

    const w = Number(weight);
    const v = Number(volume);

    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(v) || v <= 0) {
      setError("Weight and volume must be numbers greater than 0.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, weight: w, volume: v }),
      });

      const data = (await response.json()) as PricingResult | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data ? (data.error ?? "Failed to calculate") : "Failed to calculate");
      }

      setResult(data as PricingResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-zinc-900">Freight Cost Calculator</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Calculate client cost, driver payment, and net margin for a shipment.
        </p>

        <div className="mt-6 space-y-4">
          <CitySearch
            label="Origin City"
            placeholder="Search origin city..."
            value={origin}
            onChange={setOrigin}
          />

          <CitySearch
            label="Destination City"
            placeholder="Search destination city..."
            value={destination}
            onChange={setDestination}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-900">Weight (kg)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900">Volume (m³)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="button"
            onClick={() => void calculateCost()}
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Calculating..." : "Calculate"}
          </button>
        </div>

        {result && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900">Results</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-600">Client Cost</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">{formatMoney(result.clientCost)}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Driver Payment</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">{formatMoney(result.driverPayment)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Net Margin</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {formatMoney(result.netMargin)}
                  <span className="ml-2 text-sm font-normal text-emerald-600">({result.marginPercent}%)</span>
                </p>
              </div>
            </div>

            <details className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700">
              <summary className="cursor-pointer font-medium text-zinc-800">Breakdown</summary>
              <dl className="mt-3 space-y-1.5">
                <div className="flex justify-between"><dt className="text-zinc-500">Base fee</dt><dd>{formatMoney(result.breakdown.baseFee)}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Billable weight</dt><dd>{result.breakdown.billableWeightKg} kg</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Volumetric weight</dt><dd>{result.breakdown.volumetricWeightKg} kg</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Distance</dt><dd>{result.breakdown.distanceKm} km</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Distance charge</dt><dd>{formatMoney(result.breakdown.distanceCharge)}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Destination multiplier</dt><dd>{result.breakdown.destinationMultiplier}×</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Route multiplier</dt><dd>{result.breakdown.routeMultiplier}×</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Fuel surcharge</dt><dd>{formatMoney(result.breakdown.fuelSurcharge)}</dd></div>
              </dl>
            </details>
          </div>
        )}
      </div>
    </section>
  );
}
