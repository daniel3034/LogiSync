"use client";

import { useActionState, useState } from "react";
import { addDriver, type AddDriverState } from "@/app/actions/drivers";
import { TRUCK_SIZES } from "@/lib/drivers";
import { SERVICE_DESTINATIONS } from "@/lib/waybill-options";

const INITIAL_STATE: AddDriverState = { status: "idle" };

export default function AddDriverForm() {
  const [isOpen, setIsOpen] = useState(false);
  // `isPending` stays true until the action's response — which carries the
  // re-rendered page from its `refresh()` — has been committed, so it covers
  // both the insert and the table updating.
  const [state, formAction, isPending] = useActionState(
    addDriver,
    INITIAL_STATE
  );

  const successMessage =
    state.status === "success" ? state.message : undefined;

  if (!isOpen) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Add driver
        </button>
        {successMessage ? (
          <p className="text-sm text-green-700">{successMessage}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl bg-white p-4 shadow sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Add a driver</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-900">
          Name
          <input
            required
            name="name"
            defaultValue={state.values?.name}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-blue-600"
            placeholder="Driver name"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-900">
          Phone
          <input
            required
            type="tel"
            name="phone"
            defaultValue={state.values?.phone}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-blue-600"
            placeholder="+503 ..."
          />
        </label>

        <label className="block text-sm font-medium text-zinc-900">
          Truck size
          <select
            name="truckSize"
            defaultValue={state.values?.truckSize ?? TRUCK_SIZES[0]}
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

      <fieldset className="mt-4 rounded-xl border border-zinc-200 p-4">
        <legend className="px-2 text-sm font-semibold text-zinc-900">
          Preferred cities
        </legend>
        <p className="text-sm text-zinc-600">
          Only serviced cities are offered — a city outside this list would make
          the driver unfindable by the destination filter.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_DESTINATIONS.map((city) => (
            <label
              key={city}
              className="flex items-center gap-2 text-sm text-zinc-700"
            >
              {/* Same name on every box: the action reads them with getAll. */}
              <input
                type="checkbox"
                name="preferredCities"
                value={city}
                defaultChecked={state.values?.cities.includes(city)}
                className="size-4 rounded border-zinc-300 accent-blue-600"
              />
              {city}
            </label>
          ))}
        </div>
      </fieldset>

      {state.status === "error" ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add driver"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg px-4 py-2 text-zinc-700 transition hover:bg-zinc-100"
        >
          Cancel
        </button>
        {successMessage ? (
          <p aria-live="polite" className="text-sm text-green-700">
            {successMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
