import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/waybills
 * Internal endpoint with full waybill financial and assignment details.
 */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

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
