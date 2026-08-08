"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DownloadWaybillPdfButton from "../components/DownloadWaybillPdfButton";

type Waybill = {
	id: string;
	senderName: string;
	receiverName: string;
	origin: string;
	destination: string;
	status: string;
	clientCost: number;
	createdAt: string;
};

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

export default function DashboardClient() {
	const [waybills, setWaybills] = useState<Waybill[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState("all");

	useEffect(() => {
		const loadWaybills = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const query = statusFilter === "all" ? "" : `?status=${statusFilter}`;
				const response = await fetch(`/api/waybills${query}`, { cache: "no-store" });
				const data = (await response.json()) as Waybill[] | { error?: string };

				if (!response.ok) {
					throw new Error("error" in data ? data.error || "Failed to fetch waybills" : "Failed to fetch waybills");
				}

				setWaybills(Array.isArray(data) ? data : []);
			} catch (loadError) {
				const message = loadError instanceof Error ? loadError.message : "Failed to fetch waybills";
				setError(message);
			} finally {
				setIsLoading(false);
			}
		};

		void loadWaybills();
	}, [statusFilter]);

	const metrics = useMemo(() => {
		const totalAmount = waybills.reduce((accumulator, waybill) => accumulator + waybill.clientCost, 0);

		return {
			totalWaybills: waybills.length,
			totalAmount,
		};
	}, [waybills]);

	return (
		<section className="mx-auto max-w-7xl">
			<div className="rounded-2xl bg-white p-6 shadow-lg">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-3xl font-bold text-zinc-900">Waybill Dashboard</h1>
						<p className="mt-1 text-sm text-zinc-600">
							Monitor waybill activity and total shipment amounts in real time.
						</p>
					</div>

					<Link
						href="/waybill"
						className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
					>
						New Waybill
					</Link>
				</div>

				<div className="mt-6 grid gap-4 md:grid-cols-2">
					<article className="rounded-xl bg-slate-900 p-4 text-slate-100">
						<p className="text-xs uppercase tracking-[0.15em] text-slate-300">Waybills</p>
						<p className="mt-2 text-3xl font-bold">{metrics.totalWaybills}</p>
					</article>
					<article className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
						<p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Total Amount</p>
						<p className="mt-2 text-2xl font-bold text-zinc-900">{formatMoney(metrics.totalAmount)}</p>
					</article>
				</div>

				<div className="mt-6 flex items-center gap-2">
					<label htmlFor="status-filter" className="text-sm font-medium text-zinc-700">
						Filter by status:
					</label>
					<select
						id="status-filter"
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value)}
						className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900"
					>
						<option value="all">All</option>
						<option value="pending">Pending</option>
						<option value="in_transit">In transit</option>
						<option value="delivered">Delivered</option>
					</select>
				</div>

				<div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-zinc-200">
					<table className="min-w-full divide-y divide-zinc-200 text-sm">
						<thead className="bg-zinc-50">
							<tr>
								<th className="px-4 py-3 text-left font-semibold text-zinc-600">Waybill</th>
								<th className="px-4 py-3 text-left font-semibold text-zinc-600">Route</th>
								<th className="px-4 py-3 text-left font-semibold text-zinc-600">Status</th>
								<th className="px-4 py-3 text-left font-semibold text-zinc-600">Total Amount</th>
								<th className="px-4 py-3 text-left font-semibold text-zinc-600">PDF</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-zinc-100 bg-white">
							{isLoading ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
										Loading waybills...
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-red-600">
										{error}
									</td>
								</tr>
							) : waybills.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
										No waybills found. Create one in the waybill form.
									</td>
								</tr>
							) : (
								waybills.map((waybill) => (
									<tr key={waybill.id} className="hover:bg-zinc-50">
										<td className="px-4 py-3">
											<Link href={`/waybill/${waybill.id}`} className="group block">
												<p className="font-medium text-blue-700 group-hover:underline">{waybill.id.slice(-8).toUpperCase()}</p>
												<p className="text-xs text-zinc-500">{new Date(waybill.createdAt).toLocaleDateString()}</p>
											</Link>
										</td>
										<td className="px-4 py-3">
											<p className="font-medium text-zinc-800">{waybill.origin}{" -> "}{waybill.destination}</p>
											<p className="text-xs text-zinc-500">{waybill.senderName}{" -> "}{waybill.receiverName}</p>
										</td>
										<td className="px-4 py-3">
											<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(waybill.status)}`}>
												{waybill.status.replace("_", " ")}
											</span>
										</td>
										<td className="px-4 py-3 font-medium text-zinc-800">{formatMoney(waybill.clientCost)}</td>
										<td className="px-4 py-3">
											<DownloadWaybillPdfButton waybillId={waybill.id} />
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}
