import { NextRequest, NextResponse } from "next/server";

type PricingInput = {
  weight: number;
  volume: number;
  destination: string;
};

const VOLUMETRIC_WEIGHT_FACTOR = 250; // 1 m3 = 250 kg billable weight
const BASE_FEE = 12;
const KG_RATE = 0.65;
const FUEL_SURCHARGE_RATE = 0.08;
const DRIVER_SHARE_RATE = 0.62;
const MIN_DRIVER_PAYMENT = 15;

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function getDestinationMultiplier(destination: string) {
  const normalized = destination.trim().toLowerCase();

  const localCities = ["san salvador", "santa ana", "soyapango", "apopa"];
  const regionalCities = [
    "guatemala city",
    "tegucigalpa",
    "managua",
    "san jose",
    "panama city",
  ];

  if (localCities.some((city) => normalized.includes(city))) {
    return 1.0;
  }

  if (regionalCities.some((city) => normalized.includes(city))) {
    return 1.25;
  }

  return 1.5;
}

function calculatePricing(input: PricingInput) {
  const destinationMultiplier = getDestinationMultiplier(input.destination);
  const volumetricWeight = input.volume * VOLUMETRIC_WEIGHT_FACTOR;
  const billableWeight = Math.max(input.weight, volumetricWeight);

  const baseCost = BASE_FEE + billableWeight * KG_RATE;
  const destinationAdjustedCost = baseCost * destinationMultiplier;
  const fuelSurcharge = destinationAdjustedCost * FUEL_SURCHARGE_RATE;

  const clientCost = destinationAdjustedCost + fuelSurcharge;
  const driverPayment = Math.max(clientCost * DRIVER_SHARE_RATE, MIN_DRIVER_PAYMENT);
  const netMargin = clientCost - driverPayment;
  const marginPercent = clientCost > 0 ? (netMargin / clientCost) * 100 : 0;

  return {
    clientCost: roundCurrency(clientCost),
    driverPayment: roundCurrency(driverPayment),
    netMargin: roundCurrency(netMargin),
    marginPercent: roundCurrency(marginPercent),
    breakdown: {
      baseFee: roundCurrency(BASE_FEE),
      billableWeightKg: roundCurrency(billableWeight),
      volumetricWeightKg: roundCurrency(volumetricWeight),
      destinationMultiplier,
      fuelSurcharge: roundCurrency(fuelSurcharge),
    },
  };
}

/**
 * POST /api/calculate-price
 * Body:
 *  - weight: number (kg)
 *  - volume: number (m3)
 *  - destination: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<PricingInput>;

    const weight = Number(body.weight);
    const volume = Number(body.volume);
    const destination = body.destination?.trim();

    if (!Number.isFinite(weight) || weight <= 0) {
      return NextResponse.json(
        { error: "Invalid weight. Must be a number greater than 0." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(volume) || volume <= 0) {
      return NextResponse.json(
        { error: "Invalid volume. Must be a number greater than 0." },
        { status: 400 }
      );
    }

    if (!destination) {
      return NextResponse.json(
        { error: "Invalid destination. Must be a non-empty string." },
        { status: 400 }
      );
    }

    const pricing = calculatePricing({ weight, volume, destination });

    return NextResponse.json(pricing, { status: 200 });
  } catch (error) {
    console.error("Error calculating price:", error);
    return NextResponse.json(
      { error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}
