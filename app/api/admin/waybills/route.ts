import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
