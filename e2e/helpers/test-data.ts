import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type TestData = {
  driver: {
    name: string;
    phone: string;
    truckSize: string;
    preferredCities: string[];
  };
  waybill: {
    origin: string;
    destination: string;
    senderName: string;
    senderPhone: string;
    receiverName: string;
    receiverPhone: string;
    description: string;
    weight: string;
    volume: string;
  };
  calculator: {
    origin: string;
    destination: string;
    weight: string;
    volume: string;
  };
  routeOverride: {
    origin: string;
    destination: string;
    multiplier: string;
  };
  created: {
    driverId: string | null;
    waybillId: string | null;
  };
};

const DATA_PATH = path.join(__dirname, "..", "fixtures", "test-data.json");

export function loadTestData(): TestData {
  return JSON.parse(readFileSync(DATA_PATH, "utf8")) as TestData;
}

export function saveTestData(data: TestData): void {
  writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/**
 * Mint unique driver/waybill contact values so re-runs do not collide on
 * phone uniqueness, then persist them for later specs in the suite.
 */
export function refreshGeneratedValues(): TestData {
  const data = loadTestData();
  const stamp = Date.now().toString().slice(-10);

  data.driver.name = `E2E Driver ${stamp}`;
  data.driver.phone = `+503555${stamp.slice(-7)}`;
  data.waybill.senderName = `E2E Sender ${stamp}`;
  data.waybill.senderPhone = `+503551${stamp.slice(-7)}`;
  data.waybill.receiverName = `E2E Receiver ${stamp}`;
  data.waybill.receiverPhone = `+503552${stamp.slice(-7)}`;
  data.created.driverId = null;
  data.created.waybillId = null;

  saveTestData(data);
  return data;
}

export function recordCreatedIds(partial: {
  driverId?: string | null;
  waybillId?: string | null;
}): TestData {
  const data = loadTestData();
  if (partial.driverId !== undefined) data.created.driverId = partial.driverId;
  if (partial.waybillId !== undefined) data.created.waybillId = partial.waybillId;
  saveTestData(data);
  return data;
}
