export type ViewKey = "dashboard" | "locations" | "booking" | "units" | "analytics";

export type UnitType = {
  id: string;
  name: string;
  shortCode: string;
  description: string;
};

export type BatchAlert = {
  id: string;
  itemName: string;
  locationName: string;
  slotName: string;
  batchCode: string;
  daysUntilExpiry: number;
  quantity: number;
  unitShortCode: string;
};

export type LocationSummary = {
  id: string;
  name: string;
  slotCount: number;
  itemCount: number;
  lastMovementLabel: string;
  occupancyPercent: number;
};

export type SlotStock = {
  id: string;
  slotName: string;
  itemName: string;
  quantity: number;
  unitShortCode: string;
  expiryDate: string;
  status: "ok" | "warning" | "critical";
};

export type MovementSummary = {
  id: string;
  direction: "in" | "out" | "transfer";
  itemName: string;
  quantity: number;
  unitShortCode: string;
  fromLabel?: string;
  toLabel?: string;
  timestampLabel: string;
};

export const dashboardStats = [
  {
    id: "critical",
    label: "Kritische Chargen",
    value: "8",
    detail: "innerhalb 7 Tagen",
    tone: "critical"
  },
  {
    id: "warning",
    label: "Fruehwarnungen",
    value: "21",
    detail: "innerhalb 30 Tagen",
    tone: "warning"
  },
  {
    id: "moves",
    label: "Bewegungen heute",
    value: "37",
    detail: "6 Umbuchungen",
    tone: "neutral"
  },
  {
    id: "sync",
    label: "Sync-Status",
    value: "2 Geraete",
    detail: "zuletzt vor 2 Min.",
    tone: "good"
  }
] as const;

export const locationSummaries: LocationSummary[] = [
  {
    id: "loc-1",
    name: "Teelager",
    slotCount: 12,
    itemCount: 84,
    lastMovementLabel: "vor 4 Min.",
    occupancyPercent: 72
  },
  {
    id: "loc-2",
    name: "Sirupraum",
    slotCount: 8,
    itemCount: 29,
    lastMovementLabel: "vor 11 Min.",
    occupancyPercent: 58
  },
  {
    id: "loc-3",
    name: "Servicewagen",
    slotCount: 5,
    itemCount: 17,
    lastMovementLabel: "vor 27 Min.",
    occupancyPercent: 88
  }
];

export const slotStocks: SlotStock[] = [
  {
    id: "slot-1",
    slotName: "Regal 1",
    itemName: "Kamillentee 20er",
    quantity: 24,
    unitShortCode: "Pkg",
    expiryDate: "30.04.2027",
    status: "ok"
  },
  {
    id: "slot-2",
    slotName: "Regal 3",
    itemName: "Pfefferminztee 20er",
    quantity: 6,
    unitShortCode: "Pkg",
    expiryDate: "12.05.2026",
    status: "warning"
  },
  {
    id: "slot-3",
    slotName: "Lade 2",
    itemName: "Honigportionen",
    quantity: 3,
    unitShortCode: "Box",
    expiryDate: "01.05.2026",
    status: "critical"
  }
];

export const expiryAlerts: BatchAlert[] = [
  {
    id: "alert-1",
    itemName: "Pfefferminztee 20er",
    locationName: "Teelager",
    slotName: "Regal 3",
    batchCode: "PM-2026-04",
    daysUntilExpiry: 16,
    quantity: 6,
    unitShortCode: "Pkg"
  },
  {
    id: "alert-2",
    itemName: "Honigportionen",
    locationName: "Teelager",
    slotName: "Lade 2",
    batchCode: "HP-2026-02",
    daysUntilExpiry: 5,
    quantity: 3,
    unitShortCode: "Box"
  },
  {
    id: "alert-3",
    itemName: "Ingwersirup",
    locationName: "Sirupraum",
    slotName: "Regal 1",
    batchCode: "IS-2026-03",
    daysUntilExpiry: 28,
    quantity: 2,
    unitShortCode: "Fl"
  }
];

export const recentMovements: MovementSummary[] = [
  {
    id: "move-1",
    direction: "in",
    itemName: "Kamillentee 20er",
    quantity: 12,
    unitShortCode: "Pkg",
    toLabel: "Teelager / Regal 1",
    timestampLabel: "Heute, 08:42"
  },
  {
    id: "move-2",
    direction: "transfer",
    itemName: "Honigportionen",
    quantity: 1,
    unitShortCode: "Box",
    fromLabel: "Teelager / Regal 4",
    toLabel: "Teelager / Lade 2",
    timestampLabel: "Heute, 08:17"
  },
  {
    id: "move-3",
    direction: "out",
    itemName: "Ingwersirup",
    quantity: 2,
    unitShortCode: "Fl",
    fromLabel: "Sirupraum / Regal 1",
    timestampLabel: "Heute, 07:56"
  }
];

export const analyticsCards = [
  {
    id: "analytics-1",
    title: "Aktivster Ort",
    value: "Teelager",
    detail: "18 Bewegungen heute"
  },
  {
    id: "analytics-2",
    title: "Ablaufwarnungen",
    value: "21",
    detail: "davon 8 kritisch"
  },
  {
    id: "analytics-3",
    title: "Neue Einheitentypen",
    value: "3",
    detail: "im letzten Monat angelegt"
  }
] as const;

export const initialUnitTypes: UnitType[] = [
  {
    id: "unit-1",
    name: "Packung",
    shortCode: "Pkg",
    description: "Standard fuer Teeprodukte"
  },
  {
    id: "unit-2",
    name: "Box",
    shortCode: "Box",
    description: "Honig, Portionsware, Kleinbehaelter"
  },
  {
    id: "unit-3",
    name: "Flasche",
    shortCode: "Fl",
    description: "Sirupe und fluessige Produkte"
  }
];
