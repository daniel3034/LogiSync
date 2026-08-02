"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function CityFilter({
  cities,
  selectedCity,
}: {
  cities: string[];
  selectedCity: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // The surrounding <form method="get"> keeps this working without JS; this just
  // avoids making the user press a button.
  function handleChange(city: string) {
    startTransition(() => {
      router.replace(city ? `/drivers?city=${encodeURIComponent(city)}` : "/drivers");
    });
  }

  return (
    <form method="get" action="/drivers" className="flex items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Destination city
        <select
          name="city"
          defaultValue={selectedCity}
          onChange={(event) => handleChange(event.target.value)}
          className="min-w-56 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-normal text-zinc-900 focus:border-blue-600 focus:outline-none"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
      >
        Filter
      </button>

      {isPending ? (
        <span className="pb-2 text-sm text-zinc-500">Updating…</span>
      ) : null}
    </form>
  );
}
