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
  locationId: string;
  locationName: string;
  slotName: string;
  batchCode: string;
  daysUntilExpiry: number;
  quantity: number;
  unitShortCode: string;
  reminderDueInDays: number;
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
  locationId: string;
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

export type AnalyticsMetric = {
  id: string;
  title: string;
  value: string;
  detail: string;
};

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
    locationId: "loc-1",
    slotName: "Regal 1",
    itemName: "Kamillentee 20er",
    quantity: 24,
    unitShortCode: "Pkg",
    expiryDate: "30.04.2027",
    status: "ok"
  },
  {
    id: "slot-2",
    locationId: "loc-1",
    slotName: "Regal 3",
    itemName: "Pfefferminztee 20er",
    quantity: 6,
    unitShortCode: "Pkg",
    expiryDate: "06.05.2026",
    status: "warning"
  },
  {
    id: "slot-3",
    locationId: "loc-1",
    slotName: "Lade 2",
    itemName: "Honigportionen",
    quantity: 3,
    unitShortCode: "Box",
    expiryDate: "01.05.2026",
    status: "critical"
  },
  {
    id: "slot-4",
    locationId: "loc-2",
    slotName: "Regal 1",
    itemName: "Ingwersirup",
    quantity: 2,
    unitShortCode: "Fl",
    expiryDate: "24.05.2026",
    status: "warning"
  },
  {
    id: "slot-5",
    locationId: "loc-3",
    slotName: "Lade 1",
    itemName: "Serviettenpaket",
    quantity: 11,
    unitShortCode: "Pkg",
    expiryDate: "02.09.2026",
    status: "ok"
  }
];

export const expiryAlerts: BatchAlert[] = [
  {
    id: "alert-1",
    itemName: "Pfefferminztee 20er",
    locationId: "loc-1",
    locationName: "Teelager",
    slotName: "Regal 3",
    batchCode: "PM-2026-04",
    daysUntilExpiry: 9,
    quantity: 6,
    unitShortCode: "Pkg",
    reminderDueInDays: 2
  },
  {
    id: "alert-2",
    itemName: "Honigportionen",
    locationId: "loc-1",
    locationName: "Teelager",
    slotName: "Lade 2",
    batchCode: "HP-2026-02",
    daysUntilExpiry: 5,
    quantity: 3,
    unitShortCode: "Box",
    reminderDueInDays: 1
  },
  {
    id: "alert-3",
    itemName: "Ingwersirup",
    locationId: "loc-2",
    locationName: "Sirupraum",
    slotName: "Regal 1",
    batchCode: "IS-2026-03",
    daysUntilExpiry: 18,
    quantity: 2,
    unitShortCode: "Fl",
    reminderDueInDays: 4
  },
  {
    id: "alert-4",
    itemName: "Gruentee Bio",
    locationId: "loc-1",
    locationName: "Teelager",
    slotName: "Regal 6",
    batchCode: "GB-2026-05",
    daysUntilExpiry: 27,
    quantity: 10,
    unitShortCode: "Pkg",
    reminderDueInDays: 5
  },
  {
    id: "alert-5",
    itemName: "Himbeersirup",
    locationId: "loc-2",
    locationName: "Sirupraum",
    slotName: "Lade 1",
    batchCode: "HS-2026-01",
    daysUntilExpiry: 46,
    quantity: 4,
    unitShortCode: "Fl",
    reminderDueInDays: 7
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
  },
  {
    id: "move-4",
    direction: "in",
    itemName: "Gruentee Bio",
    quantity: 8,
    unitShortCode: "Pkg",
    toLabel: "Teelager / Regal 6",
    timestampLabel: "Heute, 07:31"
  }
];

export const analyticsMetrics: AnalyticsMetric[] = [
  {
    id: "analytics-1",
    title: "Aktivster Ort",
    value: "Teelager",
    detail: "18 Bewegungen heute"
  },
  {
    id: "analytics-2",
    title: "Meist gescannt",
    value: "Kamillentee",
    detail: "12 Treffer heute"
  },
  {
    id: "analytics-3",
    title: "Hohe Auslastung",
    value: "Servicewagen",
    detail: "88% belegt"
  },
  {
    id: "analytics-4",
    title: "Bald ablaufend",
    value: "3 Chargen",
    detail: "innerhalb 10 Tagen"
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
