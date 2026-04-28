export type EntityId = string;
export type SyncEntityType = "location" | "slot" | "unitType" | "item" | "batch" | "movement" | "settings";

export type Location = {
  id: EntityId;
  name: string;
};

export type StorageSlot = {
  id: EntityId;
  locationId: EntityId;
  kind: string;
  number: number;
  label: string;
  sortOrder: number;
};

export type UnitType = {
  id: EntityId;
  name: string;
  shortCode: string;
  description: string;
};

export type Item = {
  id: EntityId;
  name: string;
  unitTypeId: EntityId;
  barcode?: string;
  trackExpiry: boolean;
  preferredLocationId?: EntityId;
  lowStockThreshold: number;
};

export type Batch = {
  id: EntityId;
  itemId: EntityId;
  batchCode: string;
  expiryDate: string;
};

export type MovementKind = "in" | "out" | "transfer" | "adjustment";

export type Movement = {
  id: EntityId;
  kind: MovementKind;
  batchId: EntityId;
  quantity: number;
  fromLocationId?: EntityId;
  toLocationId?: EntityId;
  fromSlotId?: EntityId;
  toSlotId?: EntityId;
  createdAt: string;
};

export type AppSettings = {
  id: "default";
  expiryWarningDays: number;
  reminderRepeatDays: number;
  favoriteLocationIds: EntityId[];
  favoriteItemIds: EntityId[];
  slotTypeNames: string[];
  sync: SyncConfig;
};

export type SyncConfig = {
  enabled: boolean;
  couchUrl: string;
  databaseName: string;
  username?: string;
  password?: string;
  deviceId: string;
  deviceLabel: string;
  lastSyncedAt?: string;
};

export type SyncMetadata = {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  updatedAt: string;
  deletedAt?: string;
  dirty: boolean;
  lastSyncedAt?: string;
};

export type DomainSnapshot = {
  locations: Location[];
  slots: StorageSlot[];
  unitTypes: UnitType[];
  items: Item[];
  batches: Batch[];
  movements: Movement[];
  settings: AppSettings;
};
