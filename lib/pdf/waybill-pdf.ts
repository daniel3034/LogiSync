import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Driver = {
  name: string;
  phone: string;
  truckSize: string;
} | null;

type WaybillData = {
  id: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  origin: string;
  destination: string;
  weight: number;
  volume: number;
  description: string | null;
  clientCost: number;
  driverPayment: number;
  netMargin: number;
  status: string;
  createdAt: Date;
  driver: Driver;
};

export async function generateWaybillPdf(waybill: WaybillData) {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([595, 842]); // A4

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText("LOGISYNC", {
    x: 50,
    y: 800,
    size: 24,
    font: bold,
    color: rgb(0.1, 0.3, 0.8),
  });

  page.drawText("Digital Waybill", {
    x: 50,
    y: 775,
    size: 16,
    font,
  });

  let y = 730;

  const line = (label: string, value: string) => {
    page.drawText(`${label}: ${value}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 22;
  };

  line("Waybill ID", waybill.id);
  line("Status", waybill.status);

  y -= 10;

  line("Sender", waybill.senderName);
  line("Sender Phone", waybill.senderPhone);

  y -= 10;

  line("Receiver", waybill.receiverName);
  line("Receiver Phone", waybill.receiverPhone);

  y -= 10;

  line("Origin", waybill.origin);
  line("Destination", waybill.destination);

  y -= 10;

  line("Weight", `${waybill.weight} kg`);
  line("Volume", `${waybill.volume} m³`);

  if (waybill.description) {
    line("Description", waybill.description);
  }

  y -= 10;

  line("Client Cost", `$${waybill.clientCost.toFixed(2)}`);
  line("Driver Payment", `$${waybill.driverPayment.toFixed(2)}`);
  line("Net Margin", `$${waybill.netMargin.toFixed(2)}`);

  y -= 10;

  line(
    "Driver",
    waybill.driver
      ? `${waybill.driver.name} (${waybill.driver.truckSize})`
      : "Not Assigned"
  );

  return await pdfDoc.save();
}