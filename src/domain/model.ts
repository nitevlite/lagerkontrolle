export type EntityId = string;

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
