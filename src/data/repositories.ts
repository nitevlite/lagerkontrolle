import { db } from "./db";
import type { AppSettings, DomainSnapshot } from "../domain/model";

export async function loadSnapshot(): Promise<DomainSnapshot> {
  const [locations, slots, unitTypes, items, batches, movements, settings] = await Promise.all([
    db.locations.toArray(),
    db.slots.toArray(),
    db.unitTypes.toArray(),
    db.items.toArray(),
    db.batches.toArray(),
    db.movements.toArray(),
    db.settings.get("default")
  ]);

  return {
    locations,
    slots,
    unitTypes,
    items,
    batches,
    movements,
    settings: settings ?? {
      id: "default",
      expiryWarningDays: 10,
      reminderRepeatDays: 3
    }
  };
}

export async function addUnitType(input: {
  name: string;
  shortCode: string;
  description: string;
}) {
  await db.unitTypes.add({
    id: `unit-${crypto.randomUUID()}`,
    name: input.name,
    shortCode: input.shortCode,
    description: input.description
  });
}

export async function addLocation(input: { name: string }) {
  const name = input.name.trim();
  if (!name) {
    return;
  }

  const existing = await db.locations
    .filter((location) => location.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    .first();

  if (existing) {
    throw new Error("Ort existiert bereits.");
  }

  await db.locations.add({
    id: `loc-${crypto.randomUUID()}`,
    name
  });
}

export async function addStorageSlot(input: {
  locationId: string;
  kind: "shelf" | "drawer";
  number: number;
}) {
  const number = Math.max(1, input.number);
  const label = input.kind === "shelf" ? `Regal ${number}` : `Lade ${number}`;
  const duplicate = await db.slots
    .where("locationId")
    .equals(input.locationId)
    .filter((slot) => slot.number === number)
    .first();

  if (duplicate) {
    throw new Error("Diese Nummer ist in dem Ort bereits vergeben.");
  }

  const existingCount = await db.slots.where("locationId").equals(input.locationId).count();

  await db.slots.add({
    id: `slot-${crypto.randomUUID()}`,
    locationId: input.locationId,
    kind: input.kind,
    number,
    label,
    sortOrder: existingCount + 1
  });
}

export async function renameLocation(input: { id: string; name: string }) {
  const name = input.name.trim();
  if (!name) {
    return;
  }

  const existing = await db.locations
    .filter(
      (location) =>
        location.id !== input.id && location.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    )
    .first();

  if (existing) {
    throw new Error("Ort existiert bereits.");
  }

  await db.locations.update(input.id, { name });
}

export async function deleteLocation(locationId: string) {
  const slotCount = await db.slots.where("locationId").equals(locationId).count();
  if (slotCount > 0) {
    throw new Error("Ort kann erst geloescht werden, wenn alle Regale und Laden entfernt sind.");
  }

  await db.locations.delete(locationId);
}

export async function deleteStorageSlot(slotId: string) {
  const movement = await db.movements
    .filter((entry) => entry.fromSlotId === slotId || entry.toSlotId === slotId)
    .first();

  if (movement) {
    throw new Error("Slot kann nicht geloescht werden, weil bereits Bewegungen darauf gebucht wurden.");
  }

  await db.slots.delete(slotId);
}

export async function updateSettings(patch: Partial<Omit<AppSettings, "id">>) {
  const current =
    (await db.settings.get("default")) ??
    ({
      id: "default",
      expiryWarningDays: 10,
      reminderRepeatDays: 3
    } satisfies AppSettings);

  await db.settings.put({
    ...current,
    ...patch
  });
}
