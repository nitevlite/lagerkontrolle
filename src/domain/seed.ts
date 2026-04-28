import type { AppSettings, Batch, DomainSnapshot, Item, Location, Movement, StorageSlot, UnitType } from "./model";

const locations: Location[] = [];

const slots: StorageSlot[] = [];

const unitTypes: UnitType[] = [
  { id: "unit-piece", name: "Stück", shortCode: "Stk", description: "Einzelteile" },
  { id: "unit-pack", name: "Packung", shortCode: "Pkg", description: "Verpackte Ware" },
  { id: "unit-box", name: "Kiste", shortCode: "Kiste", description: "Kisten und Sammelbehälter" },
  { id: "unit-bottle", name: "Flasche", shortCode: "Fl", description: "Flüssige Produkte" },
  { id: "unit-tube", name: "Tube", shortCode: "Tube", description: "Tubenware" },
  { id: "unit-can", name: "Dose", shortCode: "Dose", description: "Dosen und Behälter" },
  { id: "unit-roll", name: "Rolle", shortCode: "Rolle", description: "Rollenware" },
  { id: "unit-bag", name: "Beutel", shortCode: "Beutel", description: "Beutelware" }
];

const items: Item[] = [];

const batches: Batch[] = [];

const movements: Movement[] = [];

const settings: AppSettings = {
  id: "default",
  expiryWarningDays: 10,
  reminderRepeatDays: 3,
  favoriteLocationIds: [],
  favoriteItemIds: [],
  slotTypeNames: ["Regal", "Lade", "Schrank", "Fach", "Kiste", "Box", "Kühlschrank", "Gefrierschrank", "Palette"],
  sync: {
    enabled: false,
    couchUrl: "",
    databaseName: "lagerkontrolle",
    deviceId: "device-seed",
    deviceLabel: "Gerät"
  }
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
