import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SERVICE_DESTINATIONS,
  SERVICE_ORIGINS,
  getRouteMultiplier,
  resolveDestination,
  resolveOrigin,
} from "@/lib/waybill-options";

type RoutePricingPayload = {
  origin?: string;
  destination?: string;
  multiplier?: number;
};

/**
 * GET /api/admin/route-pricing
 * Returns explicit DB overrides and route metadata.
 */
export async function GET() {
  try {
    const overrides = await prisma.routePricing.findMany({
      orderBy: [{ origin: "asc" }, { destination: "asc" }],
    });

    const enrichedOverrides = overrides.map((item) => ({
      id: item.id,
      origin: item.origin,
      destination: item.destination,
      multiplier: item.multiplier,
      defaultMultiplier: getRouteMultiplier(item.origin, item.destination),
    }));

    return NextResponse.json(
      {
        origins: SERVICE_ORIGINS,
        destinations: SERVICE_DESTINATIONS,
        overrides: enrichedOverrides,
      },
      { status: 200 }
    );
  } catch (error) {
    console.warn("Route pricing overrides unavailable, using fallback metadata.", error);
    return NextResponse.json(
      {
        origins: SERVICE_ORIGINS,
        destinations: SERVICE_DESTINATIONS,
        overrides: [],
        warning:
          "Route pricing table not available yet. Apply Prisma schema changes to enable persisted overrides.",
      },
      { status: 200 }
    );
  }
}

/**
 * PUT /api/admin/route-pricing
 * Upsert a route-specific pricing multiplier override.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as RoutePricingPayload;
    const origin = body.origin?.trim();
    const destination = body.destination?.trim();
    const multiplier = Number(body.multiplier);

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination are required" },
        { status: 400 }
      );
    }

    if (origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json(
        { error: "Origin and destination must be different" },
        { status: 400 }
      );
    }

    const canonicalOrigin = resolveOrigin(origin);
    const canonicalDestination = resolveDestination(destination);

    if (!canonicalOrigin || !canonicalDestination) {
      return NextResponse.json(
        { error: "Invalid origin or destination" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 3) {
      return NextResponse.json(
        { error: "Multiplier must be a number greater than 0 and less than or equal to 3" },
        { status: 400 }
      );
    }

    const saved = await prisma.routePricing.upsert({
      where: {
        route_pricing_origin_destination_key: {
          origin: canonicalOrigin,
          destination: canonicalDestination,
        },
      },
      create: {
        origin: canonicalOrigin,
        destination: canonicalDestination,
        multiplier,
      },
      update: {
        multiplier,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    console.error("Error upserting route pricing override:", error);
    return NextResponse.json(
      { error: "Failed to save route pricing override" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/route-pricing?origin=...&destination=...
 * Deletes an existing route-specific override.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get("origin")?.trim();
    const destination = searchParams.get("destination")?.trim();

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination are required" },
        { status: 400 }
      );
    }

    const canonicalOrigin = resolveOrigin(origin);
    const canonicalDestination = resolveDestination(destination);

    if (!canonicalOrigin || !canonicalDestination) {
      return NextResponse.json(
        { error: "Invalid origin or destination" },
        { status: 400 }
      );
    }

    await prisma.routePricing.delete({
      where: {
        route_pricing_origin_destination_key: {
          origin: canonicalOrigin,
          destination: canonicalDestination,
        },
      },
    });

    return NextResponse.json({ message: "Override removed" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting route pricing override:", error);
    return NextResponse.json(
      { error: "Failed to remove route pricing override" },
      { status: 500 }
    );
  }
}
