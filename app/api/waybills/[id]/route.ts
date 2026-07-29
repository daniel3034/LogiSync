import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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

type WaybillUpdatePayload = {
  driverId?: string | null;
  status?: string;
};

/**
 * GET /api/waybills/:id
 * Fetch a single waybill by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const waybill = await prisma.waybill.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            truckSize: true,
          },
        },
      },
    });

    if (!waybill) {
      return NextResponse.json({ error: "Waybill not found" }, { status: 404 });
    }

    return NextResponse.json(waybill, { status: 200 });
  } catch (error) {
    console.error("Error fetching waybill:", error);
    return NextResponse.json(
      { error: "Failed to fetch waybill" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/waybills/:id
 * Update waybill assignment/status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as WaybillUpdatePayload;

    const existingWaybill = await prisma.waybill.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingWaybill) {
      return NextResponse.json({ error: "Waybill not found" }, { status: 404 });
    }

    const data: { driverId?: string | null; status?: string } = {};

    if (Object.prototype.hasOwnProperty.call(body, "driverId")) {
      const normalizedDriverId = body.driverId?.trim() || null;

      if (normalizedDriverId) {
        const driver = await prisma.driver.findUnique({
          where: { id: normalizedDriverId },
          select: { id: true },
        });

        if (!driver) {
          return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }
      }

      data.driverId = normalizedDriverId;
    }

    if (Object.prototype.hasOwnProperty.call(body, "status")) {
      const status = body.status?.trim();
      const allowedStatuses = ["pending", "in_transit", "delivered"];

      if (!status || !allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status. Allowed: pending, in_transit, delivered" },
          { status: 400 }
        );
      }

      data.status = status;
    }

    const updatedWaybill = await prisma.waybill.update({
      where: { id },
      data,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            truckSize: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWaybill, { status: 200 });
  } catch (error) {
    console.error("Error updating waybill:", error);
    return NextResponse.json(
      { error: "Failed to update waybill" },
      { status: 500 }
    );
  }
}
