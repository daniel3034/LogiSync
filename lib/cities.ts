/**
 * Helpers for `Driver.preferredCities`, which stores a comma-separated list in a
 * single column.
 *
 * NOTE: A plain `contains` query on that column produces false positives —
 * filtering by "York" would match a driver who only serves "New York", and
 * "Springfield" would match "Springfield Heights". So `contains` is used only as
 * a cheap database prefilter and the exact match is decided here, on whole
 * tokens. Migrating the column to a Postgres `String[]` and using `has` would
 * remove the need for this, but that is a separate data migration.
 */

/** Split a stored `preferredCities` value into trimmed, non-empty city names. */
export function parseCities(preferredCities: string): string[] {
  return preferredCities
    .split(",")
    .map((city) => city.trim())
    .filter((city) => city.length > 0);
}

/** True when the driver lists `city` as one of its preferred cities. */
export function matchesCity(preferredCities: string, city: string): boolean {
  const target = city.trim().toLowerCase();
  if (!target) return true;

  return parseCities(preferredCities).some(
    (candidate) => candidate.toLowerCase() === target
  );
}

/** The deduplicated, alphabetically sorted set of cities across all drivers. */
export function collectCities(
  drivers: { preferredCities: string }[]
): string[] {
  const seen = new Map<string, string>();

  for (const driver of drivers) {
    for (const city of parseCities(driver.preferredCities)) {
      const key = city.toLowerCase();
      if (!seen.has(key)) seen.set(key, city);
    }
  }

  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
