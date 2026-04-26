import { db } from "./db";
import type { AppSettings, DomainSnapshot, MovementKind } from "../domain/model";

async function getSlotBatchQuantity(batchId: string, slotId: string) {
  const movements = await db.movements
    .filter((movement) => movement.batchId === batchId && (movement.fromSlotId === slotId || movement.toSlotId === slotId))
    .toArray();

  return movements.reduce((sum, movement) => {
    const add = movement.toSlotId === slotId ? movement.quantity : 0;
    const subtract = movement.fromSlotId === slotId ? movement.quantity : 0;
    return sum + add - subtract;
  }, 0);
}

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
      reminderRepeatDays: 3,
      favoriteLocationIds: [],
      favoriteItemIds: []
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

export async function addItem(input: {
  name: string;
  unitTypeId: string;
  barcode?: string;
  trackExpiry: boolean;
}) {
  const name = input.name.trim();
  if (!name) {
    return;
  }

  const existing = await db.items
    .filter((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    .first();

  if (existing) {
    throw new Error("Artikel existiert bereits.");
  }

  const id = `item-${crypto.randomUUID()}`;

  await db.items.add({
    id,
    name,
    unitTypeId: input.unitTypeId,
    barcode: input.barcode?.trim() || undefined,
    trackExpiry: input.trackExpiry
  });

  return id;
}

export async function updateItem(input: {
  id: string;
  name: string;
  unitTypeId: string;
  barcode?: string;
  trackExpiry: boolean;
}) {
  const name = input.name.trim();
  if (!name) {
    return;
  }

  const existing = await db.items
    .filter((item) => item.id !== input.id && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    .first();

  if (existing) {
    throw new Error("Artikel existiert bereits.");
  }

  await db.items.update(input.id, {
    name,
    unitTypeId: input.unitTypeId,
    barcode: input.barcode?.trim() || undefined,
    trackExpiry: input.trackExpiry
  });
}

export async function addBatch(input: {
  itemId: string;
  batchCode: string;
  expiryDate: string;
}) {
  const batchCode = input.batchCode.trim();
  if (!batchCode || !input.expiryDate) {
    return;
  }

  const existing = await db.batches
    .filter(
      (batch) =>
        batch.itemId === input.itemId &&
        batch.batchCode.toLocaleLowerCase() === batchCode.toLocaleLowerCase()
    )
    .first();

  if (existing) {
    throw new Error("Charge existiert für diesen Artikel bereits.");
  }

  await db.batches.add({
    id: `batch-${crypto.randomUUID()}`,
    itemId: input.itemId,
    batchCode,
    expiryDate: input.expiryDate
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

  const id = `loc-${crypto.randomUUID()}`;

  await db.locations.add({
    id,
    name
  });

  return id;
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
    throw new Error("Ort kann erst gelöscht werden, wenn alle Regale und Laden entfernt sind.");
  }

  await db.locations.delete(locationId);
}

export async function deleteStorageSlot(slotId: string) {
  const movement = await db.movements
    .filter((entry) => entry.fromSlotId === slotId || entry.toSlotId === slotId)
    .first();

  if (movement) {
    throw new Error("Slot kann nicht gelöscht werden, weil bereits Bewegungen darauf gebucht wurden.");
  }

  await db.slots.delete(slotId);
}

export async function updateSettings(patch: Partial<Omit<AppSettings, "id">>) {
  const current =
    (await db.settings.get("default")) ??
    ({
      id: "default",
      expiryWarningDays: 10,
      reminderRepeatDays: 3,
      favoriteLocationIds: [],
      favoriteItemIds: []
    } satisfies AppSettings);

  await db.settings.put({
    ...current,
    ...patch
  });
}

export async function toggleFavoriteLocation(locationId: string) {
  const current = await loadSnapshot();
  const nextIds = current.settings.favoriteLocationIds.includes(locationId)
    ? current.settings.favoriteLocationIds.filter((id) => id !== locationId)
    : [...current.settings.favoriteLocationIds, locationId];

  await updateSettings({
    favoriteLocationIds: nextIds
  });
}

export async function toggleFavoriteItem(itemId: string) {
  const current = await loadSnapshot();
  const nextIds = current.settings.favoriteItemIds.includes(itemId)
    ? current.settings.favoriteItemIds.filter((id) => id !== itemId)
    : [...current.settings.favoriteItemIds, itemId];

  await updateSettings({
    favoriteItemIds: nextIds
  });
}

export async function createMovement(input: {
  kind: MovementKind;
  itemId: string;
  quantity: number;
  fromSlotId?: string;
  toSlotId?: string;
  batchId?: string;
  batchCode?: string;
  expiryDate?: string;
}) {
  const quantity = Math.max(0, Number(input.quantity || 0));
  if (quantity <= 0) {
    throw new Error("Bitte eine gültige Menge eingeben.");
  }

  if (!input.fromSlotId && !input.toSlotId) {
    throw new Error("Bitte mindestens einen Slot für die Buchung wählen.");
  }

  if (input.kind === "transfer" && input.fromSlotId && input.toSlotId && input.fromSlotId === input.toSlotId) {
    throw new Error("Quell- und Zielslot duerfen nicht identisch sein.");
  }

  const item = await db.items.get(input.itemId);
  if (!item) {
    throw new Error("Artikel wurde nicht gefunden.");
  }

  let batchId = input.batchId;

  await db.transaction("rw", db.batches, db.movements, async () => {
    if (!batchId) {
      const batchCode = input.batchCode?.trim();
      const expiryDate = item.trackExpiry ? input.expiryDate?.trim() : input.expiryDate?.trim() || "2099-12-31";

      if (!batchCode) {
        throw new Error("Bitte eine Charge wählen oder neu anlegen.");
      }

      if (item.trackExpiry && !expiryDate) {
        throw new Error("Bitte ein Ablaufdatum für die neue Charge setzen.");
      }

      const duplicateBatch = await db.batches
        .filter(
          (batch) =>
            batch.itemId === item.id &&
            batch.batchCode.toLocaleLowerCase() === batchCode.toLocaleLowerCase()
        )
        .first();

      if (duplicateBatch) {
        batchId = duplicateBatch.id;
      } else {
        batchId = `batch-${crypto.randomUUID()}`;
        await db.batches.add({
          id: batchId,
          itemId: item.id,
          batchCode,
          expiryDate: expiryDate ?? "2099-12-31"
        });
      }
    }

    if (!batchId) {
      throw new Error("Charge konnte nicht vorbereitet werden.");
    }

    if (input.fromSlotId) {
      const available = await getSlotBatchQuantity(batchId, input.fromSlotId);
      if (available < quantity) {
        throw new Error("Die gebuchte Menge ist höher als der verfügbare Bestand in diesem Slot.");
      }
    }

    await db.movements.add({
      id: `move-${crypto.randomUUID()}`,
      kind: input.kind,
      batchId,
      quantity,
      fromSlotId: input.fromSlotId,
      toSlotId: input.toSlotId,
      createdAt: new Date().toISOString()
    });
  });
}
