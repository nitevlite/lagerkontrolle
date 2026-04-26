import Dexie, { type EntityTable } from "dexie";
import type { AppSettings, Batch, Item, Location, Movement, StorageSlot, UnitType } from "../domain/model";

class LagerkontrolleDatabase extends Dexie {
  locations!: EntityTable<Location, "id">;
  slots!: EntityTable<StorageSlot, "id">;
  unitTypes!: EntityTable<UnitType, "id">;
  items!: EntityTable<Item, "id">;
  batches!: EntityTable<Batch, "id">;
  movements!: EntityTable<Movement, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("lagerkontrolle-db");
    this.version(1).stores({
      locations: "id, name",
      slots: "id, locationId, sortOrder",
      unitTypes: "id, name, shortCode",
      items: "id, name, unitTypeId, barcode",
      batches: "id, itemId, expiryDate",
      movements: "id, batchId, kind, createdAt, fromSlotId, toSlotId",
      settings: "id"
    });
    this.version(2)
      .stores({
        locations: "id, name",
        slots: "id, locationId, sortOrder",
        unitTypes: "id, name, shortCode",
        items: "id, name, unitTypeId, barcode",
        batches: "id, itemId, expiryDate",
        movements: "id, batchId, kind, createdAt, fromSlotId, toSlotId",
        settings: "id"
      })
      .upgrade(async (tx) => {
        const settingsTable = tx.table("settings");
        const current = (await settingsTable.get("default")) as AppSettings | undefined;

        if (!current) {
          return;
        }

        await settingsTable.put({
          ...current,
          favoriteLocationIds: current.favoriteLocationIds ?? [],
          favoriteItemIds: current.favoriteItemIds ?? [],
          slotTypeNames: current.slotTypeNames ?? ["Regal", "Lade"]
        });
      });
    this.version(3)
      .stores({
        locations: "id, name",
        slots: "id, locationId, sortOrder",
        unitTypes: "id, name, shortCode",
        items: "id, name, unitTypeId, barcode, preferredLocationId",
        batches: "id, itemId, expiryDate",
        movements: "id, batchId, kind, createdAt, fromSlotId, toSlotId",
        settings: "id"
      })
      .upgrade(async (tx) => {
        const settingsTable = tx.table("settings");
        const current = (await settingsTable.get("default")) as AppSettings | undefined;

        if (current) {
          await settingsTable.put({
            ...current,
            slotTypeNames: current.slotTypeNames ?? ["Regal", "Lade"],
            favoriteLocationIds: current.favoriteLocationIds ?? [],
            favoriteItemIds: current.favoriteItemIds ?? []
          });
        }

        const itemsTable = tx.table<Item, "id">("items");
        const items = await itemsTable.toArray();
        for (const item of items) {
          await itemsTable.put({
            ...item,
            preferredLocationId: item.preferredLocationId
          });
        }
      });
  }
}

export const db = new LagerkontrolleDatabase();
