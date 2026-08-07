import { prisma } from "@/lib/prisma";

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default async function VerifyWaybillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Narrow select on purpose — never reuse a query that touches financials.
  const waybill = await prisma.waybill.findUnique({
    where: { id },
    select: {
      id: true,
      senderName: true,
      receiverName: true,
      origin: true,
      destination: true,
      weight: true,
      volume: true,
      status: true,
      description: true,
      driver: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!waybill) {
    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            LogiSync
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            Waybill not found
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            This verification link does not match a shipment in our system.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          LogiSync
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">
          Cargo verification
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Waybill {waybill.id.slice(-8).toUpperCase()}
        </p>

        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="mt-0.5 text-base font-semibold capitalize text-zinc-900">
              {statusLabel(waybill.status)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Route</dt>
            <dd className="mt-0.5 text-base font-medium text-zinc-900">
              {waybill.origin} → {waybill.destination}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Sender</dt>
            <dd className="mt-0.5 text-base font-medium text-zinc-900">
              {waybill.senderName}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Receiver</dt>
            <dd className="mt-0.5 text-base font-medium text-zinc-900">
              {waybill.receiverName}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-zinc-500">Weight</dt>
              <dd className="mt-0.5 text-base font-medium text-zinc-900">
                {waybill.weight} kg
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Volume</dt>
              <dd className="mt-0.5 text-base font-medium text-zinc-900">
                {waybill.volume} m³
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-zinc-500">Driver</dt>
            <dd className="mt-0.5 text-base font-medium text-zinc-900">
              {waybill.driver?.name ?? "Unassigned"}
            </dd>
          </div>
          {waybill.description ? (
            <div>
              <dt className="text-zinc-500">Description</dt>
              <dd className="mt-0.5 text-base font-medium text-zinc-900">
                {waybill.description}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </main>
  );
}
