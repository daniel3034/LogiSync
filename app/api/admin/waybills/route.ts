import { NextResponse } from "next/server";
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

/**
 * GET /api/admin/waybills
 * Internal endpoint with full waybill financial and assignment details.
 */
export async function GET() {
  try {
    const waybills = await prisma.waybill.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(waybills, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin waybills:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin waybills" },
      { status: 500 }
    );
  }
}
