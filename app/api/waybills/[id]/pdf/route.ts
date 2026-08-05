import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWaybillPdf } from "@/lib/pdf/waybill-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const waybill = await prisma.waybill.findUnique({
      where: { id },
      include: {
        driver: true,
      },
    });

    if (!waybill) {
      return NextResponse.json(
        { error: "Waybill not found" },
        { status: 404 }
      );
    }

    const verificationUrl = new URL(
      `/api/waybills/${waybill.id}`,
      request.nextUrl.origin
    ).toString();

    const pdfBytes = await generateWaybillPdf(waybill, {
      verificationUrl,
    });


    const arrayBuffer = new Uint8Array(pdfBytes).buffer;

    return new NextResponse(arrayBuffer, {
    headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="waybill-${waybill.id}.pdf"`,
    },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);

    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}