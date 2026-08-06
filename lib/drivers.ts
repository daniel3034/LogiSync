/**
 * `Driver.truckSize` is a free-form String column (see prisma/schema.prisma), so
 * this list is the only thing keeping the values consistent. It lives here
 * rather than in the form because the Server Action has to validate against it
 * too — a `<select>` is not a constraint, only a suggestion.
 */
export const TRUCK_SIZES = ["small", "medium", "large"] as const;

export type TruckSize = (typeof TRUCK_SIZES)[number];

export function isTruckSize(value: string): value is TruckSize {
  return (TRUCK_SIZES as readonly string[]).includes(value);
}
