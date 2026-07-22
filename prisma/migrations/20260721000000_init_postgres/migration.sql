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
    "driverId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "drivers_phone_key" ON "drivers"("phone");

-- AddForeignKey
ALTER TABLE "waybills" ADD CONSTRAINT "waybills_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

