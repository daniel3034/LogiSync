import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { calculatePricing } from "@/lib/pricing";
import { resolveDestination, resolveOrigin } from "@/lib/waybill-options";
import { getEffectiveRouteMultiplier } from "@/lib/server/route-pricing";

type WaybillPayload = {
  origin?: string;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  destination?: string;
  weight?: number;
  volume?: number;
  description?: string;
  status?: string;
};

/**
 * GET /api/waybills
 * Query params:
 *   - status: Filter by status (optional)
 *   - sort: "date" (default, newest first) or "destination" (A–Z, then newest)
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sort = searchParams.get("sort");

    if (sort && sort !== "date" && sort !== "destination") {
      return NextResponse.json(
        { error: 'Invalid sort. Use "date" or "destination".' },
        { status: 400 }
      );
    }

    const waybills = await prisma.waybill.findMany({
      where: status ? { status } : undefined,
      select: {
        id: true,
        senderName: true,
        receiverName: true,
        origin: true,
        destination: true,
        clientCost: true,
        status: true,
        createdAt: true,
      },
      orderBy:
        sort === "destination"
          ? [{ destination: "asc" }, { createdAt: "desc" }]
          : { createdAt: "desc" },
    });

    return NextResponse.json(waybills, { status: 200 });
  } catch (error) {
    console.error("Error fetching waybills:", error);
    return NextResponse.json(
      { error: "Failed to fetch waybills" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/waybills
 * Creates a digital waybill and calculates pricing on the server.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body = (await request.json()) as WaybillPayload;

    if (Object.prototype.hasOwnProperty.call(body, "driverId")) {
      return NextResponse.json(
        { error: "Driver assignment is internal and must be done in admin panel" },
        { status: 403 }
      );
    }

    if (Object.prototype.hasOwnProperty.call(body, "status")) {
      return NextResponse.json(
        { error: "Status updates are internal and must be done in admin panel" },
        { status: 403 }
      );
    }

    const senderName = body.senderName?.trim();
    const senderPhone = body.senderPhone?.trim();
    const receiverName = body.receiverName?.trim();
    const receiverPhone = body.receiverPhone?.trim();
    const origin = body.origin?.trim();
    const destination = body.destination?.trim();
    const description = body.description?.trim() || null;
    const status = "pending";

    const weight = Number(body.weight);
    const volume = Number(body.volume);

    if (
      !senderName ||
      !senderPhone ||
      !receiverName ||
      !receiverPhone ||
      !origin ||
      !destination
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: senderName, senderPhone, receiverName, receiverPhone, origin, destination",
        },
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

    const waybill = await prisma.waybill.create({
      data: {
        driverId: null,
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        origin: canonicalOrigin,
        destination: canonicalDestination,
        weight,
        volume,
        description,
        clientCost: pricing.clientCost,
        driverPayment: pricing.driverPayment,
        netMargin: pricing.netMargin,
        status,
      },
    });

    return NextResponse.json(waybill, { status: 201 });
  } catch (error) {
    console.error("Error creating waybill:", error);
    return NextResponse.json(
      { error: "Failed to create waybill" },
      { status: 500 }
    );
  }
}