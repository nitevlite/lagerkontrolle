import type { AppSettings, Batch, DomainSnapshot, Item, Location, Movement, StorageSlot, UnitType } from "./model";

export type ViewKey = "dashboard" | "locations" | "items" | "booking" | "units" | "analytics";

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "critical" | "warning" | "neutral" | "good";
};

export type LocationSummary = {
  id: string;
  name: string;
  slotCount: number;
  itemCount: number;
  lastMovementLabel: string;
  occupancyPercent: number;
};

export type StockLine = {
  id: string;
  locationId: string;
  locationName: string;
  slotId: string;
  slotName: string;
  itemName: string;
  quantity: number;
  unitShortCode: string;
  expiryDate: string;
  status: "ok" | "warning" | "critical";
  daysUntilExpiry: number | null;
};

export type ExpiryAlert = {
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

export type AppViewModel = {
  settings: AppSettings;
  unitTypes: UnitType[];
  locations: LocationSummary[];
  stockLines: StockLine[];
  expiryAlerts: ExpiryAlert[];
  recentMovements: MovementSummary[];
  dashboardStats: DashboardStat[];
  analyticsMetrics: AnalyticsMetric[];
};

const fullDateFormatter = new Intl.DateTimeFormat("de-AT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

function startOfToday() {
  return new Date("2026-04-26T00:00:00.000Z");
}

function daysUntil(dateIso: string) {
  const target = new Date(dateIso);
  const today = startOfToday();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getTone(daysUntilExpiry: number | null, warningDays: number): "ok" | "warning" | "critical" {
  if (daysUntilExpiry === null) {
    return "ok";
  }
  if (daysUntilExpiry <= 5) {
    return "critical";
  }
  if (daysUntilExpiry <= warningDays) {
    return "warning";
  }
  return "ok";
}

function relativeMovementLabel(isoDate: string) {
  const diffMinutes = Math.round((new Date("2026-04-26T09:24:00.000Z").getTime() - new Date(isoDate).getTime()) / 60000);
  if (diffMinutes < 60) {
    return `vor ${diffMinutes} Min.`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `vor ${diffHours} Std.`;
  }
  return `vor ${Math.floor(diffHours / 24)} Tag`;
}

function movementDayLabel(isoDate: string) {
  const date = new Date(isoDate);
  const time = date.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
  return `Heute, ${time}`;
}

function buildMaps(snapshot: DomainSnapshot) {
  return {
    locationById: new Map(snapshot.locations.map((value) => [value.id, value])),
    slotById: new Map(snapshot.slots.map((value) => [value.id, value])),
    itemById: new Map(snapshot.items.map((value) => [value.id, value])),
    batchById: new Map(snapshot.batches.map((value) => [value.id, value])),
    unitById: new Map(snapshot.unitTypes.map((value) => [value.id, value]))
  };
}

export function buildViewModel(snapshot: DomainSnapshot): AppViewModel {
  const { locationById, slotById, itemById, batchById, unitById } = buildMaps(snapshot);
  const stockLedger = new Map<string, { slotId: string; batchId: string; quantity: number }>();

  for (const movement of snapshot.movements) {
    if (movement.toSlotId) {
      const key = `${movement.toSlotId}:${movement.batchId}`;
      const entry = stockLedger.get(key) ?? { slotId: movement.toSlotId, batchId: movement.batchId, quantity: 0 };
      entry.quantity += movement.quantity;
      stockLedger.set(key, entry);
    }
    if (movement.fromSlotId) {
      const key = `${movement.fromSlotId}:${movement.batchId}`;
      const entry = stockLedger.get(key) ?? { slotId: movement.fromSlotId, batchId: movement.batchId, quantity: 0 };
      entry.quantity -= movement.quantity;
      stockLedger.set(key, entry);
    }
  }

  const stockLines: StockLine[] = Array.from(stockLedger.values())
    .filter((entry) => entry.quantity > 0)
    .map((entry) => {
      const slot = slotById.get(entry.slotId)!;
      const location = locationById.get(slot.locationId)!;
      const batch = batchById.get(entry.batchId)!;
      const item = itemById.get(batch.itemId)!;
      const unit = unitById.get(item.unitTypeId)!;
      const remainingDays = item.trackExpiry ? daysUntil(batch.expiryDate) : null;

      return {
        id: `${entry.slotId}:${entry.batchId}`,
        locationId: location.id,
        locationName: location.name,
        slotId: slot.id,
        slotName: slot.label,
        itemName: item.name,
        quantity: entry.quantity,
        unitShortCode: unit.shortCode,
        expiryDate: fullDateFormatter.format(new Date(batch.expiryDate)),
        status: getTone(remainingDays, snapshot.settings.expiryWarningDays),
        daysUntilExpiry: remainingDays
      };
    })
    .sort((left, right) => left.locationName.localeCompare(right.locationName) || left.slotName.localeCompare(right.slotName));

  const expiryAlerts: ExpiryAlert[] = stockLines
    .filter((line) => line.daysUntilExpiry !== null)
    .map((line) => {
      const [, batchId] = line.id.split(":");
      const batch = batchById.get(batchId)!;
      return {
        id: line.id,
        itemName: line.itemName,
        locationId: line.locationId,
        locationName: line.locationName,
        slotName: line.slotName,
        batchCode: batch.batchCode,
        daysUntilExpiry: line.daysUntilExpiry!,
        quantity: line.quantity,
        unitShortCode: line.unitShortCode,
        reminderDueInDays: Math.min(snapshot.settings.reminderRepeatDays, Math.max(1, line.daysUntilExpiry!))
      };
    })
    .sort((left, right) => left.daysUntilExpiry - right.daysUntilExpiry);

  const locations: LocationSummary[] = snapshot.locations.map((location) => {
    const locationSlots = snapshot.slots.filter((slot) => slot.locationId === location.id);
    const activeLines = stockLines.filter((line) => line.locationId === location.id);
    const activeSlotIds = new Set(activeLines.map((line) => line.slotId));
    const activeItemNames = new Set(activeLines.map((line) => line.itemName));
    const latestMovement = snapshot.movements
      .filter((movement) => {
        const relatedSlot = movement.toSlotId ?? movement.fromSlotId;
        return relatedSlot ? slotById.get(relatedSlot)?.locationId === location.id : false;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return {
      id: location.id,
      name: location.name,
      slotCount: locationSlots.length,
      itemCount: activeItemNames.size,
      lastMovementLabel: latestMovement ? relativeMovementLabel(latestMovement.createdAt) : "keine Bewegung",
      occupancyPercent: locationSlots.length === 0 ? 0 : Math.round((activeSlotIds.size / locationSlots.length) * 100)
    };
  });

  const recentMovements: MovementSummary[] = snapshot.movements
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5)
    .map((movement) => {
      const batch = batchById.get(movement.batchId)!;
      const item = itemById.get(batch.itemId)!;
      const unit = unitById.get(item.unitTypeId)!;
      const fromSlot = movement.fromSlotId ? slotById.get(movement.fromSlotId) : undefined;
      const toSlot = movement.toSlotId ? slotById.get(movement.toSlotId) : undefined;
      const fromLocation = fromSlot ? locationById.get(fromSlot.locationId) : undefined;
      const toLocation = toSlot ? locationById.get(toSlot.locationId) : undefined;

      return {
        id: movement.id,
        direction: movement.kind === "adjustment" ? "out" : movement.kind,
        itemName: item.name,
        quantity: movement.quantity,
        unitShortCode: unit.shortCode,
        fromLabel: fromSlot && fromLocation ? `${fromLocation.name} / ${fromSlot.label}` : undefined,
        toLabel: toSlot && toLocation ? `${toLocation.name} / ${toSlot.label}` : undefined,
        timestampLabel: movementDayLabel(movement.createdAt)
      };
    });

  const criticalCount = expiryAlerts.filter((alert) => alert.daysUntilExpiry <= 5).length;
  const warningCount = expiryAlerts.filter((alert) => alert.daysUntilExpiry <= snapshot.settings.expiryWarningDays).length;
  const lowStockCount = stockLines.filter((line) => line.quantity <= 5).length;
  const highOccupancy = locations.filter((location) => location.occupancyPercent >= 80).length;

  const dashboardStats: DashboardStat[] = [
    {
      id: "critical",
      label: "Kritisch",
      value: String(criticalCount),
      detail: "<= 5 Tage",
      tone: "critical"
    },
    {
      id: "warning",
      label: "Warnfenster",
      value: String(warningCount),
      detail: `<= ${snapshot.settings.expiryWarningDays} Tage`,
      tone: "warning"
    },
    {
      id: "low-stock",
      label: "Niedrige Bestände",
      value: String(lowStockCount),
      detail: "<= 5 Einheiten",
      tone: "neutral"
    },
    {
      id: "movements",
      label: "Bewegungen",
      value: String(snapshot.movements.filter((movement) => movement.createdAt.startsWith("2026-04-26")).length),
      detail: "heute",
      tone: "good"
    },
    {
      id: "scans",
      label: "Scans",
      value: "24",
      detail: "heute",
      tone: "neutral"
    },
    {
      id: "occupancy",
      label: "Volle Orte",
      value: String(highOccupancy),
      detail: ">= 80% belegt",
      tone: "warning"
    }
  ];

  const mostActiveLocation = locations.slice().sort((left, right) => right.itemCount - left.itemCount)[0];
  const mostCritical = expiryAlerts[0];
  const analyticsMetrics: AnalyticsMetric[] = [
    {
      id: "active-location",
      title: "Aktivster Ort",
      value: mostActiveLocation?.name ?? "-",
      detail: `${mostActiveLocation?.itemCount ?? 0} Artikel aktiv`
    },
    {
      id: "top-risk",
      title: "Nächster Ablauf",
      value: mostCritical?.itemName ?? "-",
      detail: mostCritical ? `${mostCritical.daysUntilExpiry} Tage Restzeit` : "kein Risiko"
    }
  ];

  return {
    settings: snapshot.settings,
    unitTypes: snapshot.unitTypes.slice().sort((left, right) => left.name.localeCompare(right.name)),
    locations,
    stockLines,
    expiryAlerts,
    recentMovements,
    dashboardStats,
    analyticsMetrics
  };
}
