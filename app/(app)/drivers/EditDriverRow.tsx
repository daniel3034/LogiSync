"use client";

import { FormEvent, useMemo, useState } from "react";
import { parseCities } from "@/lib/cities";
import { TRUCK_SIZES } from "@/lib/drivers";
import { SERVICE_DESTINATIONS } from "@/lib/waybill-options";

type Driver = {
  id: string;
  name: string;
  phone: string;
  truckSize: string;
  preferredCities: string;
};

export default function EditDriverRow({ driver }: { driver: Driver }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialSelectedCities = useMemo(
    () => new Set(parseCities(driver.preferredCities)),
    [driver.preferredCities]
  );

  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [truckSize, setTruckSize] = useState(driver.truckSize);
  const [selectedCities, setSelectedCities] = useState<Set<string>>(
    initialSelectedCities
  );

  function resetForm() {
    setName(driver.name);
    setPhone(driver.phone);
    setTruckSize(driver.truckSize);
    setSelectedCities(new Set(parseCities(driver.preferredCities)));
    setError(null);
    setIsEditing(false);
  }

  function toggleCity(city: string) {
    setSelectedCities((current) => {
      const next = new Set(current);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const cities = [...selectedCities].sort();

    if (!trimmedName || !trimmedPhone) {
      setError("Name and phone are required.");
      return;
    }

    if (cities.length === 0) {
      setError("Choose at least one preferred city.");
      return;
    }

    const unserviced = cities.filter(
      (city) => !(SERVICE_DESTINATIONS as readonly string[]).includes(city)
    );
    if (unserviced.length > 0) {
      setError(`Not a serviced city: ${unserviced.join(", ")}.`);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone,
          truckSize,
          preferredCities: cities.join(", "),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to update driver.");
      }

      setIsEditing(false);
      window.location.reload();
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update driver.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsEditing(true);
        }}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100"
      >
        Edit
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-900">
          Name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-blue-600"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-900">
          Phone
          <input
            required
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-blue-600"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-900">
          Truck size
          <select
            value={truckSize}
            onChange={(event) => setTruckSize(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal capitalize text-zinc-900 outline-none focus:border-blue-600"
          >
            {TRUCK_SIZES.map((size) => (
              <option key={size} value={size} className="capitalize">
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="rounded-xl border border-zinc-200 p-3">
        <legend className="px-2 text-sm font-semibold text-zinc-900">
          Preferred cities
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_DESTINATIONS.map((city) => (
            <label
              key={city}
              className="flex items-center gap-2 text-sm text-zinc-700"
            >
              <input
                type="checkbox"
                checked={selectedCities.has(city)}
                onChange={() => toggleCity(city)}
                className="size-4 rounded border-zinc-300 accent-blue-600"
              />
              {city}
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          disabled={isSaving}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
