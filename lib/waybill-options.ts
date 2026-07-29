export const SERVICE_DESTINATIONS = [
  "San Salvador",
  "Santa Ana",
  "Soyapango",
  "Apopa",
  "Guatemala City",
  "Tegucigalpa",
  "Managua",
  "San Jose",
  "Panama City",
] as const;

export type ServiceDestination = (typeof SERVICE_DESTINATIONS)[number];

export const SERVICE_ORIGINS = SERVICE_DESTINATIONS;
export type ServiceOrigin = (typeof SERVICE_ORIGINS)[number];

export const DESTINATION_DISTANCE_KM: Record<ServiceDestination, number> = {
  "San Salvador": 12,
  "Santa Ana": 65,
  Soyapango: 18,
  Apopa: 22,
  "Guatemala City": 240,
  Tegucigalpa: 430,
  Managua: 570,
  "San Jose": 860,
  "Panama City": 1200,
};

const ROUTE_MULTIPLIER_BY_PAIR: Partial<
  Record<`${ServiceOrigin}|${ServiceDestination}`, number>
> = {
  "San Salvador|Guatemala City": 1.04,
  "San Salvador|Tegucigalpa": 1.05,
  "San Salvador|Managua": 1.06,
  "San Salvador|San Jose": 1.08,
  "San Salvador|Panama City": 1.1,

  "Santa Ana|Guatemala City": 0.96,
  "Santa Ana|Tegucigalpa": 1.08,
  "Santa Ana|Managua": 1.09,
  "Santa Ana|San Jose": 1.11,
  "Santa Ana|Panama City": 1.13,

  "Guatemala City|Tegucigalpa": 1.02,
  "Guatemala City|Managua": 1.06,
  "Guatemala City|San Jose": 1.09,
  "Guatemala City|Panama City": 1.12,

  "Managua|San Jose": 0.95,
  "Managua|Panama City": 1.07,
  "San Jose|Panama City": 1.02,
};

export const INTERNAL_WAYBILL_STATUSES = [
  "pending",
  "in_transit",
  "delivered",
] as const;

export type InternalWaybillStatus = (typeof INTERNAL_WAYBILL_STATUSES)[number];

export function resolveDestination(value: string): ServiceDestination | null {
  const normalized = value.trim().toLowerCase();
  return (
    SERVICE_DESTINATIONS.find(
      (destination) => destination.toLowerCase() === normalized
    ) || null
  );
}

export function resolveOrigin(value: string): ServiceOrigin | null {
  const normalized = value.trim().toLowerCase();
  return (
    SERVICE_ORIGINS.find((origin) => origin.toLowerCase() === normalized) || null
  );
}

export function getRouteMultiplier(origin: string, destination: string): number {
  const canonicalOrigin = resolveOrigin(origin);
  const canonicalDestination = resolveDestination(destination);

  if (!canonicalOrigin || !canonicalDestination) {
    return 1;
  }

  const directPair = `${canonicalOrigin}|${canonicalDestination}` as const;
  const reversePair = `${canonicalDestination}|${canonicalOrigin}` as const;

  return (
    ROUTE_MULTIPLIER_BY_PAIR[directPair] ||
    ROUTE_MULTIPLIER_BY_PAIR[reversePair] ||
    1
  );
}

export function getDestinationDistanceKm(destination: string): number {
  const canonicalDestination = resolveDestination(destination);
  return canonicalDestination ? DESTINATION_DISTANCE_KM[canonicalDestination] : 400;
}