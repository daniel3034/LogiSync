"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import DownloadWaybillPdfButton from "../components/DownloadWaybillPdfButton";
import {
	SERVICE_DESTINATIONS,
	SERVICE_ORIGINS,
} from "@/lib/waybill-options";

type PricingResponse = {
	clientCost: number;
	breakdown: {
		baseFee: number;
		billableWeightKg: number;
		volumetricWeightKg: number;
		distanceKm: number;
		distanceCharge: number;
		destinationMultiplier: number;
		routeMultiplier: number;
		fuelSurcharge: number;
	};
};

type WaybillForm = {
	origin: string;
	senderName: string;
	senderPhone: string;
	receiverName: string;
	receiverPhone: string;
	destination: string;
	description: string;
	weight: string;
	volume: string;
};

const initialForm: WaybillForm = {
	origin: "",
	senderName: "",
	senderPhone: "",
	receiverName: "",
	receiverPhone: "",
	destination: "",
	description: "",
	weight: "",
	volume: "",
};

function formatMoney(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	}).format(amount);
}

export default function WaybillPage() {
	const [form, setForm] = useState<WaybillForm>(initialForm);
	const [pricing, setPricing] = useState<PricingResponse | null>(null);
	const [isCalculating, setIsCalculating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [createdWaybillId, setCreatedWaybillId] = useState<string | null>(null);

	const handleChange = (field: keyof WaybillForm, value: string) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const calculatePrice = async () => {
		setFormError(null);
		setSuccessMessage(null);
		setCreatedWaybillId(null);

		const weight = Number(form.weight);
		const volume = Number(form.volume);

		if (!form.destination.trim()) {
			setFormError("Destination is required to calculate pricing.");
			return;
		}

		if (!form.origin.trim()) {
			setFormError("Origin is required to calculate pricing.");
			return;
		}

		if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(volume) || volume <= 0) {
			setFormError("Weight and volume must be numbers greater than 0.");
			return;
		}

		setIsCalculating(true);

		try {
			const response = await fetch("/api/calculate-price", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
						origin: form.origin,
					weight,
					volume,
					destination: form.destination,
				}),
			});

			const data = (await response.json()) as PricingResponse | { error?: string };

			if (!response.ok) {
				throw new Error("error" in data ? data.error || "Failed to calculate pricing" : "Failed to calculate pricing");
			}

			setPricing(data as PricingResponse);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to calculate pricing";
			setFormError(message);
		} finally {
			setIsCalculating(false);
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		setSuccessMessage(null);
		setCreatedWaybillId(null);

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/waybills", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...form,
					weight: Number(form.weight),
					volume: Number(form.volume),
				}),
			});

			const data = (await response.json()) as { id?: string; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Failed to create waybill");
			}

			setSuccessMessage(`Waybill ${data.id || ""} created successfully.`.trim());
			setCreatedWaybillId(data.id ?? null);
			setForm(initialForm);
			setPricing(null);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to create waybill";
			setFormError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section className="mx-auto max-w-7xl">
			<div className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white shadow-xl">
				<p className="text-sm uppercase tracking-[0.2em] text-blue-200">Digital waybill</p>
				<h1 className="mt-2 text-3xl font-bold">Create New Shipment Waybill</h1>
				<p className="mt-2 max-w-3xl text-sm text-blue-100">
					Register sender, recipient, and cargo details to issue a digital waybill.
				</p>
			</div>

			<div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
				<form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-lg">
					<div className="grid gap-6 md:grid-cols-2">
						<fieldset className="rounded-xl border border-zinc-200 p-4">
							<legend className="px-2 text-sm font-semibold text-zinc-900">Sender</legend>

							<label className="mt-2 block text-sm font-medium text-zinc-900">Name</label>
							<input
								required
								value={form.senderName}
								onChange={(event) => handleChange("senderName", event.target.value)}
								className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-blue-600"
								placeholder="Business or person"
							/>

							<label className="mt-3 block text-sm font-medium text-zinc-900">Phone</label>
							<input
								required
								value={form.senderPhone}
								onChange={(event) => handleChange("senderPhone", event.target.value)}
								className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-blue-600"
								placeholder="+503 ..."
							/>
						</fieldset>

						<fieldset className="rounded-xl border border-zinc-200 p-4">
							<legend className="px-2 text-sm font-semibold text-zinc-900">Recipient</legend>

							<label className="mt-2 block text-sm font-medium text-zinc-900">Name</label>
							<input
								required
								value={form.receiverName}
								onChange={(event) => handleChange("receiverName", event.target.value)}
								className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-blue-600"
								placeholder="Person receiving cargo"
							/>

							<label className="mt-3 block text-sm font-medium text-zinc-900">Phone</label>
							<input
								required
								value={form.receiverPhone}
								onChange={(event) => handleChange("receiverPhone", event.target.value)}
								className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-blue-600"
								placeholder="+503 ..."
							/>
						</fieldset>
					</div>

					<div className="mt-6 grid gap-4 md:grid-cols-2">
						<div>
							<label className="block text-sm font-medium text-zinc-900">Origin</label>
							<select
								required
								value={form.origin}
								onChange={(event) => handleChange("origin", event.target.value)}
								className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-600"
							>
								<option value="">Select origin</option>
								{SERVICE_ORIGINS.map((origin) => (
									<option key={origin} value={origin}>
										{origin}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-900">Destination</label>
							<select
								required
								value={form.destination}
								onChange={(event) => handleChange("destination", event.target.value)}
								className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-600"
							>
								<option value="">Select destination</option>
								{SERVICE_DESTINATIONS.map((destination) => (
									<option key={destination} value={destination}>
										{destination}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-900">Weight (kg)</label>
							<input
								required
								type="number"
								min="0.01"
								step="0.01"
								value={form.weight}
								onChange={(event) => handleChange("weight", event.target.value)}
								className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-600"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-900">Volume (m3)</label>
							<input
								required
								type="number"
								min="0.01"
								step="0.01"
								value={form.volume}
								onChange={(event) => handleChange("volume", event.target.value)}
								className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-600"
							/>
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-zinc-900">Status</label>
							<input
								value="Pending (set internally)"
								disabled
								className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-700"
							/>
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-zinc-900">Cargo Description</label>
							<textarea
								value={form.description}
								onChange={(event) => handleChange("description", event.target.value)}
								className="mt-1 min-h-24 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-blue-600"
								placeholder="Boxes, fragile items, special handling notes..."
							/>
						</div>
					</div>

					{formError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
					{successMessage && (
						<div className="mt-4 flex flex-col gap-3 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700 sm:flex-row sm:items-center sm:justify-between">
							<p>
								{successMessage} Visit{" "}
								<Link href="/dashboard" className="font-semibold underline">
									dashboard
								</Link>
								.
							</p>
							{createdWaybillId && (
								<DownloadWaybillPdfButton waybillId={createdWaybillId} size="md" />
							)}
						</div>
					)}

					<div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
						<button
							type="button"
							onClick={calculatePrice}
							disabled={isCalculating}
							className="w-full rounded-lg border border-blue-700 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
						>
							{isCalculating ? "Calculating..." : "Calculate Pricing"}
						</button>

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
						>
							{isSubmitting ? "Saving..." : "Create Waybill"}
						</button>
					</div>
				</form>

				<aside className="rounded-2xl bg-slate-950 p-5 text-slate-100 shadow-lg">
					<h2 className="text-lg font-semibold">Waybill Preview</h2>
					<p className="mt-1 text-sm text-slate-300">Summary inspired by your physical waybill format.</p>

					<div className="mt-4 space-y-3 text-sm">
						<div className="rounded-lg bg-slate-900/70 p-3">
							<p className="text-xs uppercase tracking-wide text-slate-400">Sender</p>
							<p className="font-medium">{form.senderName || "-"}</p>
							<p className="text-slate-300">{form.senderPhone || "-"}</p>
						</div>

						<div className="rounded-lg bg-slate-900/70 p-3">
							<p className="text-xs uppercase tracking-wide text-slate-400">Recipient</p>
							<p className="font-medium">{form.receiverName || "-"}</p>
							<p className="text-slate-300">{form.receiverPhone || "-"}</p>
						</div>

						<div className="rounded-lg bg-slate-900/70 p-3">
							<p className="text-xs uppercase tracking-wide text-slate-400">Route</p>
							<p>
								{form.origin || "No origin yet"} {" -> "} {form.destination || "No destination yet"}
							</p>
							<p className="text-slate-300">Driver assignment handled internally by admin.</p>
						</div>
					</div>

					<div className="mt-5 rounded-lg bg-blue-900/30 p-4">
						<p className="text-xs uppercase tracking-wide text-blue-200">Financial Summary</p>
						<p className="mt-2 text-sm text-blue-100">
							Total Amount: <span className="font-semibold">{pricing ? formatMoney(pricing.clientCost) : "-"}</span>
						</p>
						<p className="mt-2 text-xs text-blue-200">
							Billable Weight: {pricing ? `${pricing.breakdown.billableWeightKg} kg` : "-"}
						</p>
						<p className="mt-1 text-xs text-blue-200">
							Route Factor: {pricing ? pricing.breakdown.routeMultiplier.toFixed(2) : "-"}
						</p>
					</div>
				</aside>
			</div>
		</section>
	);
}
