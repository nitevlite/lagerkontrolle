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
