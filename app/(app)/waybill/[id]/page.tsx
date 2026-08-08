import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function statusColor(status: string) {
  if (status === "delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "in_transit") return "bg-amber-100 text-amber-700";
  return "bg-zinc-200 text-zinc-700";
}

export default async function WaybillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

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

  if (!waybill) notFound();

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-blue-700 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Waybill</p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900">
              {waybill.id.slice(-8).toUpperCase()}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Created {new Date(waybill.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor(waybill.status)}`}>
              {waybill.status.replace("_", " ")}
            </span>
            <a
              href={`/api/waybills/${waybill.id}/pdf`}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Download PDF
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sender</p>
            <p className="mt-2 font-medium text-zinc-900">{waybill.senderName}</p>
            <p className="text-sm text-zinc-600">{waybill.senderPhone}</p>
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Receiver</p>
            <p className="mt-2 font-medium text-zinc-900">{waybill.receiverName}</p>
            <p className="text-sm text-zinc-600">{waybill.receiverPhone}</p>
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Route</p>
            <p className="mt-2 font-medium text-zinc-900">{waybill.origin}</p>
            <p className="text-sm text-zinc-500">→</p>
            <p className="font-medium text-zinc-900">{waybill.destination}</p>
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cargo</p>
            <p className="mt-2 text-sm text-zinc-700">{waybill.weight} kg · {waybill.volume} m³</p>
            {waybill.description ? (
              <p className="mt-1 text-sm text-zinc-600">{waybill.description}</p>
            ) : null}
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pricing</p>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Client cost</dt>
                <dd className="font-semibold text-zinc-900">{formatMoney(waybill.clientCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Driver payment</dt>
                <dd className="text-zinc-700">{formatMoney(waybill.driverPayment)}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-1">
                <dt className="text-zinc-500">Net margin</dt>
                <dd className="font-semibold text-emerald-700">{formatMoney(waybill.netMargin)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Driver</p>
            {waybill.driver ? (
              <div className="mt-2">
                <p className="font-medium text-zinc-900">{waybill.driver.name}</p>
                <p className="text-sm text-zinc-600">{waybill.driver.phone}</p>
                <p className="text-sm text-zinc-500">{waybill.driver.truckSize} truck</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">Not assigned</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
