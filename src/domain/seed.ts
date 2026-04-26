import type { AppSettings, Batch, DomainSnapshot, Item, Location, Movement, StorageSlot, UnitType } from "./model";

const locations: Location[] = [
  { id: "loc-tea", name: "Teelager" },
  { id: "loc-syrup", name: "Sirupraum" },
  { id: "loc-service", name: "Servicewagen" }
];

const slots: StorageSlot[] = [
  { id: "slot-tea-r1", locationId: "loc-tea", kind: "shelf", number: 1, label: "Regal 1", sortOrder: 1 },
  { id: "slot-tea-r3", locationId: "loc-tea", kind: "shelf", number: 3, label: "Regal 3", sortOrder: 3 },
  { id: "slot-tea-r6", locationId: "loc-tea", kind: "shelf", number: 6, label: "Regal 6", sortOrder: 6 },
  { id: "slot-tea-d2", locationId: "loc-tea", kind: "drawer", number: 2, label: "Lade 2", sortOrder: 12 },
  { id: "slot-syrup-r1", locationId: "loc-syrup", kind: "shelf", number: 1, label: "Regal 1", sortOrder: 1 },
  { id: "slot-syrup-d1", locationId: "loc-syrup", kind: "drawer", number: 1, label: "Lade 1", sortOrder: 11 },
  { id: "slot-service-d1", locationId: "loc-service", kind: "drawer", number: 1, label: "Lade 1", sortOrder: 11 }
];

const unitTypes: UnitType[] = [
  { id: "unit-pack", name: "Packung", shortCode: "Pkg", description: "Standard für Teeprodukte" },
  { id: "unit-box", name: "Box", shortCode: "Box", description: "Portionsware und Kleinbehälter" },
  { id: "unit-bottle", name: "Flasche", shortCode: "Fl", description: "Sirupe und flüssige Produkte" }
];

const items: Item[] = [
  { id: "item-camomile", name: "Kamillentee 20er", unitTypeId: "unit-pack", barcode: "900001", trackExpiry: true },
  { id: "item-peppermint", name: "Pfefferminztee 20er", unitTypeId: "unit-pack", barcode: "900002", trackExpiry: true },
  { id: "item-green", name: "Grüntee Bio", unitTypeId: "unit-pack", barcode: "900003", trackExpiry: true },
  { id: "item-honey", name: "Honigportionen", unitTypeId: "unit-box", barcode: "900004", trackExpiry: true },
  { id: "item-ginger", name: "Ingwersirup", unitTypeId: "unit-bottle", barcode: "900005", trackExpiry: true },
  { id: "item-raspberry", name: "Himbeersirup", unitTypeId: "unit-bottle", barcode: "900006", trackExpiry: true },
  { id: "item-napkins", name: "Serviettenpaket", unitTypeId: "unit-pack", barcode: "900007", trackExpiry: false }
];

const batches: Batch[] = [
  { id: "batch-camomile-a", itemId: "item-camomile", batchCode: "KT-2027-04", expiryDate: "2027-04-30" },
  { id: "batch-peppermint-a", itemId: "item-peppermint", batchCode: "PM-2026-04", expiryDate: "2026-05-05" },
  { id: "batch-green-a", itemId: "item-green", batchCode: "GB-2026-05", expiryDate: "2026-05-23" },
  { id: "batch-honey-a", itemId: "item-honey", batchCode: "HP-2026-02", expiryDate: "2026-05-01" },
  { id: "batch-ginger-a", itemId: "item-ginger", batchCode: "IS-2026-03", expiryDate: "2026-05-14" },
  { id: "batch-raspberry-a", itemId: "item-raspberry", batchCode: "HS-2026-01", expiryDate: "2026-06-11" },
  { id: "batch-napkins-a", itemId: "item-napkins", batchCode: "SV-2026-01", expiryDate: "2026-12-31" }
];

const movements: Movement[] = [
  { id: "move-1", kind: "in", batchId: "batch-camomile-a", quantity: 24, toSlotId: "slot-tea-r1", createdAt: "2026-04-26T08:42:00.000Z" },
  { id: "move-2", kind: "in", batchId: "batch-peppermint-a", quantity: 6, toSlotId: "slot-tea-r3", createdAt: "2026-04-26T08:21:00.000Z" },
  { id: "move-3", kind: "in", batchId: "batch-green-a", quantity: 10, toSlotId: "slot-tea-r6", createdAt: "2026-04-26T07:31:00.000Z" },
  { id: "move-4", kind: "in", batchId: "batch-honey-a", quantity: 4, toSlotId: "slot-tea-r1", createdAt: "2026-04-26T07:00:00.000Z" },
  { id: "move-5", kind: "transfer", batchId: "batch-honey-a", quantity: 1, fromSlotId: "slot-tea-r1", toSlotId: "slot-tea-d2", createdAt: "2026-04-26T08:17:00.000Z" },
  { id: "move-6", kind: "in", batchId: "batch-ginger-a", quantity: 4, toSlotId: "slot-syrup-r1", createdAt: "2026-04-26T06:50:00.000Z" },
  { id: "move-7", kind: "out", batchId: "batch-ginger-a", quantity: 2, fromSlotId: "slot-syrup-r1", createdAt: "2026-04-26T07:56:00.000Z" },
  { id: "move-8", kind: "in", batchId: "batch-raspberry-a", quantity: 4, toSlotId: "slot-syrup-d1", createdAt: "2026-04-25T14:15:00.000Z" },
  { id: "move-9", kind: "in", batchId: "batch-napkins-a", quantity: 11, toSlotId: "slot-service-d1", createdAt: "2026-04-25T09:12:00.000Z" },
  { id: "move-10", kind: "in", batchId: "batch-camomile-a", quantity: 12, toSlotId: "slot-tea-r1", createdAt: "2026-04-26T09:20:00.000Z" }
];

const settings: AppSettings = {
  id: "default",
  expiryWarningDays: 10,
  reminderRepeatDays: 3
};

export const seedSnapshot: DomainSnapshot = {
  locations,
  slots,
  unitTypes,
  items,
  batches,
  movements,
  settings
};
