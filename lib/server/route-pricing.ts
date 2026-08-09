import { prisma } from "@/lib/prisma";
import {
  SERVICE_DESTINATIONS,
  SERVICE_ORIGINS,
  getDestinationDistanceKm,
  getRouteMultiplier,
} from "@/lib/waybill-options";

export async function getEffectiveRouteMultiplier(
  origin: string,
  destination: string,
): Promise<number> {
  const fallbackMultiplier = getRouteMultiplier(origin, destination);

  try {
    const direct = await prisma.routePricing.findUnique({
      where: {
        route_pricing_origin_destination_key: {
          origin,
          destination,
        },
      },
      select: { multiplier: true },
    });

    if (direct) {
      return direct.multiplier;
    }

    const reverse = await prisma.routePricing.findUnique({
      where: {
        route_pricing_origin_destination_key: {
          origin: destination,
          destination: origin,
        },
      },
      select: { multiplier: true },
    });

    return reverse?.multiplier ?? fallbackMultiplier;
  } catch {
    // If the table does not exist yet in a given environment, use code defaults.
    return fallbackMultiplier;
  }
}

export type PricedRoute = {
  origin: string;
  destination: string;
  distanceKm: number;
  defaultMultiplier: number;
  effectiveMultiplier: number;
  isOverride: boolean;
};

/**
 * Every origin→destination pair the pricing engine can accept, with distance
 * and the effective multiplier (DB override wins over the static table, same
 * rules as getEffectiveRouteMultiplier).
 */
export async function listPricedRoutes(): Promise<PricedRoute[]> {
  let overrides: { origin: string; destination: string; multiplier: number }[] =
    [];

  try {
    overrides = await prisma.routePricing.findMany({
      select: { origin: true, destination: true, multiplier: true },
    });
  } catch {
    // Table may be missing in some environments; fall back to static defaults.
    overrides = [];
  }

  const overrideMap = new Map<string, number>();
  for (const override of overrides) {
    overrideMap.set(
      `${override.origin}|${override.destination}`,
      override.multiplier,
    );
  }

  const routes: PricedRoute[] = [];

  for (const origin of SERVICE_ORIGINS) {
    for (const destination of SERVICE_DESTINATIONS) {
      if (origin === destination) continue;

      const defaultMultiplier = getRouteMultiplier(origin, destination);
      const direct = overrideMap.get(`${origin}|${destination}`);
      const reverse = overrideMap.get(`${destination}|${origin}`);
      const effectiveMultiplier = direct ?? reverse ?? defaultMultiplier;

      routes.push({
        origin,
        destination,
        distanceKm: getDestinationDistanceKm(destination),
        defaultMultiplier,
        effectiveMultiplier,
        isOverride: direct !== undefined || reverse !== undefined,
      });
    }
  }

  return routes.sort((a, b) => {
    const byOrigin = a.origin.localeCompare(b.origin);
    if (byOrigin !== 0) return byOrigin;
    return a.destination.localeCompare(b.destination);
  });
}
