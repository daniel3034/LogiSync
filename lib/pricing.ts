import {
  getDestinationDistanceKm,
  getRouteMultiplier,
} from "@/lib/waybill-options";
import { PRICING_CONFIG } from "@/lib/pricing-config";

export type PricingInput = {
  origin: string;
  weight: number;
  volume: number;
  destination: string;
  routeMultiplierOverride?: number;
};

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function getDistanceMultiplier(distanceKm: number) {
  for (const bracket of PRICING_CONFIG.distanceBrackets) {
    if (distanceKm <= bracket.maxKm) {
      return bracket.multiplier;
    }
  }

  // Fallback safeguard. With current config this branch is unreachable.
  return 1;
}

export function calculatePricing(input: PricingInput) {
  const distanceKm = getDestinationDistanceKm(input.destination);
  const destinationMultiplier = getDistanceMultiplier(distanceKm);
  const routeMultiplier =
    input.routeMultiplierOverride ?? getRouteMultiplier(input.origin, input.destination);
  const volumetricWeight = input.volume * PRICING_CONFIG.volumetricWeightFactor;
  const billableWeight = Math.max(input.weight, volumetricWeight);

  const baseCost = PRICING_CONFIG.baseFee + billableWeight * PRICING_CONFIG.kgRate;
  const distanceCharge = distanceKm * PRICING_CONFIG.kmRate;
  const destinationAdjustedCost =
    (baseCost + distanceCharge) * destinationMultiplier * routeMultiplier;
  const fuelSurcharge = destinationAdjustedCost * PRICING_CONFIG.fuelSurchargeRate;

  const clientCost = destinationAdjustedCost + fuelSurcharge;
  const driverPayment = Math.max(
    clientCost * PRICING_CONFIG.driverShareRate,
    PRICING_CONFIG.minDriverPayment
  );
  const netMargin = clientCost - driverPayment;
  const marginPercent = clientCost > 0 ? (netMargin / clientCost) * 100 : 0;

  return {
    clientCost: roundCurrency(clientCost),
    driverPayment: roundCurrency(driverPayment),
    netMargin: roundCurrency(netMargin),
    marginPercent: roundCurrency(marginPercent),
    breakdown: {
      baseFee: roundCurrency(PRICING_CONFIG.baseFee),
      billableWeightKg: roundCurrency(billableWeight),
      volumetricWeightKg: roundCurrency(volumetricWeight),
      distanceKm: roundCurrency(distanceKm),
      distanceCharge: roundCurrency(distanceCharge),
      destinationMultiplier,
      routeMultiplier,
      fuelSurcharge: roundCurrency(fuelSurcharge),
    },
  };
}