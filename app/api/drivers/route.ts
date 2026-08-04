import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";
import { matchesCity } from "@/lib/cities";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/drivers
 * Fetch all drivers with optional city filter. ADMIN only.
 * Query params:
 *   - city: Filter drivers by preferred city (optional, whole-city match)
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city")?.trim() ?? "";

    // `contains` is only a prefilter over the comma-separated column; the exact
    // whole-city match happens in `matchesCity`. See lib/cities.ts.
    const candidates = await prisma.driver.findMany({
      where: city
        ? { preferredCities: { contains: city, mode: "insensitive" } }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    const drivers = city
      ? candidates.filter((driver) => matchesCity(driver.preferredCities, city))
      : candidates;

    return NextResponse.json(drivers, { status: 200 });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drivers
 * Create a new driver
 * Body:
 *   - name: string (required)
 *   - phone: string (required, unique)
 *   - truckSize: string (required)
 *   - preferredCities: string (required, comma-separated cities)
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { name, phone, truckSize, preferredCities } = body;

    // Validate required fields
    if (!name || !phone || !truckSize || !preferredCities) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, phone, truckSize, preferredCities",
        },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { phone },
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: "Driver with this phone number already exists" },
        { status: 409 }
      );
    }

    // Create driver
    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        truckSize,
        preferredCities, // Store as comma-separated string
      },
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 }
    );
  }
}
