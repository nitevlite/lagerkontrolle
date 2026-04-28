import Dexie, { type EntityTable } from "dexie";
import type { AppSettings, Batch, Item, Location, Movement, StorageSlot, SyncMetadata, UnitType } from "../domain/model";

class LagerkontrolleDatabase extends Dexie {
  locations!: EntityTable<Location, "id">;
  slots!: EntityTable<StorageSlot, "id">;
  unitTypes!: EntityTable<UnitType, "id">;
  items!: EntityTable<Item, "id">;
  batches!: EntityTable<Batch, "id">;
  movements!: EntityTable<Movement, "id">;
  settings!: EntityTable<AppSettings, "id">;
  syncMeta!: EntityTable<SyncMetadata, "id">;

  constructor() {
    super("lagerkontrolle-db-v2");
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
    this.version(4)
      .stores({
        locations: "id, name",
        slots: "id, locationId, sortOrder",
        unitTypes: "id, name, shortCode",
        items: "id, name, unitTypeId, barcode, preferredLocationId, lowStockThreshold",
        batches: "id, itemId, expiryDate",
        movements: "id, batchId, kind, createdAt, fromSlotId, toSlotId",
        settings: "id"
      })
      .upgrade(async (tx) => {
        const itemsTable = tx.table<Item, "id">("items");
        const items = await itemsTable.toArray();
        for (const item of items) {
          await itemsTable.put({
            ...item,
            lowStockThreshold: item.lowStockThreshold ?? 5
          });
        }
      });
    this.version(5)
      .stores({
        locations: "id, name",
        slots: "id, locationId, sortOrder",
        unitTypes: "id, name, shortCode",
        items: "id, name, unitTypeId, barcode, preferredLocationId, lowStockThreshold",
        batches: "id, itemId, expiryDate",
        movements: "id, batchId, kind, createdAt, fromSlotId, toSlotId",
        settings: "id",
        syncMeta: "id, entityType, entityId, dirty, updatedAt"
      })
      .upgrade(async (tx) => {
        const now = new Date().toISOString();
        const settingsTable = tx.table("settings");
        const current = (await settingsTable.get("default")) as AppSettings | undefined;
        if (current) {
          await settingsTable.put({
            ...current,
            sync: {
              enabled: current.sync?.enabled ?? false,
              couchUrl: current.sync?.couchUrl ?? "",
              databaseName: current.sync?.databaseName ?? "lagerkontrolle",
              username: current.sync?.username,
              password: current.sync?.password,
              deviceId: current.sync?.deviceId ?? crypto.randomUUID(),
              deviceLabel: current.sync?.deviceLabel ?? "Gerät"
            }
          });
        }

        const syncMetaTable = tx.table<SyncMetadata, string>("syncMeta");
        const entitySets: Array<{
          entityType: SyncMetadata["entityType"];
          rows: Array<{ id: string; createdAt?: string }>;
        }> = [
          { entityType: "location", rows: await tx.table<Location, "id">("locations").toArray() },
          { entityType: "slot", rows: await tx.table<StorageSlot, "id">("slots").toArray() },
          { entityType: "unitType", rows: await tx.table<UnitType, "id">("unitTypes").toArray() },
          { entityType: "item", rows: await tx.table<Item, "id">("items").toArray() },
          { entityType: "batch", rows: await tx.table<Batch, "id">("batches").toArray() },
          { entityType: "movement", rows: await tx.table<Movement, "id">("movements").toArray() },
          { entityType: "settings", rows: [{ id: "default" }] }
        ];

        for (const set of entitySets) {
          for (const row of set.rows) {
            await syncMetaTable.put({
              id: `${set.entityType}:${row.id}`,
              entityType: set.entityType,
              entityId: row.id,
              updatedAt: row.createdAt ?? now,
              dirty: false
            });
          }
        }
      });
    this.version(6)
      .stores({
        locations: "id, name",
        slots: "id, locationId, sortOrder",
        unitTypes: "id, name, shortCode",
        items: "id, name, unitTypeId, barcode, preferredLocationId, lowStockThreshold",
        batches: "id, itemId, expiryDate",
        movements: "id, batchId, kind, createdAt, fromSlotId, toSlotId, fromLocationId, toLocationId",
        settings: "id",
        syncMeta: "id, entityType, entityId, dirty, updatedAt"
      })
      .upgrade(async (tx) => {
        const now = new Date().toISOString();
        const settingsTable = tx.table("settings");
        const current = (await settingsTable.get("default")) as AppSettings | undefined;

        if (current) {
          await settingsTable.put({
            ...current,
            favoriteLocationIds: current.favoriteLocationIds ?? [],
            favoriteItemIds: current.favoriteItemIds ?? [],
            slotTypeNames: current.slotTypeNames ?? ["Regal", "Lade"],
            sync: {
              enabled: current.sync?.enabled ?? false,
              couchUrl: current.sync?.couchUrl ?? "",
              databaseName: current.sync?.databaseName ?? "lagerkontrolle",
              username: current.sync?.username,
              password: current.sync?.password,
              deviceId: current.sync?.deviceId ?? crypto.randomUUID(),
              deviceLabel: current.sync?.deviceLabel ?? "Gerät",
              lastSyncedAt: current.sync?.lastSyncedAt
            }
          });
        }

        const syncMetaTable = tx.table<SyncMetadata, string>("syncMeta");
        const entitySets: Array<{
          entityType: SyncMetadata["entityType"];
          rows: Array<{ id: string; createdAt?: string }>;
        }> = [
          { entityType: "location", rows: await tx.table<Location, "id">("locations").toArray() },
          { entityType: "slot", rows: await tx.table<StorageSlot, "id">("slots").toArray() },
          { entityType: "unitType", rows: await tx.table<UnitType, "id">("unitTypes").toArray() },
          { entityType: "item", rows: await tx.table<Item, "id">("items").toArray() },
          { entityType: "batch", rows: await tx.table<Batch, "id">("batches").toArray() },
          { entityType: "movement", rows: await tx.table<Movement, "id">("movements").toArray() },
          { entityType: "settings", rows: [{ id: "default" }] }
        ];

        for (const set of entitySets) {
          for (const row of set.rows) {
            const id = `${set.entityType}:${row.id}`;
            const existing = await syncMetaTable.get(id);
            if (!existing) {
              await syncMetaTable.put({
                id,
                entityType: set.entityType,
                entityId: row.id,
                updatedAt: row.createdAt ?? now,
                dirty: false
              });
            }
          }
        }
      });
  }
}

export const db = new LagerkontrolleDatabase();
