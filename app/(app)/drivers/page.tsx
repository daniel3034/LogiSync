import { requireAdmin } from "@/lib/auth-guard";
import { collectCities, matchesCity, parseCities } from "@/lib/cities";
import { prisma } from "@/lib/prisma";
import AddDriverForm from "./AddDriverForm";
import CityFilter from "./CityFilter";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  // Authoritative ADMIN check, next to the data it protects.
  await requireAdmin("/drivers");

  const { city } = await searchParams;
  const selectedCity = city?.trim() ?? "";

  const [allCityRows, candidates] = await Promise.all([
    // Filter options come from every driver, not just the filtered ones.
    prisma.driver.findMany({ select: { preferredCities: true } }),
    prisma.driver.findMany({
      where: selectedCity
        ? { preferredCities: { contains: selectedCity, mode: "insensitive" } }
        : undefined,
      include: { _count: { select: { waybills: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cities = collectCities(allCityRows);
  // `contains` above is only a prefilter; match on whole city names here.
  const drivers = selectedCity
    ? candidates.filter((driver) =>
        matchesCity(driver.preferredCities, selectedCity)
      )
    : candidates;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Drivers</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Manage third-party drivers and their preferred service areas.
      </p>

      <div className="mt-6">
        <AddDriverForm />
      </div>

      <div className="mt-6">
        <CityFilter cities={cities} selectedCity={selectedCity} />
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        {drivers.length} {drivers.length === 1 ? "driver" : "drivers"}
        {selectedCity ? ` serving ${selectedCity}` : ""}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Truck size</th>
              <th className="px-4 py-3 font-medium">Preferred cities</th>
              <th className="px-4 py-3 font-medium">Waybills</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  {selectedCity
                    ? `No drivers serve ${selectedCity}.`
                    : "No drivers yet."}
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr
                  key={driver.id}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {driver.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{driver.phone}</td>
                  <td className="px-4 py-3 capitalize text-zinc-700">
                    {driver.truckSize}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {parseCities(driver.preferredCities).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {driver._count.waybills}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
