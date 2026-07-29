export const PRICING_CONFIG = {
  volumetricWeightFactor: 250, // 1 m3 = 250 kg billable weight
  baseFee: 12,
  kgRate: 0.65,
  kmRate: 0.085,
  fuelSurchargeRate: 0.08,
  driverShareRate: 0.62,
  minDriverPayment: 15,
  distanceBrackets: [
    { maxKm: 30, multiplier: 1.0 },
    { maxKm: 100, multiplier: 1.08 },
    { maxKm: 300, multiplier: 1.18 },
    { maxKm: 600, multiplier: 1.3 },
    { maxKm: Number.POSITIVE_INFINITY, multiplier: 1.45 },
  ],
} as const;
