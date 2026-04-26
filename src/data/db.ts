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
  }
}

export const db = new LagerkontrolleDatabase();
