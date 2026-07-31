-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "truckSize" TEXT NOT NULL,
    "preferredCities" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "waybills" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "clientCost" DOUBLE PRECISION NOT NULL,
    "driverPayment" DOUBLE PRECISION NOT NULL,
    "netMargin" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "waybills_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "route_pricing" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "route_pricing_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "drivers_phone_key" ON "drivers"("phone");
-- CreateIndex
CREATE UNIQUE INDEX "route_pricing_origin_destination_key" ON "route_pricing"("origin", "destination");
-- AddForeignKey
ALTER TABLE "waybills"
ADD CONSTRAINT "waybills_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE
SET NULL ON UPDATE CASCADE;