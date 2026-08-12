/**
 * Seed demo data: drivers and waybills, so a fresh database has something to
 * show on the dashboard, driver list, and admin assignment flow.
 *
 *   node --run seed:demo    (or: pnpm seed:demo)
 *
 * Idempotent: every row uses a fixed "demo-*" id and is upserted, so
 * re-running updates the same rows instead of duplicating them.
 *
 * Run `pnpm seed:admin` first if you also need an ADMIN account to log in.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { calculatePricing } from "../lib/pricing";
import {
  type InternalWaybillStatus,
  type ServiceDestination,
  type ServiceOrigin,
} from "../lib/waybill-options";
import { type TruckSize } from "../lib/drivers";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type DemoDriver = {
  id: string;
  name: string;
  phone: string;
  truckSize: TruckSize;
  preferredCities: ServiceDestination[];
};

// Preferred cities deliberately overlap (San Salvador, Santa Ana, Guatemala
// City each cover 2-3 drivers) so filtering by city in the drivers list
// visibly narrows the results instead of trivially returning one match.
const DEMO_DRIVERS: DemoDriver[] = [
  {
    id: "demo-driver-1",
    name: "Carlos Martinez",
    phone: "+503-7000-0001",
    truckSize: "small",
    preferredCities: ["San Salvador", "Soyapango"],
  },
  {
    id: "demo-driver-2",
    name: "Elena Ramirez",
    phone: "+503-7000-0002",
    truckSize: "medium",
    preferredCities: ["San Salvador", "Santa Ana"],
  },
  {
    id: "demo-driver-3",
    name: "Jorge Hernandez",
    phone: "+503-7000-0003",
    truckSize: "large",
    preferredCities: ["San Salvador", "Apopa"],
  },
  {
    id: "demo-driver-4",
    name: "Marta Gomez",
    phone: "+503-7000-0004",
    truckSize: "medium",
    preferredCities: ["Santa Ana", "Guatemala City"],
  },
  {
    id: "demo-driver-5",
    name: "Luis Perez",
    phone: "+503-7000-0005",
    truckSize: "large",
    preferredCities: ["Guatemala City", "Tegucigalpa", "Managua"],
  },
  {
    id: "demo-driver-6",
    name: "Sofia Cabrera",
    phone: "+503-7000-0006",
    truckSize: "small",
    preferredCities: ["San Jose", "Panama City"],
  },
];

type DemoWaybill = {
  id: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  origin: ServiceOrigin;
  destination: ServiceDestination;
  weight: number;
  volume: number;
  description: string;
  status: InternalWaybillStatus;
  driverId: string | null;
};

// 4 pending & unassigned (ready for the admin assignment flow), 6 assigned
// across in_transit/delivered so both empty and populated states show up.
const DEMO_WAYBILLS: DemoWaybill[] = [
  {
    id: "demo-waybill-1",
    senderName: "Ana Flores",
    senderPhone: "+503-7100-0001",
    receiverName: "Mario Castillo",
    receiverPhone: "+503-7200-0001",
    origin: "San Salvador",
    destination: "Santa Ana",
    weight: 120,
    volume: 0.8,
    description: "Boxed retail inventory",
    status: "pending",
    driverId: null,
  },
  {
    id: "demo-waybill-2",
    senderName: "Ricardo Solis",
    senderPhone: "+503-7100-0002",
    receiverName: "Patricia Aguilar",
    receiverPhone: "+503-7200-0002",
    origin: "San Salvador",
    destination: "Soyapango",
    weight: 45,
    volume: 0.2,
    description: "Spare parts",
    status: "pending",
    driverId: null,
  },
  {
    id: "demo-waybill-3",
    senderName: "Karla Mejia",
    senderPhone: "+503-7100-0003",
    receiverName: "Oscar Villalta",
    receiverPhone: "+502-7200-0003",
    origin: "Santa Ana",
    destination: "Guatemala City",
    weight: 300,
    volume: 2.1,
    description: "Furniture pallet",
    status: "pending",
    driverId: null,
  },
  {
    id: "demo-waybill-4",
    senderName: "Diego Rivas",
    senderPhone: "+503-7100-0004",
    receiverName: "Gabriela Portillo",
    receiverPhone: "+503-7200-0004",
    origin: "San Salvador",
    destination: "Apopa",
    weight: 60,
    volume: 0.3,
    description: "Electronics",
    status: "pending",
    driverId: null,
  },
  {
    id: "demo-waybill-5",
    senderName: "Fernando Lopez",
    senderPhone: "+503-7100-0005",
    receiverName: "Silvia Reyes",
    receiverPhone: "+503-7200-0005",
    origin: "San Salvador",
    destination: "Santa Ana",
    weight: 200,
    volume: 1.2,
    description: "Textiles",
    status: "in_transit",
    driverId: "demo-driver-2",
  },
  {
    id: "demo-waybill-6",
    senderName: "Rosa Alvarado",
    senderPhone: "+502-7100-0006",
    receiverName: "Hector Morales",
    receiverPhone: "+504-7200-0006",
    origin: "Guatemala City",
    destination: "Tegucigalpa",
    weight: 350,
    volume: 2.8,
    description: "Construction materials",
    status: "in_transit",
    driverId: "demo-driver-5",
  },
  {
    id: "demo-waybill-7",
    senderName: "Manuel Contreras",
    senderPhone: "+506-7100-0007",
    receiverName: "Isabel Chacon",
    receiverPhone: "+507-7200-0007",
    origin: "San Jose",
    destination: "Panama City",
    weight: 90,
    volume: 0.6,
    description: "Medical supplies",
    status: "in_transit",
    driverId: "demo-driver-6",
  },
  {
    id: "demo-waybill-8",
    senderName: "Veronica Diaz",
    senderPhone: "+503-7100-0008",
    receiverName: "Alejandro Cruz",
    receiverPhone: "+503-7200-0008",
    origin: "San Salvador",
    destination: "Apopa",
    weight: 150,
    volume: 1.0,
    description: "Appliances",
    status: "delivered",
    driverId: "demo-driver-3",
  },
  {
    id: "demo-waybill-9",
    senderName: "Cristian Amaya",
    senderPhone: "+503-7100-0009",
    receiverName: "Yesenia Portillo",
    receiverPhone: "+502-7200-0009",
    origin: "Santa Ana",
    destination: "Guatemala City",
    weight: 400,
    volume: 3.2,
    description: "Machinery parts",
    status: "delivered",
    driverId: "demo-driver-4",
  },
  {
    id: "demo-waybill-10",
    senderName: "Beatriz Nunez",
    senderPhone: "+502-7100-0010",
    receiverName: "Javier Rodriguez",
    receiverPhone: "+505-7200-0010",
    origin: "Guatemala City",
    destination: "Managua",
    weight: 250,
    volume: 1.5,
    description: "Packaged food goods",
    status: "delivered",
    driverId: "demo-driver-5",
  },
];

async function seedDrivers() {
  for (const driver of DEMO_DRIVERS) {
    const preferredCities = driver.preferredCities.join(", ");

    await prisma.driver.upsert({
      where: { id: driver.id },
      update: {
        name: driver.name,
        phone: driver.phone,
        truckSize: driver.truckSize,
        preferredCities,
      },
      create: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        truckSize: driver.truckSize,
        preferredCities,
      },
    });
  }

  console.log(`Seeded ${DEMO_DRIVERS.length} demo drivers.`);
}

async function seedWaybills() {
  for (const waybill of DEMO_WAYBILLS) {
    const pricing = calculatePricing({
      origin: waybill.origin,
      destination: waybill.destination,
      weight: waybill.weight,
      volume: waybill.volume,
    });

    const data = {
      senderName: waybill.senderName,
      senderPhone: waybill.senderPhone,
      receiverName: waybill.receiverName,
      receiverPhone: waybill.receiverPhone,
      origin: waybill.origin,
      destination: waybill.destination,
      weight: waybill.weight,
      volume: waybill.volume,
      description: waybill.description,
      status: waybill.status,
      driverId: waybill.driverId,
      clientCost: pricing.clientCost,
      driverPayment: pricing.driverPayment,
      netMargin: pricing.netMargin,
    };

    await prisma.waybill.upsert({
      where: { id: waybill.id },
      update: data,
      create: { id: waybill.id, ...data },
    });
  }

  console.log(`Seeded ${DEMO_WAYBILLS.length} demo waybills.`);
}

try {
  await seedDrivers();
  await seedWaybills();
} catch (error) {
  console.error("Failed to seed demo data:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  await pool.end();
}
