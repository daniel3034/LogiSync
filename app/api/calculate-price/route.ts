import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { calculatePricing, type PricingInput } from "@/lib/pricing";
import { resolveDestination, resolveOrigin } from "@/lib/waybill-options";
import { getEffectiveRouteMultiplier } from "@/lib/server/route-pricing";

// Use global to avoid creating multiple PrismaClient instances
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * POST /api/calculate-price
 * Body:
 *  - weight: number (kg)
 *  - volume: number (m3)
 *  - destination: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<PricingInput>;

    const origin = body.origin?.trim();
    const weight = Number(body.weight);
    const volume = Number(body.volume);
    const destination = body.destination?.trim();

    if (!origin) {
      return NextResponse.json(
        { error: "Invalid origin. Must be selected from the origin list." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      return NextResponse.json(
        { error: "Invalid weight. Must be a number greater than 0." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(volume) || volume <= 0) {
      return NextResponse.json(
        { error: "Invalid volume. Must be a number greater than 0." },
        { status: 400 }
      );
    }

    if (!destination) {
      return NextResponse.json(
        { error: "Invalid destination. Must be a non-empty string." },
        { status: 400 }
      );
    }

    const canonicalDestination = resolveDestination(destination);
    const canonicalOrigin = resolveOrigin(origin);

    if (!canonicalDestination) {
      return NextResponse.json(
        { error: "Invalid destination. Please select one from the destination list." },
        { status: 400 }
      );
    }

    if (!canonicalOrigin) {
      return NextResponse.json(
        { error: "Invalid origin. Please select one from the origin list." },
        { status: 400 }
      );
    }

    const routeMultiplierOverride = await getEffectiveRouteMultiplier(
      prisma,
      canonicalOrigin,
      canonicalDestination
    );

    const pricing = calculatePricing({
      origin: canonicalOrigin,
      weight,
      volume,
      destination: canonicalDestination,
      routeMultiplierOverride,
    });

    return NextResponse.json(
      {
        clientCost: pricing.clientCost,
        breakdown: pricing.breakdown,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error calculating price:", error);
    return NextResponse.json(
      { error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}
