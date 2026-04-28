import { db } from "./db";
import type { AppSettings, DomainSnapshot, MovementKind } from "../domain/model";
import { seedSnapshot } from "../domain/seed";
import { createDefaultSyncConfig, markEntityChanged, markEntityDeleted } from "./sync";

const defaultSlotTypeNames = ["Regal", "Lade", "Schrank", "Fach", "Kiste", "Box", "Kühlschrank", "Gefrierschrank", "Palette"];
const noBatchCode = "Keine Charge";

function normalizeBarcode(value: string) {
  const compact = value.trim().replace(/\s+/g, "");
  if (/^\d+$/.test(compact) && compact.length === 13 && compact.startsWith("0")) {
    return compact.slice(1);
  }
  return compact;
}

function uniqueBarcodes(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => (value ? normalizeBarcode(value) : "")).filter(Boolean)));
}

function buildDefaultSettings(): AppSettings {
  return {
    id: "default",
    expiryWarningDays: 10,
    reminderRepeatDays: 3,
    favoriteLocationIds: [],
    favoriteItemIds: [],
    slotTypeNames: defaultSlotTypeNames,
    sync: createDefaultSyncConfig()
  };
}

export async function resetToStandardData() {
  await db.transaction("rw", [db.locations, db.slots, db.unitTypes, db.items, db.batches, db.movements, db.settings, db.syncMeta], async () => {
    await db.locations.clear();
    await db.slots.clear();
    await db.unitTypes.clear();
    await db.items.clear();
    await db.batches.clear();
    await db.movements.clear();
    await db.settings.clear();
    await db.syncMeta.clear();

    await db.unitTypes.bulkPut(seedSnapshot.unitTypes);
    await db.settings.put({
      ...seedSnapshot.settings,
      sync: {
        ...seedSnapshot.settings.sync,
        deviceId: crypto.randomUUID()
      }
    });
  });
  await markEntityChanged("settings", "default");
}

export async function restoreSnapshot(input: DomainSnapshot) {
  await db.transaction("rw", [db.locations, db.slots, db.unitTypes, db.items, db.batches, db.movements, db.settings, db.syncMeta], async () => {
    await db.locations.clear();
    await db.slots.clear();
    await db.unitTypes.clear();
    await db.items.clear();
    await db.batches.clear();
    await db.movements.clear();
    await db.settings.clear();
    await db.syncMeta.clear();

    await db.locations.bulkPut(input.locations);
    await db.slots.bulkPut(input.slots);
    await db.unitTypes.bulkPut(input.unitTypes);
    await db.items.bulkPut(input.items);
    await db.batches.bulkPut(input.batches);
    await db.movements.bulkPut(input.movements);
    await db.settings.put({
      ...input.settings,
      sync: {
        ...input.settings.sync,
        deviceId: input.settings.sync.deviceId || crypto.randomUUID()
      }
    });
  });

  await markEntityChanged("settings", "default");
}

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

async function getLocationBatchQuantity(batchId: string, locationId: string) {
  const movements = await db.movements
    .filter(
      (movement) =>
        movement.batchId === batchId &&
        (movement.fromLocationId === locationId || movement.toLocationId === locationId)
    )
    .toArray();

  return movements.reduce((sum, movement) => {
    const add = movement.toLocationId === locationId ? movement.quantity : 0;
    const subtract = movement.fromLocationId === locationId ? movement.quantity : 0;
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
    settings: settings ?? buildDefaultSettings()
  };
}

export async function addUnitType(input: {
  name: string;
  shortCode: string;
  description: string;
}) {
  const id = `unit-${crypto.randomUUID()}`;
  await db.unitTypes.add({
    id,
    name: input.name,
    shortCode: input.shortCode,
    description: input.description
  });
  await markEntityChanged("unitType", id);
}

export async function addItem(input: {
  name: string;
  unitTypeId: string;
  barcode?: string;
  barcodes?: string[];
  trackExpiry: boolean;
  preferredLocationId?: string;
  lowStockThreshold: number;
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
  const barcodes = uniqueBarcodes([input.barcode, ...(input.barcodes ?? [])]);
  if (barcodes.length > 0) {
    const duplicateBarcode = await db.items
      .filter((item) => uniqueBarcodes([item.barcode, ...(item.barcodes ?? [])]).some((code) => barcodes.includes(code)))
      .first();
    if (duplicateBarcode) {
      throw new Error("Barcode ist bereits einem anderen Artikel zugeordnet.");
    }
  }

  await db.transaction("rw", db.items, async () => {
    await db.items.add({
      id,
      name,
      unitTypeId: input.unitTypeId,
      barcode: barcodes[0],
      barcodes,
      trackExpiry: input.trackExpiry,
      preferredLocationId: input.preferredLocationId,
      lowStockThreshold: Math.max(0, Number(input.lowStockThreshold || 0))
    });
  });
  await markEntityChanged("item", id);

  return id;
}

export async function updateItem(input: {
  id: string;
  name: string;
  unitTypeId: string;
  barcode?: string;
  barcodes?: string[];
  trackExpiry: boolean;
  preferredLocationId?: string;
  lowStockThreshold: number;
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

  const barcodes = uniqueBarcodes([input.barcode, ...(input.barcodes ?? [])]);
  if (barcodes.length > 0) {
    const duplicateBarcode = await db.items
      .filter(
        (item) =>
          item.id !== input.id &&
          uniqueBarcodes([item.barcode, ...(item.barcodes ?? [])]).some((code) => barcodes.includes(code))
      )
      .first();
    if (duplicateBarcode) {
      throw new Error("Barcode ist bereits einem anderen Artikel zugeordnet.");
    }
  }

  await db.items.update(input.id, {
    name,
    unitTypeId: input.unitTypeId,
    barcode: barcodes[0],
    barcodes,
    trackExpiry: input.trackExpiry,
    preferredLocationId: input.preferredLocationId,
    lowStockThreshold: Math.max(0, Number(input.lowStockThreshold || 0))
  });
  await markEntityChanged("item", input.id);
}

export async function deleteItem(itemId: string) {
  const relatedBatches = await db.batches.where("itemId").equals(itemId).toArray();
  const relatedBatchIds = new Set(relatedBatches.map((batch) => batch.id));

  await db.transaction("rw", db.items, db.batches, db.movements, db.syncMeta, async () => {
    const movements = await db.movements.filter((movement) => relatedBatchIds.has(movement.batchId)).toArray();

    for (const movement of movements) {
      await markEntityDeleted("movement", movement.id);
      await db.movements.delete(movement.id);
    }

    for (const batch of relatedBatches) {
      await markEntityDeleted("batch", batch.id);
      await db.batches.delete(batch.id);
    }

    await markEntityDeleted("item", itemId);
    await db.items.delete(itemId);
  });
}

export async function addBatch(input: {
  itemId: string;
  batchCode: string;
  expiryDate: string;
}) {
  const batchCode = input.batchCode.trim() || noBatchCode;
  if (!input.expiryDate) {
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

  const id = `batch-${crypto.randomUUID()}`;
  await db.batches.add({
    id,
    itemId: input.itemId,
    batchCode,
    expiryDate: input.expiryDate
  });
  await markEntityChanged("batch", id);
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
  await markEntityChanged("location", id);

  return id;
}

export async function addStorageSlot(input: {
  locationId: string;
  kind: string;
  number: number;
}) {
  const number = Math.max(1, input.number);
  const kind = input.kind.trim();
  if (!kind) {
    throw new Error("Bitte einen Slot-Typ eingeben.");
  }
  const label = `${kind} ${number}`;
  const duplicate = await db.slots
    .where("locationId")
    .equals(input.locationId)
    .filter((slot) => slot.number === number && slot.kind.toLocaleLowerCase() === kind.toLocaleLowerCase())
    .first();

  if (duplicate) {
    throw new Error("Diese Nummer ist in dem Ort bereits vergeben.");
  }

  const existingCount = await db.slots.where("locationId").equals(input.locationId).count();

  const id = `slot-${crypto.randomUUID()}`;
  await db.slots.add({
    id,
    locationId: input.locationId,
    kind,
    number,
    label,
    sortOrder: existingCount + 1
  });
  await markEntityChanged("slot", id);
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
  await markEntityChanged("location", input.id);
}

export async function deleteLocation(locationId: string) {
  const slotCount = await db.slots.where("locationId").equals(locationId).count();
  if (slotCount > 0) {
    throw new Error("Ort kann erst gelöscht werden, wenn alle Regale und Laden entfernt sind.");
  }

  const movement = await db.movements
    .filter((entry) => entry.fromLocationId === locationId || entry.toLocationId === locationId)
    .first();

  if (movement) {
    throw new Error("Ort kann nicht gelöscht werden, weil bereits Bewegungen darauf gebucht wurden.");
  }

  await markEntityDeleted("location", locationId);
  await db.locations.delete(locationId);
}

export async function deleteStorageSlot(slotId: string) {
  const movement = await db.movements
    .filter((entry) => entry.fromSlotId === slotId || entry.toSlotId === slotId)
    .first();

  if (movement) {
    throw new Error("Slot kann nicht gelöscht werden, weil bereits Bewegungen darauf gebucht wurden.");
  }

  await markEntityDeleted("slot", slotId);
  await db.slots.delete(slotId);
}

export async function updateSettings(patch: Partial<Omit<AppSettings, "id">>) {
  const current =
    (await db.settings.get("default")) ??
    buildDefaultSettings();

  await db.settings.put({
    ...current,
    ...patch,
    sync: {
      ...current.sync,
      ...patch.sync
    }
  });
  await markEntityChanged("settings", "default");
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

export async function addSlotType(name: string) {
  const current = await loadSnapshot();
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  if (current.settings.slotTypeNames.some((entry) => entry.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) {
    throw new Error("Slot-Typ existiert bereits.");
  }
  await updateSettings({
    slotTypeNames: [...current.settings.slotTypeNames, trimmed]
  });
}

export async function renameSlotType(input: { previousName: string; nextName: string }) {
  const current = await loadSnapshot();
  const nextName = input.nextName.trim();
  if (!nextName) {
    return;
  }
  if (
    current.settings.slotTypeNames.some(
      (entry) =>
        entry.toLocaleLowerCase() === nextName.toLocaleLowerCase() &&
        entry.toLocaleLowerCase() !== input.previousName.toLocaleLowerCase()
    )
  ) {
    throw new Error("Slot-Typ existiert bereits.");
  }

  await db.transaction("rw", db.settings, db.slots, async () => {
    await updateSettings({
      slotTypeNames: current.settings.slotTypeNames.map((entry) => (entry === input.previousName ? nextName : entry))
    });

    const affectedSlots = await db.slots
      .filter((slot) => slot.kind.toLocaleLowerCase() === input.previousName.toLocaleLowerCase())
      .toArray();

    for (const slot of affectedSlots) {
      await db.slots.update(slot.id, {
        kind: nextName,
        label: `${nextName} ${slot.number}`
      });
      await markEntityChanged("slot", slot.id);
    }
  });
}

export async function deleteSlotType(name: string) {
  const current = await loadSnapshot();
  if (current.settings.slotTypeNames.length <= 1) {
    throw new Error("Mindestens ein Slot-Typ muss erhalten bleiben.");
  }
  const inUse = await db.slots.filter((slot) => slot.kind.toLocaleLowerCase() === name.toLocaleLowerCase()).first();
  if (inUse) {
    throw new Error("Slot-Typ kann erst gelöscht werden, wenn keine Slots mehr davon existieren.");
  }

  await updateSettings({
    slotTypeNames: current.settings.slotTypeNames.filter((entry) => entry.toLocaleLowerCase() !== name.toLocaleLowerCase())
  });
}

export async function deleteUnitType(unitTypeId: string) {
  const itemInUse = await db.items.filter((item) => item.unitTypeId === unitTypeId).first();
  if (itemInUse) {
    throw new Error("Einheit kann nicht gelöscht werden, weil noch Artikel darauf verweisen.");
  }

  await markEntityDeleted("unitType", unitTypeId);
  await db.unitTypes.delete(unitTypeId);
}

export async function createMovement(input: {
  kind: MovementKind;
  itemId: string;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
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

  if (!input.fromSlotId && !input.toSlotId && !input.fromLocationId && !input.toLocationId) {
    throw new Error("Bitte mindestens einen Ort für die Buchung wählen.");
  }

  if (
    input.kind === "transfer" &&
    input.fromSlotId === input.toSlotId &&
    input.fromLocationId === input.toLocationId
  ) {
    throw new Error("Quelle und Ziel dürfen nicht identisch sein.");
  }

  const item = await db.items.get(input.itemId);
  if (!item) {
    throw new Error("Artikel wurde nicht gefunden.");
  }

  let batchId = input.batchId;

  const changedEntityIds: Array<{ type: "batch" | "movement"; id: string }> = [];

  await db.transaction("rw", db.batches, db.movements, async () => {
    if (!batchId) {
      const batchCode = input.batchCode?.trim() || noBatchCode;
      const expiryDate = item.trackExpiry ? input.expiryDate?.trim() : input.expiryDate?.trim() || "2099-12-31";

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
        changedEntityIds.push({ type: "batch", id: batchId });
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
    } else if (input.fromLocationId) {
      const available = await getLocationBatchQuantity(batchId, input.fromLocationId);
      if (available < quantity) {
        throw new Error("Die gebuchte Menge ist höher als der verfügbare Bestand in diesem Ort.");
      }
    }

    const movementId = `move-${crypto.randomUUID()}`;
    await db.movements.add({
      id: movementId,
      kind: input.kind,
      batchId,
      quantity,
      fromLocationId: input.fromLocationId,
      toLocationId: input.toLocationId,
      fromSlotId: input.fromSlotId,
      toSlotId: input.toSlotId,
      createdAt: new Date().toISOString()
    });
    changedEntityIds.push({ type: "movement", id: movementId });
  });

  for (const entity of changedEntityIds) {
    await markEntityChanged(entity.type, entity.id);
  }
}
