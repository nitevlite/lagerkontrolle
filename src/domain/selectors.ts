import type { AppSettings, Batch, DomainSnapshot, Item, Location, Movement, StorageSlot, UnitType } from "./model";

export type ViewKey = "dashboard" | "locations" | "items" | "booking" | "units" | "analytics" | "log";

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
  slotId?: string;
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

export type LowStockAlert = {
  id: string;
  itemName: string;
  quantity: number;
  minimumQuantity: number;
  unitShortCode: string;
  locationName: string;
};

export type MovementSummary = {
  id: string;
  direction: Movement["kind"];
  itemName: string;
  quantity: number;
  unitShortCode: string;
  batchCode: string;
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
  lowStockAlerts: LowStockAlert[];
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));
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
  const todayKey = localDateKey();
  const movementKey = localDateKey(date);
  if (movementKey === todayKey) {
    return `Heute, ${time}`;
  }
  return `${date.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" })}, ${time}`;
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
  const stockLedger = new Map<string, { locationId: string; slotId?: string; batchId: string; quantity: number }>();

  for (const movement of snapshot.movements) {
    const toLocationId = movement.toLocationId ?? (movement.toSlotId ? slotById.get(movement.toSlotId)?.locationId : undefined);
    if (toLocationId) {
      const key = `${toLocationId}:${movement.toSlotId ?? "ort"}:${movement.batchId}`;
      const entry =
        stockLedger.get(key) ?? { locationId: toLocationId, slotId: movement.toSlotId, batchId: movement.batchId, quantity: 0 };
      entry.quantity += movement.quantity;
      stockLedger.set(key, entry);
    }
    const fromLocationId = movement.fromLocationId ?? (movement.fromSlotId ? slotById.get(movement.fromSlotId)?.locationId : undefined);
    if (fromLocationId) {
      const key = `${fromLocationId}:${movement.fromSlotId ?? "ort"}:${movement.batchId}`;
      const entry =
        stockLedger.get(key) ?? { locationId: fromLocationId, slotId: movement.fromSlotId, batchId: movement.batchId, quantity: 0 };
      entry.quantity -= movement.quantity;
      stockLedger.set(key, entry);
    }
  }

  const stockLines: StockLine[] = Array.from(stockLedger.values())
    .filter((entry) => entry.quantity > 0)
    .map((entry) => {
      const slot = entry.slotId ? slotById.get(entry.slotId) : undefined;
      const location = locationById.get(entry.locationId)!;
      const batch = batchById.get(entry.batchId)!;
      const item = itemById.get(batch.itemId)!;
      const unit = unitById.get(item.unitTypeId)!;
      const remainingDays = item.trackExpiry ? daysUntil(batch.expiryDate) : null;

      return {
        id: `${entry.locationId}:${entry.slotId ?? "ort"}:${entry.batchId}`,
        locationId: location.id,
        locationName: location.name,
        slotId: slot?.id,
        slotName: slot?.label ?? "Ohne Slot",
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
      const batchId = line.id.split(":").at(-1)!;
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

  const lowStockAlerts: LowStockAlert[] = snapshot.items
    .map((item) => {
      const relatedBatches = snapshot.batches.filter((batch) => batch.itemId === item.id);
      const totalQuantity = relatedBatches.reduce((sum, batch) => {
        const quantity = stockLines
          .filter((line) => line.id.endsWith(`:${batch.id}`))
          .reduce((lineSum, line) => lineSum + line.quantity, 0);
        return sum + quantity;
      }, 0);

      if (item.lowStockThreshold <= 0 || totalQuantity > item.lowStockThreshold) {
        return null;
      }

      const locationName =
        locationById.get(item.preferredLocationId ?? "")?.name ??
        stockLines.find((line) => line.itemName === item.name)?.locationName ??
        "kein Ort";
      const unitShortCode = unitById.get(item.unitTypeId)?.shortCode ?? "?";

      return {
        id: item.id,
        itemName: item.name,
        quantity: totalQuantity,
        minimumQuantity: item.lowStockThreshold,
        unitShortCode,
        locationName
      };
    })
    .filter((item): item is LowStockAlert => Boolean(item))
    .sort((left, right) => left.quantity - right.quantity);

  const locations: LocationSummary[] = snapshot.locations.map((location) => {
    const locationSlots = snapshot.slots.filter((slot) => slot.locationId === location.id);
    const activeLines = stockLines.filter((line) => line.locationId === location.id);
    const activeSlotIds = new Set(activeLines.map((line) => line.slotId).filter(Boolean));
    const activeItemNames = new Set(activeLines.map((line) => line.itemName));
    const latestMovement = snapshot.movements
      .filter((movement) => {
        const relatedLocation =
          movement.toLocationId ??
          movement.fromLocationId ??
          (movement.toSlotId ? slotById.get(movement.toSlotId)?.locationId : undefined) ??
          (movement.fromSlotId ? slotById.get(movement.fromSlotId)?.locationId : undefined);
        return relatedLocation === location.id;
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
    .slice(0, 50)
    .map((movement) => {
      const batch = batchById.get(movement.batchId)!;
      const item = itemById.get(batch.itemId)!;
      const unit = unitById.get(item.unitTypeId)!;
      const fromSlot = movement.fromSlotId ? slotById.get(movement.fromSlotId) : undefined;
      const toSlot = movement.toSlotId ? slotById.get(movement.toSlotId) : undefined;
      const fromLocation = movement.fromLocationId
        ? locationById.get(movement.fromLocationId)
        : fromSlot
          ? locationById.get(fromSlot.locationId)
          : undefined;
      const toLocation = movement.toLocationId
        ? locationById.get(movement.toLocationId)
        : toSlot
          ? locationById.get(toSlot.locationId)
          : undefined;

      return {
        id: movement.id,
        direction: movement.kind,
        itemName: item.name,
        quantity: movement.quantity,
        unitShortCode: unit.shortCode,
        batchCode: batch.batchCode,
        fromLabel: fromLocation ? `${fromLocation.name}${fromSlot ? ` / ${fromSlot.label}` : " / Ohne Slot"}` : undefined,
        toLabel: toLocation ? `${toLocation.name}${toSlot ? ` / ${toSlot.label}` : " / Ohne Slot"}` : undefined,
        timestampLabel: movementDayLabel(movement.createdAt)
      };
    });

  const criticalCount = expiryAlerts.filter((alert) => alert.daysUntilExpiry <= 5).length;
  const warningCount = expiryAlerts.filter((alert) => alert.daysUntilExpiry <= snapshot.settings.expiryWarningDays).length;
  const lowStockCount = lowStockAlerts.length;

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
      detail: "unter Artikelgrenze",
      tone: "neutral"
    },
    {
      id: "movements",
      label: "Bewegungen",
      value: String(snapshot.movements.filter((movement) => localDateKey(new Date(movement.createdAt)) === localDateKey()).length),
      detail: "heute",
      tone: "good"
    },
    {
      id: "scans",
      label: "Scans",
      value: "24",
      detail: "heute",
      tone: "neutral"
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
    lowStockAlerts,
    recentMovements,
    dashboardStats,
    analyticsMetrics
  };
}
