"use client";

import { useState } from "react";
import CitySearch from "../components/CitySearch";

export default function CalculatorPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [cost, setCost] = useState<number | null>(null);

  const calculateCost = () => {
    if (!origin || !destination) return;

    const fakeCost = Math.floor(Math.random() * 1500) + 300;
    setCost(fakeCost);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-lg">

        <h1 className="mb-2 text-3xl font-bold">
          Freight Cost Calculator
        </h1>

        <p className="mb-8 text-gray-600">
          Select the origin and destination cities to estimate the freight cost.
        </p>

        <div className="space-y-6">

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

          <button
            onClick={calculateCost}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Calculate Cost
          </button>

          {cost && (
            <div className="rounded-lg border bg-green-50 p-6">
              <h2 className="mb-4 text-xl font-bold">
                Estimated Freight Cost
              </h2>

              <p>
                <strong>Origin:</strong> {origin}
              </p>

              <p>
                <strong>Destination:</strong> {destination}
              </p>

              <p className="mt-4 text-3xl font-bold text-green-600">
                ${cost.toLocaleString()} USD
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Demo value for frontend. It will be replaced by the backend calculation.
              </p>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}