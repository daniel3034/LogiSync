import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Use global to avoid creating multiple PrismaClient instances
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: "file:./prisma/dev.db",
    }),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * GET /api/drivers/:id
 * Fetch a single driver by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { waybills: true },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json(driver, { status: 200 });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/drivers/:id
 * Update a driver
 * Body: Partial driver object (name, phone, truckSize, preferredCities)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // If phone is being updated, check uniqueness
    if (body.phone && body.phone !== existingDriver.phone) {
      const phoneExists = await prisma.driver.findUnique({
        where: { phone: body.phone },
      });

      if (phoneExists) {
        return NextResponse.json(
          { error: "Phone number already in use" },
          { status: 409 }
        );
      }
    }

    // Update driver
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedDriver, { status: 200 });
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drivers/:id
 * Delete a driver
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Delete driver (waybills cascade delete due to schema)
    await prisma.driver.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Driver deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 }
    );
  }
}
