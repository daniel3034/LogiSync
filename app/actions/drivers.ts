"use server";

import { refresh } from "next/cache";
import { getAdminSession } from "@/lib/auth-guard";
import { isTruckSize } from "@/lib/drivers";
import { prisma } from "@/lib/prisma";
import { SERVICE_DESTINATIONS } from "@/lib/waybill-options";

export type AddDriverState = {
  status: "idle" | "success" | "error";
  message?: string;
  /**
   * Echoed back so the form can repopulate itself. React resets an uncontrolled
   * `<form action>` after every submission, including a rejected one, so
   * without this a validation error would wipe what the user typed.
   */
  values?: {
    name: string;
    phone: string;
    truckSize: string;
    cities: string[];
  };
};

/** Prisma's unique-constraint violation, matched without importing its error class. */
function isDuplicateError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function addDriver(
  _prevState: AddDriverState,
  formData: FormData
): Promise<AddDriverState> {
  const session = await getAdminSession();
  if (!session) {
    return { status: "error", message: "You are not allowed to add drivers." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const truckSize = String(formData.get("truckSize") ?? "");
  // One checkbox per city, all sharing the `preferredCities` name.
  const cities = formData.getAll("preferredCities").map(String);
  const values = { name, phone, truckSize, cities };

  if (!name || !phone) {
    return { status: "error", message: "Name and phone are required.", values };
  }

  if (!isTruckSize(truckSize)) {
    return { status: "error", message: "Choose a valid truck size.", values };
  }

  if (cities.length === 0) {
    return {
      status: "error",
      message: "Select at least one preferred city.",
      values,
    };
  }

  // The checkboxes only offer serviced cities, but a direct POST can send
  // anything, and an unserviced city would make the driver unfindable by the
  // destination filter.
  const unserviced = cities.filter(
    (city) => !(SERVICE_DESTINATIONS as readonly string[]).includes(city)
  );
  if (unserviced.length > 0) {
    return {
      status: "error",
      message: `Not a serviced city: ${unserviced.join(", ")}.`,
      values,
    };
  }

  try {
    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        truckSize,
        // Stored as a comma-separated list; see lib/cities.ts.
        preferredCities: cities.join(", "),
      },
    });

    // /drivers reads from Prisma on every request, so there is no cached data to
    // invalidate — the client router just needs the re-rendered tree, which
    // rides back in this action's response.
    refresh();

    return { status: "success", message: `${driver.name} added.` };
  } catch (error) {
    // `phone` is unique. Letting the insert fail avoids the race a
    // check-then-create would leave open.
    if (isDuplicateError(error)) {
      return {
        status: "error",
        message: "A driver with this phone number already exists.",
        values,
      };
    }

    console.error("Error creating driver:", error);
    return { status: "error", message: "Failed to add driver.", values };
  }
}
