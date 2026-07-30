import {prisma} from "@/lib/prisma"
import { getRouteMultiplier } from "@/lib/waybill-options";

export async function getEffectiveRouteMultiplier(
  origin: string,
  destination: string
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
