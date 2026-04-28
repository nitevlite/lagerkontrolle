import { useEffect, useMemo, useRef, useState } from "react";
import {
  IonAlert,
  IonApp,
  IonBadge,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonToast,
  IonToolbar
} from "@ionic/react";
import {
  analyticsOutline,
  barcodeOutline,
  chevronDownOutline,
  cubeOutline,
  downloadOutline,
  gridOutline,
  layersOutline,
  listOutline,
  pricetagOutline,
  refreshOutline,
  searchOutline,
  star,
  starOutline,
  timeOutline,
  trashOutline,
  warningOutline
} from "ionicons/icons";
import { ensureSeedData, repairLocalDatabase } from "./data/bootstrap";
import {
  addBatch,
  addItem,
  addLocation,
  addSlotType,
  addStorageSlot,
  addUnitType,
  createMovement,
  deleteItem,
  deleteSlotType,
  deleteUnitType,
  deleteLocation,
  deleteStorageSlot,
  loadSnapshot,
  renameLocation,
  renameSlotType,
  resetToStandardData,
  restoreSnapshot,
  toggleFavoriteItem,
  toggleFavoriteLocation,
  updateItem,
  updateSettings
} from "./data/repositories";
import { runCouchSync, type SyncStatus } from "./data/sync";
import { seedSnapshot } from "./domain/seed";
import { buildViewModel, type ViewKey } from "./domain/selectors";
import "./theme.css";

const viewMeta: Array<{ key: ViewKey; label: string; icon: string }> = [
  { key: "dashboard", label: "Dashboard", icon: gridOutline },
  { key: "locations", label: "Orte", icon: cubeOutline },
  { key: "items", label: "Artikel", icon: pricetagOutline },
  { key: "booking", label: "Buchung", icon: barcodeOutline },
  { key: "units", label: "Einheiten", icon: layersOutline },
  { key: "analytics", label: "Analyse", icon: analyticsOutline },
  { key: "log", label: "Log", icon: listOutline }
];

const expiryFilters = [7, 10, 30, 60] as const;
const displayDateFormatter = new Intl.DateTimeFormat("de-AT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});
const shortDayFormatter = new Intl.DateTimeFormat("de-AT", {
  day: "2-digit",
  month: "2-digit"
});

function toneClass(tone: "critical" | "warning" | "neutral" | "good") {
  return `tone-${tone}`;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

function getBarcodeDetector() {
  return (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
}

function normalizeBarcode(value: string) {
  const compact = value.trim().replace(/\s+/g, "");
  if (/^\d+$/.test(compact) && compact.length === 13 && compact.startsWith("0")) {
    return compact.slice(1);
  }
  return compact;
}

function parseBarcodeDraft(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map(normalizeBarcode)
        .filter(Boolean)
    )
  );
}

function itemBarcodeList(item: { barcode?: string; barcodes?: string[] }) {
  return parseBarcodeDraft([...(item.barcodes ?? []), item.barcode].filter(Boolean).join("\n"));
}

function itemHasBarcode(item: { barcode?: string; barcodes?: string[] }, value: string) {
  const normalized = normalizeBarcode(value);
  return Boolean(normalized) && itemBarcodeList(item).includes(normalized);
}

function readStoredView(): ViewKey {
  if (typeof window === "undefined") {
    return "booking";
  }

  const value = window.localStorage.getItem("lagerkontrolle:last-view");
  return viewMeta.some((view) => view.key === value) ? (value as ViewKey) : "booking";
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [activeView, setActiveView] = useState<ViewKey>(() => readStoredView());
  const [navVisible, setNavVisible] = useState(true);
  const [navExpanded, setNavExpanded] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [dashboardDetail, setDashboardDetail] = useState<"critical" | "warning" | "low-stock" | null>(null);
  const [pendingReset, setPendingReset] = useState(false);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);
  const [expiryFilterDays, setExpiryFilterDays] = useState<number>(10);
  const [warningDaysDraft, setWarningDaysDraft] = useState("10");
  const [reminderDaysDraft, setReminderDaysDraft] = useState("3");
  const [locationDetailId, setLocationDetailId] = useState<string | null>(null);
  const [locationFilterDraft, setLocationFilterDraft] = useState("");
  const [locationEditName, setLocationEditName] = useState("");
  const [slotKind, setSlotKind] = useState("Regal");
  const [slotNumber, setSlotNumber] = useState("1");
  const [slotTypeDraft, setSlotTypeDraft] = useState("");
  const [slotTypeEditSource, setSlotTypeEditSource] = useState("");
  const [slotTypeEditDraft, setSlotTypeEditDraft] = useState("");
  const [itemDetailId, setItemDetailId] = useState<string | null>(null);
  const [itemFilterDraft, setItemFilterDraft] = useState("");
  const [itemQuickFilter, setItemQuickFilter] = useState<"all" | "no-barcode" | "low" | "expiry">("all");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemNameDraft, setItemNameDraft] = useState("");
  const [itemBarcodeDraft, setItemBarcodeDraft] = useState("");
  const [itemUnitTypeId, setItemUnitTypeId] = useState("");
  const [itemPreferredLocationId, setItemPreferredLocationId] = useState("");
  const [itemLowStockThresholdDraft, setItemLowStockThresholdDraft] = useState("5");
  const [itemTrackExpiryDraft, setItemTrackExpiryDraft] = useState(true);
  const [batchCodeDraft, setBatchCodeDraft] = useState("");
  const [batchHasNoCode, setBatchHasNoCode] = useState(false);
  const [batchExpiryDateDraft, setBatchExpiryDateDraft] = useState("");
  const [bookingAction, setBookingAction] = useState<"in" | "out" | "transfer" | "adjustment">("in");
  const [bookingItemMode, setBookingItemMode] = useState<"existing" | "new">("existing");
  const [bookingItemId, setBookingItemId] = useState("");
  const [bookingNewItemNameDraft, setBookingNewItemNameDraft] = useState("");
  const [bookingNewItemBarcodeDraft, setBookingNewItemBarcodeDraft] = useState("");
  const [bookingNewItemUnitTypeId, setBookingNewItemUnitTypeId] = useState("");
  const [bookingNewItemLowStockThresholdDraft, setBookingNewItemLowStockThresholdDraft] = useState("5");
  const [bookingNewItemTrackExpiry, setBookingNewItemTrackExpiry] = useState(true);
  const [bookingLocationId, setBookingLocationId] = useState("");
  const [bookingTargetLocationId, setBookingTargetLocationId] = useState("");
  const [bookingSourceSlotId, setBookingSourceSlotId] = useState("");
  const [bookingTargetSlotId, setBookingTargetSlotId] = useState("");
  const [bookingBatchId, setBookingBatchId] = useState("");
  const [bookingQuantityDraft, setBookingQuantityDraft] = useState("1");
  const [bookingBatchMode, setBookingBatchMode] = useState<"existing" | "new">("existing");
  const [bookingNewBatchCodeDraft, setBookingNewBatchCodeDraft] = useState("");
  const [bookingBatchHasNoCode, setBookingBatchHasNoCode] = useState(false);
  const [bookingNewBatchExpiryDraft, setBookingNewBatchExpiryDraft] = useState("");
  const [bookingAdjustmentDirection, setBookingAdjustmentDirection] = useState<"increase" | "decrease">("increase");
  const [scanMode, setScanMode] = useState<"booking-item" | "item-barcode" | "booking-new-item-barcode" | "item-search" | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanInputDraft, setScanInputDraft] = useState("");
  const [scanPaused, setScanPaused] = useState(false);
  const [scanNonce, setScanNonce] = useState(0);
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [batchScanMode, setBatchScanMode] = useState(false);
  const [bookingPinnedLocationId, setBookingPinnedLocationId] = useState<string | null>(null);
  const [locationScanMode, setLocationScanMode] = useState<"single" | "multi" | null>(null);
  const [unitName, setUnitName] = useState("");
  const [unitShortCode, setUnitShortCode] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const [syncEnabledDraft, setSyncEnabledDraft] = useState(false);
  const [syncUrlDraft, setSyncUrlDraft] = useState("");
  const [syncDatabaseDraft, setSyncDatabaseDraft] = useState("lagerkontrolle");
  const [syncUsernameDraft, setSyncUsernameDraft] = useState("");
  const [syncPasswordDraft, setSyncPasswordDraft] = useState("");
  const [syncDeviceLabelDraft, setSyncDeviceLabelDraft] = useState("Gerät");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "idle",
    message: "Noch nicht synchronisiert."
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [snapshotState, setSnapshotState] = useState<Awaited<ReturnType<typeof loadSnapshot>> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const scanCandidateRef = useRef<{ value: string; count: number }>({ value: "", count: 0 });
  const itemBarcodeInputRef = useRef<HTMLIonInputElement | null>(null);
  const bookingSourceSlotRef = useRef<HTMLSelectElement | null>(null);
  const bookingTargetSlotRef = useRef<HTMLSelectElement | null>(null);
  const bookingBatchSelectRef = useRef<HTMLSelectElement | null>(null);
  const bookingBatchCodeRef = useRef<HTMLInputElement | null>(null);
  const bookingQuantityInputRef = useRef<HTMLIonInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);
        setLoadError(null);
        await ensureSeedData();
        const snapshot = await loadSnapshot();
        if (cancelled) {
          return;
        }
        setSnapshotState(snapshot);
        setWarningDaysDraft(String(snapshot.settings.expiryWarningDays));
        setReminderDaysDraft(String(snapshot.settings.reminderRepeatDays));
        setSyncEnabledDraft(snapshot.settings.sync.enabled);
        setSyncUrlDraft(snapshot.settings.sync.couchUrl);
        setSyncDatabaseDraft(snapshot.settings.sync.databaseName);
        setSyncUsernameDraft(snapshot.settings.sync.username ?? "");
        setSyncPasswordDraft(snapshot.settings.sync.password ?? "");
        setSyncDeviceLabelDraft(snapshot.settings.sync.deviceLabel);
        setSyncStatus({
          state: "idle",
          message: snapshot.settings.sync.lastSyncedAt
            ? "Zuletzt synchronisiert"
            : "Noch nicht synchronisiert.",
          lastSyncedAt: snapshot.settings.sync.lastSyncedAt
        });
        setSelectedLocationId((current) => current || snapshot.locations[0]?.id || "");
        setBookingLocationId((current) => current || snapshot.locations[0]?.id || "");
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        if (message.toLocaleLowerCase().includes("object store") && message.toLocaleLowerCase().includes("not found")) {
          try {
            await repairLocalDatabase();
            const repairedSnapshot = await loadSnapshot();
            if (cancelled) {
              return;
            }
            setSnapshotState(repairedSnapshot);
            setWarningDaysDraft(String(repairedSnapshot.settings.expiryWarningDays));
            setReminderDaysDraft(String(repairedSnapshot.settings.reminderRepeatDays));
            setSyncEnabledDraft(repairedSnapshot.settings.sync.enabled);
            setSyncUrlDraft(repairedSnapshot.settings.sync.couchUrl);
            setSyncDatabaseDraft(repairedSnapshot.settings.sync.databaseName);
            setSyncUsernameDraft(repairedSnapshot.settings.sync.username ?? "");
            setSyncPasswordDraft(repairedSnapshot.settings.sync.password ?? "");
            setSyncDeviceLabelDraft(repairedSnapshot.settings.sync.deviceLabel);
            setLoadError("Lokale Datenbank wurde wegen eines alten Speicherfehlers neu erstellt.");
            return;
          } catch {
            // Fall through to the regular fallback below.
          }
        }

        setSnapshotState(seedSnapshot);
        setWarningDaysDraft(String(seedSnapshot.settings.expiryWarningDays));
        setReminderDaysDraft(String(seedSnapshot.settings.reminderRepeatDays));
        setSyncEnabledDraft(seedSnapshot.settings.sync.enabled);
        setSyncUrlDraft(seedSnapshot.settings.sync.couchUrl);
        setSyncDatabaseDraft(seedSnapshot.settings.sync.databaseName);
        setSyncUsernameDraft(seedSnapshot.settings.sync.username ?? "");
        setSyncPasswordDraft(seedSnapshot.settings.sync.password ?? "");
        setSyncDeviceLabelDraft(seedSnapshot.settings.sync.deviceLabel);
        setSelectedLocationId((current) => current || seedSnapshot.locations[0]?.id || "");
        setBookingLocationId((current) => current || seedSnapshot.locations[0]?.id || "");
        setLoadError(message || "Lokale Daten konnten nicht geladen werden.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const viewModel = useMemo(
    () => (snapshotState ? buildViewModel(snapshotState) : null),
    [snapshotState]
  );

  useEffect(() => {
    window.localStorage.setItem("lagerkontrolle:last-view", activeView);
  }, [activeView]);

  const currentLocation =
    viewModel?.locations.find((location) => location.id === selectedLocationId) ?? viewModel?.locations[0];

  const detailLocation =
    locationDetailId && locationDetailId.length > 0
      ? viewModel?.locations.find((location) => location.id === locationDetailId) ?? null
      : null;

  useEffect(() => {
    if (locationDetailId === "") {
      setLocationEditName("");
      return;
    }

    setLocationEditName(detailLocation?.name ?? "");
  }, [detailLocation?.id, detailLocation?.name, locationDetailId]);

  useEffect(() => {
    if (!snapshotState?.items.length) {
      setSelectedItemId("");
      return;
    }

    setSelectedItemId((current) =>
      current && snapshotState.items.some((item) => item.id === current)
        ? current
        : snapshotState.items[0]?.id ?? ""
    );
  }, [snapshotState]);

  useEffect(() => {
    if (!snapshotState?.items.length) {
      setBookingItemId("");
      return;
    }

    setBookingItemId((current) =>
      current && snapshotState.items.some((item) => item.id === current)
        ? current
        : snapshotState.items[0]?.id ?? ""
    );
  }, [snapshotState]);

  useEffect(() => {
    if (!snapshotState?.unitTypes.length) {
      setBookingNewItemUnitTypeId("");
      return;
    }

    setBookingNewItemUnitTypeId((current) =>
      current && snapshotState.unitTypes.some((unitType) => unitType.id === current)
        ? current
        : snapshotState.unitTypes[0]?.id ?? ""
    );
  }, [snapshotState]);

  useEffect(() => {
    if (!viewModel?.locations.length) {
      setBookingLocationId("");
      setBookingTargetLocationId("");
      return;
    }

    setBookingLocationId((current) =>
      current && viewModel.locations.some((location) => location.id === current)
        ? current
        : viewModel.locations[0]?.id ?? ""
    );
  }, [viewModel]);

  useEffect(() => {
    if (!viewModel?.locations.length) {
      setBookingTargetLocationId("");
      return;
    }

    setBookingTargetLocationId((current) =>
      current && viewModel.locations.some((location) => location.id === current)
        ? current
        : bookingLocationId || viewModel.locations[0]?.id || ""
    );
  }, [bookingLocationId, viewModel]);

  const currentItemId =
    itemDetailId && itemDetailId.length > 0 ? itemDetailId : selectedItemId;
  const currentItem = snapshotState?.items.find((item) => item.id === currentItemId) ?? null;

  useEffect(() => {
    if (itemDetailId === "") {
      setItemNameDraft("");
      setItemBarcodeDraft("");
      setItemUnitTypeId(snapshotState?.unitTypes[0]?.id ?? "");
      setItemPreferredLocationId(snapshotState?.locations[0]?.id ?? "");
      setItemLowStockThresholdDraft("5");
      setItemTrackExpiryDraft(true);
      return;
    }

    if (currentItem) {
      setItemNameDraft(currentItem.name);
      setItemBarcodeDraft(itemBarcodeList(currentItem).join("\n"));
      setItemUnitTypeId(currentItem.unitTypeId);
      setItemPreferredLocationId(currentItem.preferredLocationId ?? snapshotState?.locations[0]?.id ?? "");
      setItemLowStockThresholdDraft(String(currentItem.lowStockThreshold ?? 5));
      setItemTrackExpiryDraft(currentItem.trackExpiry);
      return;
    }

    setItemNameDraft("");
    setItemBarcodeDraft("");
    setItemUnitTypeId(snapshotState?.unitTypes[0]?.id ?? "");
    setItemPreferredLocationId(snapshotState?.locations[0]?.id ?? "");
    setItemLowStockThresholdDraft("5");
    setItemTrackExpiryDraft(true);
  }, [currentItem, itemDetailId, snapshotState]);

  useEffect(() => {
    if (!scanMode) {
      return;
    }

    let cancelled = false;
    const BarcodeDetectorApi = getBarcodeDetector();

    async function startScan() {
      if (!BarcodeDetectorApi || !navigator.mediaDevices?.getUserMedia) {
        setScanMessage("Dieser Browser unterstützt den Kamera-Scan hier nicht.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" }
          }
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        scanStreamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          return;
        }

        video.srcObject = stream;
        await video.play();

        const detector = new BarcodeDetectorApi({
          formats: ["qr_code", "code_128", "ean_13", "ean_8", "upc_a", "upc_e"]
        });

        const tick = async () => {
          if (cancelled || !videoRef.current) {
            return;
          }

          try {
            const results = scanPaused ? [] : await detector.detect(videoRef.current);
            const value = normalizeBarcode(results.find((result) => result.rawValue?.trim())?.rawValue ?? "");

            if (value) {
              const candidate = scanCandidateRef.current;
              scanCandidateRef.current =
                candidate.value === value ? { value, count: candidate.count + 1 } : { value, count: 1 };

              if (scanCandidateRef.current.count >= 2) {
                applyScannedValue(value);
                return;
              }
            }
          } catch {
            setScanMessage("Kamera ist aktiv, aber der Code wurde noch nicht erkannt.");
          }

          scanFrameRef.current = window.requestAnimationFrame(() => {
            void tick();
          });
        };

        setScanMessage("Code ins Kamerabild halten.");
        await tick();
      } catch (error) {
        setScanMessage(error instanceof Error ? error.message : "Kamera konnte nicht gestartet werden.");
      }
    }

    void startScan();

    return () => {
      cancelled = true;
      if (scanFrameRef.current !== null) {
        window.cancelAnimationFrame(scanFrameRef.current);
        scanFrameRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      if (scanStreamRef.current) {
        scanStreamRef.current.getTracks().forEach((track) => track.stop());
        scanStreamRef.current = null;
      }
    };
  }, [scanMode, scanPaused, scanNonce]);

  const visibleAlerts = useMemo(
    () =>
      viewModel?.expiryAlerts.filter((alert) => alert.daysUntilExpiry <= expiryFilterDays) ?? [],
    [expiryFilterDays, viewModel]
  );

  const dashboardDetailAlerts = useMemo(() => {
    if (!viewModel || dashboardDetail === "low-stock") {
      return [];
    }

    if (dashboardDetail === "critical") {
      return viewModel.expiryAlerts.filter((alert) => alert.daysUntilExpiry <= 5);
    }

    if (dashboardDetail === "warning") {
      return viewModel.expiryAlerts.filter((alert) => alert.daysUntilExpiry <= viewModel.settings.expiryWarningDays);
    }

    return [];
  }, [dashboardDetail, viewModel]);

  const visibleStocks = useMemo(
    () =>
      viewModel?.stockLines.filter((line) =>
        currentLocation ? line.locationId === currentLocation.id : true
      ) ?? [],
    [currentLocation, viewModel]
  );

  const currentSlots = useMemo(
    () =>
      snapshotState?.slots
        .filter((slot) => (currentLocation ? slot.locationId === currentLocation.id : true))
        .sort((left, right) => left.sortOrder - right.sortOrder) ?? [],
    [currentLocation, snapshotState]
  );

  const favoriteLocationIds = snapshotState?.settings.favoriteLocationIds ?? [];
  const favoriteItemIds = snapshotState?.settings.favoriteItemIds ?? [];
  const favoriteLocationSet = useMemo(() => new Set(favoriteLocationIds), [favoriteLocationIds]);
  const favoriteItemSet = useMemo(() => new Set(favoriteItemIds), [favoriteItemIds]);

  const recentEntityIds = useMemo(() => {
    const itemIds: string[] = [];
    const locationIds: string[] = [];
    const seenItems = new Set<string>();
    const seenLocations = new Set<string>();
    const itemByBatchId = new Map((snapshotState?.batches ?? []).map((batch) => [batch.id, batch.itemId]));
    const locationBySlotId = new Map((snapshotState?.slots ?? []).map((slot) => [slot.id, slot.locationId]));
    const sortedMovements = [...(snapshotState?.movements ?? [])].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt)
    );

    for (const movement of sortedMovements) {
      const itemId = itemByBatchId.get(movement.batchId);
      if (itemId && !seenItems.has(itemId)) {
        seenItems.add(itemId);
        itemIds.push(itemId);
      }

      const movementLocationIds = [
        movement.toLocationId,
        movement.fromLocationId,
        movement.toSlotId ? locationBySlotId.get(movement.toSlotId) : undefined,
        movement.fromSlotId ? locationBySlotId.get(movement.fromSlotId) : undefined
      ].filter(Boolean) as string[];
      for (const locationId of movementLocationIds) {
        if (!seenLocations.has(locationId)) {
          seenLocations.add(locationId);
          locationIds.push(locationId);
        }
      }
    }

    return {
      itemIds,
      locationIds
    };
  }, [snapshotState]);

  const recentLocationByItemId = useMemo(() => {
    const map = new Map<string, string>();
    const itemByBatchId = new Map((snapshotState?.batches ?? []).map((batch) => [batch.id, batch.itemId]));
    const locationBySlotId = new Map((snapshotState?.slots ?? []).map((slot) => [slot.id, slot.locationId]));
    const sortedMovements = [...(snapshotState?.movements ?? [])].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt)
    );

    for (const movement of sortedMovements) {
      const itemId = itemByBatchId.get(movement.batchId);
      const slotId = movement.toSlotId ?? movement.fromSlotId;
      const locationId = movement.toLocationId ?? movement.fromLocationId ?? (slotId ? locationBySlotId.get(slotId) : undefined);

      if (itemId && locationId && !map.has(itemId)) {
        map.set(itemId, locationId);
      }
    }

    return map;
  }, [snapshotState]);

  const analyticsRiskList = useMemo(
    () => (viewModel?.expiryAlerts.slice(0, 4) ?? []),
    [viewModel]
  );

  const batchQuantityById = useMemo(() => {
    const quantities = new Map<string, number>();

    for (const movement of snapshotState?.movements ?? []) {
      const current = quantities.get(movement.batchId) ?? 0;
      const incoming = movement.toSlotId || movement.toLocationId ? movement.quantity : 0;
      const outgoing = movement.fromSlotId || movement.fromLocationId ? movement.quantity : 0;
      const delta = incoming - outgoing;
      quantities.set(movement.batchId, current + delta);
    }

    return quantities;
  }, [snapshotState]);

  const itemSummaries = useMemo(
    () =>
      (snapshotState?.items ?? [])
        .map((item) => {
          const relatedBatches = snapshotState?.batches.filter((batch) => batch.itemId === item.id) ?? [];
          const totalQuantity = relatedBatches.reduce(
            (sum, batch) => sum + Math.max(0, batchQuantityById.get(batch.id) ?? 0),
            0
          );
          const nextExpiry = item.trackExpiry
            ? relatedBatches
                .map((batch) => batch.expiryDate)
                .sort((left, right) => left.localeCompare(right))[0]
            : null;
          const unitType = snapshotState?.unitTypes.find((unit) => unit.id === item.unitTypeId);
          const preferredLocation = snapshotState?.locations.find((location) => location.id === item.preferredLocationId);

          return {
            id: item.id,
            name: item.name,
            barcodes: itemBarcodeList(item),
            barcode: itemBarcodeList(item).join(", ") || "kein Code",
            batchCount: relatedBatches.length,
            totalQuantity,
            trackExpiry: item.trackExpiry,
            nextExpiry: nextExpiry ? displayDateFormatter.format(new Date(nextExpiry)) : "ohne Ablauf",
            unitLabel: unitType?.shortCode ?? "?",
            preferredLocationName: preferredLocation?.name ?? "kein Ort",
            lowStockThreshold: item.lowStockThreshold
          };
        })
        .sort((left, right) => left.name.localeCompare(right.name)),
    [batchQuantityById, snapshotState]
  );

  const sortedLocations = useMemo(() => {
    const recencyRank = new Map(recentEntityIds.locationIds.map((id, index) => [id, index]));

    return [...(viewModel?.locations ?? [])].sort((left, right) => {
      const favoriteDelta = Number(favoriteLocationSet.has(right.id)) - Number(favoriteLocationSet.has(left.id));
      if (favoriteDelta !== 0) {
        return favoriteDelta;
      }

      const recentLeft = recencyRank.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const recentRight = recencyRank.get(right.id) ?? Number.MAX_SAFE_INTEGER;
      if (recentLeft !== recentRight) {
        return recentLeft - recentRight;
      }

      return left.name.localeCompare(right.name);
    });
  }, [favoriteLocationSet, recentEntityIds.locationIds, viewModel]);

  const sortedItemSummaries = useMemo(() => {
    const recencyRank = new Map(recentEntityIds.itemIds.map((id, index) => [id, index]));

    return [...itemSummaries].sort((left, right) => {
      const favoriteDelta = Number(favoriteItemSet.has(right.id)) - Number(favoriteItemSet.has(left.id));
      if (favoriteDelta !== 0) {
        return favoriteDelta;
      }

      const recentLeft = recencyRank.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const recentRight = recencyRank.get(right.id) ?? Number.MAX_SAFE_INTEGER;
      if (recentLeft !== recentRight) {
        return recentLeft - recentRight;
      }

      return left.name.localeCompare(right.name);
    });
  }, [favoriteItemSet, itemSummaries, recentEntityIds.itemIds]);

  const analyticsOccupancyBars = useMemo(() => {
    const topLocations = [...sortedLocations]
      .sort((left, right) => right.occupancyPercent - left.occupancyPercent)
      .slice(0, 5);

    return topLocations.map((location) => ({
      id: location.id,
      label: location.name,
      value: location.occupancyPercent,
      detail: `${location.itemCount} Artikel`
    }));
  }, [sortedLocations]);

  const analyticsTopItems = useMemo(() => {
    return [...sortedItemSummaries]
      .sort((left, right) => right.totalQuantity - left.totalQuantity)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        label: item.name,
        value: item.totalQuantity,
        unit: item.unitLabel
      }));
  }, [sortedItemSummaries]);

  const analyticsExpiryBuckets = useMemo(() => {
    const buckets = [
      { id: "0-7", label: "0–7", count: 0 },
      { id: "8-14", label: "8–14", count: 0 },
      { id: "15-30", label: "15–30", count: 0 },
      { id: "31plus", label: "31+", count: 0 }
    ];

    for (const alert of viewModel?.expiryAlerts ?? []) {
      if (alert.daysUntilExpiry <= 7) {
        buckets[0].count += 1;
      } else if (alert.daysUntilExpiry <= 14) {
        buckets[1].count += 1;
      } else if (alert.daysUntilExpiry <= 30) {
        buckets[2].count += 1;
      } else {
        buckets[3].count += 1;
      }
    }

    const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
    return buckets.map((bucket) => ({
      ...bucket,
      percent: Math.round((bucket.count / max) * 100)
    }));
  }, [viewModel]);

  const analyticsMovementSeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayKeys = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return localDateKey(date);
    });

    const counts = new Map(dayKeys.map((key) => [key, 0]));

    for (const movement of snapshotState?.movements ?? []) {
      const key = localDateKey(new Date(movement.createdAt));
      if (counts.has(key)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    const max = Math.max(1, ...Array.from(counts.values()));
    return dayKeys.map((key) => ({
      key,
      label: shortDayFormatter.format(new Date(`${key}T00:00:00.000Z`)),
      count: counts.get(key) ?? 0,
      percent: Math.round(((counts.get(key) ?? 0) / max) * 100)
    }));
  }, [snapshotState]);

  const favoriteLocations = useMemo(
    () => sortedLocations.filter((location) => favoriteLocationSet.has(location.id)).slice(0, 4),
    [favoriteLocationSet, sortedLocations]
  );

  const favoriteItems = useMemo(
    () => sortedItemSummaries.filter((item) => favoriteItemSet.has(item.id)).slice(0, 4),
    [favoriteItemSet, sortedItemSummaries]
  );

  const recentItems = useMemo(
    () =>
      recentEntityIds.itemIds
        .map((id) => sortedItemSummaries.find((item) => item.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .slice(0, 4),
    [recentEntityIds.itemIds, sortedItemSummaries]
  );

  const filteredLocations = useMemo(() => {
    const query = locationFilterDraft.trim().toLocaleLowerCase();
    if (!query) {
      return sortedLocations;
    }

    return sortedLocations.filter((location) =>
      location.name.toLocaleLowerCase().includes(query)
    );
  }, [locationFilterDraft, sortedLocations]);

  const filteredItems = useMemo(() => {
    const query = itemFilterDraft.trim().toLocaleLowerCase();
    const quickFiltered = sortedItemSummaries.filter((item) => {
      if (itemQuickFilter === "no-barcode") {
        return item.barcodes.length === 0;
      }
      if (itemQuickFilter === "low") {
        return item.lowStockThreshold > 0 && item.totalQuantity <= item.lowStockThreshold;
      }
      if (itemQuickFilter === "expiry") {
        return item.trackExpiry;
      }
      return true;
    });

    if (!query) {
      return quickFiltered;
    }

    return quickFiltered.filter(
      (item) =>
        item.name.toLocaleLowerCase().includes(query) ||
        item.barcode.toLocaleLowerCase().includes(query)
    );
  }, [itemFilterDraft, itemQuickFilter, sortedItemSummaries]);

  const bookingItems = sortedItemSummaries;

  const bookingItem = itemSummaries.find((item) => item.id === bookingItemId) ?? null;
  const bookingUsesNewItem = bookingAction === "in" && bookingItemMode === "new";
  const bookingDisplayItemName = bookingUsesNewItem
    ? bookingNewItemNameDraft.trim() || "Neuer Artikel"
    : bookingItem?.name ?? "Artikel wählen";
  const bookingTrackExpiry = bookingUsesNewItem ? bookingNewItemTrackExpiry : (bookingItem?.trackExpiry ?? true);
  const bookingLocation = viewModel?.locations.find((location) => location.id === bookingLocationId) ?? null;
  const scanSupported = Boolean(getBarcodeDetector() && navigator.mediaDevices?.getUserMedia);

  const bookingSourceSlots = useMemo(
    () =>
      snapshotState?.slots
        .filter((slot) => slot.locationId === bookingLocationId)
        .sort((left, right) => left.sortOrder - right.sortOrder) ?? [],
    [bookingLocationId, snapshotState]
  );

  const bookingTargetSlots = useMemo(
    () =>
      snapshotState?.slots
        .filter((slot) => slot.locationId === bookingTargetLocationId)
        .sort((left, right) => left.sortOrder - right.sortOrder) ?? [],
    [bookingTargetLocationId, snapshotState]
  );

  const bookingStockLines = useMemo(() => {
    if (!bookingItem) {
      return [];
    }

    return (viewModel?.stockLines ?? []).filter(
      (line) => line.locationId === bookingLocationId && line.itemName === bookingItem.name && line.quantity > 0
    );
  }, [bookingItem, bookingLocationId, viewModel]);

  const bookingAvailableBatches = useMemo(() => {
    const batchMap = new Map<
      string,
      { id: string; batchCode: string; expiryLabel: string; quantity: number }
    >();

    for (const line of bookingStockLines) {
      const batchId = line.id.split(":").at(-1);
      const batch = snapshotState?.batches.find((entry) => entry.id === batchId);
      if (!batch) {
        continue;
      }

      const current = batchMap.get(batch.id);
      if (current) {
        current.quantity += line.quantity;
        continue;
      }

      batchMap.set(batch.id, {
        id: batch.id,
        batchCode: batch.batchCode,
        expiryLabel: line.expiryDate,
        quantity: line.quantity
      });
    }

    return Array.from(batchMap.values()).sort((left, right) => left.expiryLabel.localeCompare(right.expiryLabel));
  }, [bookingStockLines, snapshotState]);

  const bookingAllItemBatches = useMemo(() => {
    if (!bookingItem || !snapshotState) {
      return [];
    }

    return snapshotState.batches
      .filter((batch) => batch.itemId === bookingItem.id)
      .map((batch) => ({
        id: batch.id,
        batchCode: batch.batchCode,
        expiryLabel: displayDateFormatter.format(new Date(batch.expiryDate))
      }))
      .sort((left, right) => left.expiryLabel.localeCompare(right.expiryLabel));
  }, [bookingItem, snapshotState]);

  const bookingAvailableSourceLines = useMemo(() => {
    if (!bookingBatchId) {
      return bookingStockLines;
    }

    return bookingStockLines.filter((line) => line.id.endsWith(`:${bookingBatchId}`));
  }, [bookingBatchId, bookingStockLines]);

  const bookingSourceSlotOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();

    for (const line of bookingAvailableSourceLines) {
      if (!line.slotId) {
        map.set("", { id: "", label: "Direkt am Ort" });
        continue;
      }
      if (!map.has(line.slotId)) {
        map.set(line.slotId, { id: line.slotId, label: line.slotName });
      }
    }

    return Array.from(map.values());
  }, [bookingAvailableSourceLines]);

  const bookingSelectedItemQuantity = bookingItem?.totalQuantity ?? 0;
  const bookingSelectedLocationQuantity = bookingStockLines.reduce((sum, line) => sum + line.quantity, 0);
  const bookingHasDirectSource = bookingAvailableSourceLines.some((line) => !line.slotId);

  const canCreateNewBookingBatch =
    bookingAction === "in" || (bookingAction === "adjustment" && bookingAdjustmentDirection === "increase");
  const mustUseExistingBookingBatch =
    bookingAction === "out" ||
    bookingAction === "transfer" ||
    (bookingAction === "adjustment" && bookingAdjustmentDirection === "decrease");
  const bookingExistingBatchOptions = mustUseExistingBookingBatch ? bookingAvailableBatches : bookingAllItemBatches;
  const effectiveBookingBatchId =
    bookingBatchId || (bookingExistingBatchOptions.length === 1 ? bookingExistingBatchOptions[0].id : "");
  const selectedBookingBatch = bookingExistingBatchOptions.find((batch) => batch.id === effectiveBookingBatchId);
  const selectedSourceOption = bookingSourceSlotOptions.find((slot) => slot.id === bookingSourceSlotId);
  const selectedTargetSlot = bookingTargetSlots.find((slot) => slot.id === bookingTargetSlotId);
  const selectedTargetLocation = viewModel?.locations.find((location) => location.id === bookingTargetLocationId);

  const currentItemBatches = useMemo(() => {
    if (!currentItem || !snapshotState) {
      return [];
    }

    const unitType = snapshotState.unitTypes.find((unit) => unit.id === currentItem.unitTypeId);

    return snapshotState.batches
      .filter((batch) => batch.itemId === currentItem.id)
      .map((batch) => ({
        id: batch.id,
        batchCode: batch.batchCode,
        expiryLabel: currentItem.trackExpiry
          ? displayDateFormatter.format(new Date(batch.expiryDate))
          : "ohne Ablauf",
        quantity: Math.max(0, batchQuantityById.get(batch.id) ?? 0),
        unitShortCode: unitType?.shortCode ?? "?"
      }))
      .sort((left, right) => left.expiryLabel.localeCompare(right.expiryLabel));
  }, [batchQuantityById, currentItem, snapshotState]);

  useEffect(() => {
    setBookingSourceSlotId((current) =>
      current && bookingSourceSlotOptions.some((slot) => slot.id === current)
        ? current
        : bookingSourceSlotOptions[0]?.id ?? ""
    );
  }, [bookingSourceSlotOptions]);

  useEffect(() => {
    setBookingTargetSlotId((current) =>
      current && bookingTargetSlots.some((slot) => slot.id === current) ? current : bookingTargetSlots[0]?.id ?? ""
    );
  }, [bookingTargetSlots]);

  useEffect(() => {
    if (mustUseExistingBookingBatch) {
      setBookingBatchMode("existing");
      setBookingBatchId((current) =>
        current && bookingAvailableBatches.some((batch) => batch.id === current)
          ? current
          : bookingAvailableBatches[0]?.id ?? ""
      );
      return;
    }

    if (bookingAction === "in") {
      setBookingBatchMode("new");
      setBookingBatchId("");
      return;
    }

    setBookingBatchMode("existing");
    setBookingBatchId((current) =>
      current && bookingAllItemBatches.some((batch) => batch.id === current)
        ? current
        : bookingAllItemBatches[0]?.id ?? ""
    );
  }, [bookingAction, bookingAllItemBatches, bookingAvailableBatches, mustUseExistingBookingBatch]);

  useEffect(() => {
    if (bookingAction !== "transfer") {
      setBookingTargetLocationId(bookingLocationId);
    }
  }, [bookingAction, bookingLocationId]);

  useEffect(() => {
    if (bookingAction !== "in") {
      setBookingItemMode("existing");
    }
  }, [bookingAction]);

  useEffect(() => {
    if (bookingAction === "in" && bookingItemMode === "new") {
      setBookingBatchMode("new");
      setBookingBatchId("");
    }
  }, [bookingAction, bookingItemMode]);

  useEffect(() => {
    if (!bookingItemId) {
      return;
    }

    const recentLocationId = recentLocationByItemId.get(bookingItemId);
    if (recentLocationId) {
      setBookingLocationId(recentLocationId);
      return;
    }

    const preferredLocationId = snapshotState?.items.find((item) => item.id === bookingItemId)?.preferredLocationId;
    if (preferredLocationId) {
      setBookingLocationId(preferredLocationId);
    }
  }, [bookingItemId, recentLocationByItemId, snapshotState]);

  function closeScan() {
    setScanMode(null);
    setScanMessage(null);
    setScanPaused(false);
    setScanInputDraft("");
    scanCandidateRef.current = { value: "", count: 0 };
  }

  function restartScan() {
    setScanMessage("Code ins Kamerabild halten.");
    setScanInputDraft("");
    setScanPaused(false);
    scanCandidateRef.current = { value: "", count: 0 };
    setScanNonce((current) => current + 1);
  }

  function rememberScan(value: string) {
    setRecentScans((current) => [value, ...current.filter((entry) => entry !== value)].slice(0, 5));
    if ("vibrate" in navigator) {
      navigator.vibrate?.(45);
    }
  }

  function focusNextBookingField() {
    window.setTimeout(() => {
      if (mustUseExistingBookingBatch) {
        bookingBatchSelectRef.current?.focus();
        return;
      }

      if (bookingBatchMode === "new") {
        if (!bookingBatchHasNoCode && !bookingNewBatchCodeDraft.trim()) {
          bookingBatchCodeRef.current?.focus();
          return;
        }
      } else if (!bookingBatchId) {
        bookingBatchSelectRef.current?.focus();
        return;
      }

      bookingQuantityInputRef.current?.setFocus();
    }, 160);
  }

  function applyScannedValue(rawValue: string) {
    const value = normalizeBarcode(rawValue);
    if (!value) {
      setScanMessage("Bitte einen Barcode eingeben oder scannen.");
      return;
    }
    rememberScan(value);
    setScanPaused(true);

    if (scanMode === "item-barcode") {
      setItemBarcodeDraft((current) => parseBarcodeDraft(`${current}\n${value}`).join("\n"));
      closeScan();
      window.setTimeout(() => {
        itemBarcodeInputRef.current?.setFocus();
      }, 120);
      return;
    }

    if (scanMode === "booking-new-item-barcode") {
      setBookingNewItemBarcodeDraft(value);
      closeScan();
      return;
    }

    if (scanMode === "item-search") {
      const matchedItem = itemSummaries.find((item) => item.barcodes.includes(value));
      if (matchedItem) {
        handleOpenItemDetail(matchedItem.id);
        closeScan();
        return;
      }

      handleNewItem();
      setItemBarcodeDraft(value);
      setScanMessage(`Kein Artikel mit Code ${value} gefunden. Neuer Artikel ist vorbereitet.`);
      closeScan();
      return;
    }

    if (scanMode === "booking-item") {
      const matchedItem = itemSummaries.find((item) => item.barcodes.includes(value));
      if (matchedItem) {
        setBookingItemMode("existing");
        setBookingItemId(matchedItem.id);
        closeScan();
        if (activeView === "booking") {
          focusNextBookingField();
        }
        return;
      }

      setBookingAction("in");
      setBookingItemMode("new");
      setBookingNewItemBarcodeDraft(value);
      setBookingNewItemNameDraft("");
      setBookingBatchMode("new");
      setBookingBatchId("");
      closeScan();
      if (activeView === "booking") {
        setActionError(`Kein Artikel mit Code ${value} gefunden. Neuer Artikel ist vorbereitet.`);
      }
    }
  }

  function openScan(mode: "booking-item" | "item-barcode" | "booking-new-item-barcode" | "item-search") {
    setScanMode(mode);
    setScanInputDraft("");
    setScanMessage(null);
    setScanPaused(false);
    scanCandidateRef.current = { value: "", count: 0 };
    setScanNonce((current) => current + 1);
  }

  function reuseBookingScan(code: string) {
    const matchedItem = itemSummaries.find((item) => item.barcodes.includes(normalizeBarcode(code)));
    if (matchedItem) {
      setBookingItemMode("existing");
      setBookingItemId(matchedItem.id);
      return;
    }

    setBookingAction("in");
    setBookingItemMode("new");
    setBookingNewItemBarcodeDraft(code);
  }

  function handleExportBackup() {
    if (!snapshotState) {
      return;
    }

    downloadTextFile(
      `lagerkontrolle-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(snapshotState, null, 2),
      "application/json"
    );
  }

  function handleExportStockCsv() {
    const header = "ort,slot,artikel,menge,einheit,charge,ablaufdatum";
    const rows = (viewModel?.stockLines ?? []).map((line) =>
      [
        line.locationName,
        line.slotName,
        line.itemName,
        String(line.quantity).replace(".", ","),
        line.unitShortCode,
        line.id.split(":")[1] ?? "",
        line.expiryDate
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(",")
    );

    downloadTextFile(
      `lagerkontrolle-bestand-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows].join("\n"),
      "text/csv;charset=utf-8"
    );
  }

  async function handleRestoreBackup(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as Awaited<ReturnType<typeof loadSnapshot>>;
      if (!Array.isArray(parsed.locations) || !Array.isArray(parsed.items) || !parsed.settings) {
        throw new Error("Backup-Datei hat nicht das erwartete Format.");
      }

      await restoreSnapshot(parsed);
      setRefreshToken((current) => current + 1);
      setActiveView("booking");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Backup konnte nicht importiert werden.");
    } finally {
      if (backupInputRef.current) {
        backupInputRef.current.value = "";
      }
    }
  }

  async function handleSaveLocation() {
    const trimmed = locationEditName.trim();
    if (!trimmed) {
      return;
    }

    try {
      if (locationDetailId === "") {
        const newLocationId = await addLocation({ name: trimmed });
        if (newLocationId) {
          setSelectedLocationId(newLocationId);
          setLocationDetailId(newLocationId);
        }
      } else if (detailLocation) {
        await renameLocation({ id: detailLocation.id, name: trimmed });
      }
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Ort konnte nicht gespeichert werden.");
    }
  }

  async function handleSaveSlot() {
    if (!currentLocation) {
      return;
    }

    try {
      await addStorageSlot({
        locationId: currentLocation.id,
        kind: slotKind,
        number: Math.max(1, Number(slotNumber || "1"))
      });
      setSlotNumber("1");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Slot konnte nicht gespeichert werden.");
    }
  }

  async function handleSaveUnit() {
    const trimmedName = unitName.trim();
    const trimmedCode = unitShortCode.trim();
    if (!trimmedName || !trimmedCode) {
      return;
    }

    await addUnitType({
      name: trimmedName,
      shortCode: trimmedCode,
      description: unitDescription.trim() || "Benutzerdefiniert"
    });
    setUnitName("");
    setUnitShortCode("");
    setUnitDescription("");
    setRefreshToken((current) => current + 1);
  }

  async function handlePersistSettings() {
    const warningDays = Math.max(1, Number(warningDaysDraft || "10"));
    const reminderDays = Math.max(1, Number(reminderDaysDraft || "3"));

    await updateSettings({
      expiryWarningDays: warningDays,
      reminderRepeatDays: reminderDays
    });
    setRefreshToken((current) => current + 1);
  }

  async function handleSaveSyncConfig() {
    const current = snapshotState?.settings.sync;
    await updateSettings({
      sync: {
        enabled: syncEnabledDraft,
        couchUrl: syncUrlDraft.trim(),
        databaseName: syncDatabaseDraft.trim() || "lagerkontrolle",
        username: syncUsernameDraft.trim() || undefined,
        password: syncPasswordDraft.trim() || undefined,
        deviceId: current?.deviceId ?? crypto.randomUUID(),
        deviceLabel: syncDeviceLabelDraft.trim() || "Gerät",
        lastSyncedAt: current?.lastSyncedAt
      }
    });
    setRefreshToken((currentValue) => currentValue + 1);
  }

  async function handleRunSync() {
    const currentConfig = snapshotState?.settings.sync;
    const syncConfig = {
      enabled: syncEnabledDraft,
      couchUrl: syncUrlDraft.trim(),
      databaseName: syncDatabaseDraft.trim() || "lagerkontrolle",
      username: syncUsernameDraft.trim() || undefined,
      password: syncPasswordDraft.trim() || undefined,
      deviceId: currentConfig?.deviceId ?? crypto.randomUUID(),
      deviceLabel: syncDeviceLabelDraft.trim() || "Gerät",
      lastSyncedAt: currentConfig?.lastSyncedAt
    };

    try {
      setSyncStatus({
        state: "syncing",
        message: "Synchronisation läuft …",
        lastSyncedAt: currentConfig?.lastSyncedAt
      });

      await updateSettings({ sync: syncConfig });
      const result = await runCouchSync(syncConfig);
      await updateSettings({
        sync: {
          ...syncConfig,
          lastSyncedAt: result.lastSyncedAt
        }
      });
      setSyncStatus(result);
      setRefreshToken((currentValue) => currentValue + 1);
    } catch (error) {
      setSyncStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Synchronisation fehlgeschlagen.",
        lastSyncedAt: currentConfig?.lastSyncedAt
      });
    }
  }

  async function handleResetLocalData() {
    try {
      await resetToStandardData();
      setPendingReset(false);
      setLocationDetailId(null);
      setItemDetailId(null);
      setSelectedLocationId("");
      setSelectedItemId("");
      setBookingItemId("");
      setBookingLocationId("");
      setBookingPinnedLocationId(null);
      setBatchScanMode(false);
      setRefreshToken((currentValue) => currentValue + 1);
      setActiveView("booking");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Lokale Daten konnten nicht zurückgesetzt werden.");
    }
  }

  async function handleRenameLocation() {
    if (!currentLocation) {
      return;
    }

    try {
      await renameLocation({ id: currentLocation.id, name: locationEditName });
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Ort konnte nicht aktualisiert werden.");
    }
  }

  async function handleDeleteLocation() {
    if (!detailLocation) {
      return;
    }

    try {
      await deleteLocation(detailLocation.id);
      setSelectedLocationId("");
      setLocationDetailId(null);
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Ort konnte nicht gelöscht werden.");
    }
  }

  async function handleDeleteSlot(slotId: string) {
    try {
      await deleteStorageSlot(slotId);
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Slot konnte nicht gelöscht werden.");
    }
  }

  async function handleSaveItem() {
    const unitTypeId = itemUnitTypeId || snapshotState?.unitTypes[0]?.id;
    if (!unitTypeId) {
      setActionError("Bitte zuerst einen Einheitentyp anlegen.");
      return;
    }

    try {
      const itemBarcodes = parseBarcodeDraft(itemBarcodeDraft);
      if (currentItem && currentItem.id === selectedItemId) {
        await updateItem({
          id: currentItem.id,
          name: itemNameDraft,
          unitTypeId,
          barcode: itemBarcodes[0],
          barcodes: itemBarcodes,
          trackExpiry: itemTrackExpiryDraft,
          preferredLocationId: itemPreferredLocationId || undefined,
          lowStockThreshold: Math.max(0, Number(itemLowStockThresholdDraft || "0"))
        });
      } else {
        const newItemId = await addItem({
          name: itemNameDraft,
          unitTypeId,
          barcode: itemBarcodes[0],
          barcodes: itemBarcodes,
          trackExpiry: itemTrackExpiryDraft,
          preferredLocationId: itemPreferredLocationId || undefined,
          lowStockThreshold: Math.max(0, Number(itemLowStockThresholdDraft || "0"))
        });
        if (newItemId) {
          setSelectedItemId(newItemId);
          setItemDetailId(newItemId);
        }
      }

      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Artikel konnte nicht gespeichert werden.");
    }
  }

  async function handleSaveBatch() {
    if (!currentItem) {
      setActionError("Bitte zuerst einen Artikel wählen.");
      return;
    }

    if (currentItem.trackExpiry && !batchExpiryDateDraft) {
      setActionError("Bitte ein Ablaufdatum für die Charge setzen.");
      return;
    }

    try {
      await addBatch({
        itemId: currentItem.id,
        batchCode: batchHasNoCode ? "" : batchCodeDraft,
        expiryDate: currentItem.trackExpiry ? batchExpiryDateDraft : batchExpiryDateDraft || "2099-12-31"
      });
      setBatchCodeDraft("");
      setBatchHasNoCode(false);
      setBatchExpiryDateDraft("");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Charge konnte nicht gespeichert werden.");
    }
  }

  async function handleSaveBooking() {
    if (!bookingUsesNewItem && !bookingItem) {
      setActionError("Bitte zuerst einen Artikel wählen.");
      return;
    }

    const quantity = Math.max(0, Number(bookingQuantityDraft || "0"));
    if (quantity <= 0) {
      setActionError("Bitte eine gültige Menge eingeben.");
      return;
    }

    const wantsExistingBatch = mustUseExistingBookingBatch || bookingBatchMode === "existing";

    if (wantsExistingBatch && !effectiveBookingBatchId) {
      setActionError("Bitte eine bestehende Charge wählen.");
      return;
    }

    if (!wantsExistingBatch && !canCreateNewBookingBatch) {
      setActionError("Diese Buchung benötigt eine bestehende Charge.");
      return;
    }

    const needsSourceSlot =
      bookingAction === "out" ||
      bookingAction === "transfer" ||
      (bookingAction === "adjustment" && bookingAdjustmentDirection === "decrease");
    const needsTargetLocation =
      bookingAction === "in" ||
      bookingAction === "transfer" ||
      (bookingAction === "adjustment" && bookingAdjustmentDirection === "increase");

    if (needsSourceSlot && !bookingSourceSlotId && !bookingHasDirectSource) {
      setActionError("Bitte zuerst einen Quellort mit Bestand wählen. Wenn noch kein Bestand vorhanden ist, zuerst Zugang buchen.");
      return;
    }

    if (needsTargetLocation && !(bookingTargetLocationId || bookingLocationId)) {
      setActionError("Bitte zuerst einen Ort wählen.");
      return;
    }

    try {
      const successItemName = bookingUsesNewItem ? bookingNewItemNameDraft.trim() : bookingItem?.name ?? "Artikel";
      const successLocationName =
        bookingAction === "out"
          ? bookingLocation?.name ?? "Ort"
          : viewModel?.locations.find((location) => location.id === (bookingTargetLocationId || bookingLocationId))?.name ??
            bookingLocation?.name ??
            "Ort";
      let effectiveItemId = bookingItem?.id;

      if (bookingUsesNewItem) {
        if (!bookingNewItemNameDraft.trim()) {
          setActionError("Bitte einen Artikelnamen eingeben.");
          return;
        }

        if (!bookingNewItemUnitTypeId) {
          setActionError("Bitte eine Einheit wählen.");
          return;
        }

        const latestSnapshot = await loadSnapshot();
        const newName = bookingNewItemNameDraft.trim().toLocaleLowerCase();
        const newBarcode = normalizeBarcode(bookingNewItemBarcodeDraft);
        const existingItem = latestSnapshot.items.find(
          (item) =>
            item.name.trim().toLocaleLowerCase() === newName ||
            itemHasBarcode(item, newBarcode)
        );

        if (existingItem) {
          effectiveItemId = existingItem.id;
          setBookingItemId(existingItem.id);
          setBookingItemMode("existing");
        } else {
          effectiveItemId = await addItem({
            name: bookingNewItemNameDraft,
            unitTypeId: bookingNewItemUnitTypeId,
            barcode: newBarcode,
            barcodes: newBarcode ? [newBarcode] : [],
            trackExpiry: bookingNewItemTrackExpiry,
            preferredLocationId: bookingLocationId || undefined,
            lowStockThreshold: Math.max(0, Number(bookingNewItemLowStockThresholdDraft || "0"))
          });
        }
      }

      if (!effectiveItemId) {
        setActionError("Artikel konnte nicht vorbereitet werden.");
        return;
      }

      if (bookingAction === "in") {
        await createMovement({
          kind: "in",
          itemId: effectiveItemId,
          quantity,
          toLocationId: bookingTargetSlotId ? undefined : bookingTargetLocationId || bookingLocationId,
          toSlotId: bookingTargetSlotId || undefined,
          batchId: wantsExistingBatch ? effectiveBookingBatchId : undefined,
          batchCode: wantsExistingBatch || bookingBatchHasNoCode ? undefined : bookingNewBatchCodeDraft,
          expiryDate: wantsExistingBatch ? undefined : bookingNewBatchExpiryDraft
        });
      } else if (bookingAction === "out") {
        await createMovement({
          kind: "out",
          itemId: effectiveItemId,
          quantity,
          fromLocationId: bookingSourceSlotId ? undefined : bookingLocationId,
          fromSlotId: bookingSourceSlotId || undefined,
          batchId: effectiveBookingBatchId
        });
      } else if (bookingAction === "transfer") {
        await createMovement({
          kind: "transfer",
          itemId: effectiveItemId,
          quantity,
          fromLocationId: bookingSourceSlotId ? undefined : bookingLocationId,
          toLocationId: bookingTargetSlotId ? undefined : bookingTargetLocationId,
          fromSlotId: bookingSourceSlotId || undefined,
          toSlotId: bookingTargetSlotId || undefined,
          batchId: effectiveBookingBatchId
        });
      } else {
        await createMovement({
          kind: "adjustment",
          itemId: effectiveItemId,
          quantity,
          fromLocationId: bookingAdjustmentDirection === "decrease" && !bookingSourceSlotId ? bookingLocationId : undefined,
          toLocationId:
            bookingAdjustmentDirection === "increase" && !bookingTargetSlotId
              ? bookingTargetLocationId || bookingLocationId
              : undefined,
          fromSlotId: bookingAdjustmentDirection === "decrease" ? bookingSourceSlotId || undefined : undefined,
          toSlotId: bookingAdjustmentDirection === "increase" ? bookingTargetSlotId || undefined : undefined,
          batchId: wantsExistingBatch ? effectiveBookingBatchId : undefined,
          batchCode: wantsExistingBatch || bookingBatchHasNoCode ? undefined : bookingNewBatchCodeDraft,
          expiryDate: wantsExistingBatch ? undefined : bookingNewBatchExpiryDraft
        });
      }

      setBookingQuantityDraft("1");
      setBookingItemId(effectiveItemId);
      setBookingItemMode("existing");
      setBookingBatchId("");
      setBookingBatchMode(bookingAction === "in" ? "new" : "existing");
      setBookingNewBatchCodeDraft("");
      setBookingNewBatchExpiryDraft("");
      setBookingNewItemNameDraft("");
      setBookingNewItemBarcodeDraft("");
      setBookingNewItemLowStockThresholdDraft("5");
      setBookingNewItemTrackExpiry(true);
      setActionSuccess(`Buchung gespeichert: ${quantity} x ${successItemName} bei ${successLocationName}.`);
      setRefreshToken((current) => current + 1);
      if (locationScanMode === "single") {
        closeLocationScanFlow();
      } else if (batchScanMode) {
        window.setTimeout(() => openScan("booking-item"), 250);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Buchung konnte nicht gespeichert werden.");
    }
  }

  async function handleSaveSlotType() {
    try {
      await addSlotType(slotTypeDraft);
      setSlotTypeDraft("");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Slot-Typ konnte nicht gespeichert werden.");
    }
  }

  async function handleCreateBookingSlot() {
    if (!bookingLocationId) {
      setActionError("Bitte zuerst einen Ort wählen.");
      return;
    }

    try {
      await addStorageSlot({
        locationId: bookingLocationId,
        kind: slotKind,
        number: bookingTargetSlots.length + 1
      });
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Slot konnte nicht angelegt werden.");
    }
  }

  async function handleRenameSlotType() {
    try {
      await renameSlotType({
        previousName: slotTypeEditSource,
        nextName: slotTypeEditDraft
      });
      setSlotTypeEditSource("");
      setSlotTypeEditDraft("");
      setSlotKind((current) => (current === slotTypeEditSource ? slotTypeEditDraft : current));
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Slot-Typ konnte nicht umbenannt werden.");
    }
  }

  async function handleDeleteSlotType(name: string) {
    try {
      await deleteSlotType(name);
      if (slotKind === name) {
        setSlotKind(snapshotState?.settings.slotTypeNames.find((entry) => entry !== name) ?? "Regal");
      }
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Slot-Typ konnte nicht gelöscht werden.");
    }
  }

  async function handleToggleFavoriteLocation(locationId: string) {
    await toggleFavoriteLocation(locationId);
    setRefreshToken((current) => current + 1);
  }

  async function handleToggleFavoriteItem(itemId: string) {
    await toggleFavoriteItem(itemId);
    setRefreshToken((current) => current + 1);
  }

  async function handleDeleteUnitType(unitTypeId: string) {
    try {
      await deleteUnitType(unitTypeId);
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Einheit konnte nicht gelöscht werden.");
    }
  }

  async function handleDeleteItem() {
    if (!pendingDeleteItemId) {
      return;
    }

    try {
      await deleteItem(pendingDeleteItemId);
      setPendingDeleteItemId(null);
      setItemDetailId(null);
      setSelectedItemId("");
      setBookingItemId("");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Artikel konnte nicht gelöscht werden.");
    }
  }

  function handleNewItem() {
    setItemDetailId("");
    setItemNameDraft("");
    setItemBarcodeDraft("");
    setItemUnitTypeId(snapshotState?.unitTypes[0]?.id ?? "");
    setItemPreferredLocationId(snapshotState?.locations[0]?.id ?? "");
    setItemLowStockThresholdDraft("5");
    setItemTrackExpiryDraft(true);
    setBatchCodeDraft("");
    setBatchExpiryDateDraft("");
  }

  function handleOpenLocationDetail(locationId: string) {
    setSelectedLocationId(locationId);
    setLocationDetailId(locationId);
  }

  function handleOpenItemDetail(itemId: string) {
    setSelectedItemId(itemId);
    setItemDetailId(itemId);
  }

  function handleLocationScan(locationId: string, multiple = false) {
    setBookingAction("in");
    setBookingLocationId(locationId);
    setBookingTargetLocationId(locationId);
    setBookingPinnedLocationId(locationId);
    setBatchScanMode(multiple);
    setLocationScanMode(multiple ? "multi" : "single");
    openScan("booking-item");
  }

  function closeLocationScanFlow() {
    setLocationScanMode(null);
    setBookingPinnedLocationId(null);
    setBatchScanMode(false);
  }

  function handleBookingLocationChange(nextLocationId: string) {
    if (
      bookingPinnedLocationId &&
      nextLocationId !== bookingPinnedLocationId &&
      !window.confirm("Dieser Scan wurde aus einem Ort gestartet. Wirklich auf einen anderen Ort buchen?")
    ) {
      return;
    }

    if (nextLocationId === bookingPinnedLocationId) {
      setBookingPinnedLocationId(nextLocationId);
    } else {
      setBookingPinnedLocationId(null);
      setBatchScanMode(false);
    }

    setBookingLocationId(nextLocationId);
  }

  function scrollToBookingForm() {
    window.setTimeout(() => {
      document.querySelector(".booking-form-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleContentScroll(event: CustomEvent<{ scrollTop: number }>) {
    const scrollTop = event.detail.scrollTop ?? 0;
    if (scrollTop <= 72) {
      setNavVisible(true);
      return;
    }

    if (scrollTop >= 120) {
      setNavVisible(false);
    }
  }

  return (
    <IonApp>
      <IonPage>
        <IonAlert
          isOpen={Boolean(loadError)}
          header="Lokaler Speicher"
          message={`${loadError ?? ""} Die App zeigt vorerst Seed-Daten an.`}
          buttons={[
            {
              text: "OK",
              role: "cancel",
              handler: () => setLoadError(null)
            }
          ]}
        />
        <IonAlert
          isOpen={Boolean(actionError)}
          header="Hinweis"
          message={actionError ?? ""}
          buttons={[
            {
              text: "OK",
              role: "cancel",
              handler: () => setActionError(null)
            }
          ]}
        />
        <IonToast
          isOpen={Boolean(actionSuccess)}
          message={actionSuccess ?? ""}
          duration={2600}
          color="success"
          position="top"
          onDidDismiss={() => setActionSuccess(null)}
        />
        <IonAlert
          isOpen={pendingReset}
          header="Wirklich alles löschen?"
          message="Alle Orte, Slots, Artikel, Chargen, Bewegungen und lokalen Einstellungen auf diesem Gerät werden gelöscht. Standard-Einheiten und Slot-Typen werden danach neu angelegt. Diese Aktion kann nur mit einem vorherigen Backup rückgängig gemacht werden."
          buttons={[
            {
              text: "Abbrechen",
              role: "cancel",
              handler: () => setPendingReset(false)
            },
            {
              text: "Ja, alles löschen",
              role: "destructive",
              handler: () => void handleResetLocalData()
            }
          ]}
        />
        <IonAlert
          isOpen={Boolean(pendingDeleteItemId)}
          header="Artikel löschen"
          message="Dieser Artikel wird inklusive Chargen und Bewegungen von diesem Gerät gelöscht."
          buttons={[
            {
              text: "Abbrechen",
              role: "cancel",
              handler: () => setPendingDeleteItemId(null)
            },
            {
              text: "Löschen",
              role: "destructive",
              handler: () => void handleDeleteItem()
            }
          ]}
        />
        <IonContent fullscreen className="shell" scrollEvents onIonScroll={handleContentScroll}>
          <div className="shell__inner">
            {isLoading || !viewModel ? (
              <section className="surface surface--loading">Daten werden geladen …</section>
            ) : (
              <>
                <section className={navVisible ? "surface surface--nav" : "surface surface--nav surface--nav-hidden"}>
                  <button
                    type="button"
                    className="mobile-nav-toggle"
                    onClick={() => setNavExpanded((current) => !current)}
                  >
                    <span>{viewMeta.find((view) => view.key === activeView)?.label ?? "Navigation"}</span>
                    <IonIcon icon={chevronDownOutline} />
                  </button>
                  <div className={navExpanded ? "view-switcher view-switcher--expanded" : "view-switcher"}>
                    {viewMeta.map((view) => (
                      <button
                        key={view.key}
                        type="button"
                        className={
                          view.key === activeView
                            ? "view-switcher__button view-switcher__button--active"
                            : "view-switcher__button"
                        }
                        onClick={() => {
                          setActiveView(view.key);
                          setNavExpanded(false);
                        }}
                      >
                        <IonIcon icon={view.icon} />
                        <span>{view.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {activeView === "dashboard" ? (
                  <div className="stack">
                    <section className="surface">
                      <header className="section-header section-header--stack-mobile">
                        <div>
                          <h1>Dashboard</h1>
                          <span>Warnung standardmäßig {viewModel.settings.expiryWarningDays} Tage vorher</span>
                        </div>
                        <IonButton className="primary-button" onClick={() => setActiveView("booking")}>
                          Zur Buchung
                        </IonButton>
                      </header>
                      <div className="metric-grid metric-grid--dashboard">
                        {viewModel.dashboardStats.map((stat) => (
                          <button
                            key={stat.id}
                            type="button"
                            className={
                              dashboardDetail === stat.id
                                ? "metric-card metric-card--button metric-card--active"
                                : "metric-card metric-card--button"
                            }
                            onClick={() => {
                              if (stat.id === "critical" || stat.id === "warning" || stat.id === "low-stock") {
                                const detailId = stat.id as "critical" | "warning" | "low-stock";
                                setDashboardDetail((current) => (current === detailId ? null : detailId));
                                return;
                              }
                              if (stat.id === "movements") {
                                setActiveView("log");
                              }
                            }}
                          >
                            <span>{stat.label}</span>
                            <strong>{stat.value}</strong>
                            <small>{stat.detail}</small>
                          </button>
                        ))}
                      </div>
                    </section>

                    {dashboardDetail ? (
                      <section className="surface">
                        <header className="section-header">
                          <div>
                            <h2>
                              {dashboardDetail === "critical"
                                ? "Kritische Abläufe"
                                : dashboardDetail === "warning"
                                  ? "Warnfenster"
                                  : "Niedrige Bestände"}
                            </h2>
                            <span>
                              {dashboardDetail === "low-stock"
                                ? `${viewModel.lowStockAlerts.length} Treffer`
                                : `${dashboardDetailAlerts.length} Treffer`}
                            </span>
                          </div>
                          <IonButton fill="clear" className="back-button" onClick={() => setDashboardDetail(null)}>
                            Schließen
                          </IonButton>
                        </header>
                        <div className="list list--mobile-cards">
                          {dashboardDetail === "low-stock" ? (
                            viewModel.lowStockAlerts.length > 0 ? (
                              viewModel.lowStockAlerts.map((alert) => (
                                <article key={alert.id} className="list-row list-row--mobile-card">
                                  <div className="list-row__main">
                                    <strong>{alert.itemName}</strong>
                                    <span>{alert.locationName}</span>
                                  </div>
                                  <div className="list-row__meta">
                                    <b>
                                      {alert.quantity} / {alert.minimumQuantity} {alert.unitShortCode}
                                    </b>
                                    <small>Bestand unter Grenze</small>
                                  </div>
                                </article>
                              ))
                            ) : (
                              <div className="empty-state">Keine niedrigen Bestände.</div>
                            )
                          ) : dashboardDetailAlerts.length > 0 ? (
                            dashboardDetailAlerts.map((alert) => (
                              <article key={alert.id} className="list-row list-row--mobile-card">
                                <div className="list-row__main">
                                  <strong>{alert.itemName}</strong>
                                  <span>
                                    {alert.locationName} · {alert.slotName}
                                  </span>
                                  <span>Charge {alert.batchCode}</span>
                                </div>
                                <div className="list-row__meta">
                                  <b className={`status-text ${toneClass(alert.daysUntilExpiry <= 5 ? "critical" : "warning")}`}>
                                    {alert.daysUntilExpiry} Tage
                                  </b>
                                  <small>
                                    {alert.quantity} {alert.unitShortCode}
                                  </small>
                                </div>
                              </article>
                            ))
                          ) : (
                            <div className="empty-state">Keine Treffer.</div>
                          )}
                        </div>
                      </section>
                    ) : null}

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Ablauf</h2>
                          <span>{visibleAlerts.length} Treffer im Filter</span>
                        </div>
                        <IonBadge color="light">{expiryFilterDays} Tage</IonBadge>
                      </header>

                      <div className="filter-pills filter-pills--grid-mobile">
                        {expiryFilters.map((days) => (
                          <button
                            key={days}
                            type="button"
                            className={days === expiryFilterDays ? "pill pill--active" : "pill"}
                            onClick={() => setExpiryFilterDays(days)}
                          >
                            {days} Tage
                          </button>
                        ))}
                      </div>

                      <div className="list list--mobile-cards">
                        {visibleAlerts.map((alert) => (
                          <article key={alert.id} className="list-row list-row--mobile-card">
                            <div className="list-row__main">
                              <strong>{alert.itemName}</strong>
                              <span>
                                {alert.locationName} · {alert.slotName}
                              </span>
                            </div>
                            <div className="list-row__meta">
                              <b
                                className={`status-text ${toneClass(
                                  alert.daysUntilExpiry <= 5
                                    ? "critical"
                                    : alert.daysUntilExpiry <= viewModel.settings.expiryWarningDays
                                      ? "warning"
                                      : "good"
                                )}`}
                              >
                                {alert.daysUntilExpiry} T
                              </b>
                              <small>
                                {alert.quantity} {alert.unitShortCode}
                              </small>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Niedrige Bestände</h2>
                          <span>{viewModel.lowStockAlerts.length} Treffer</span>
                        </div>
                      </header>
                      <div className="list list--mobile-cards">
                        {viewModel.lowStockAlerts.map((alert) => (
                          <article key={alert.id} className="list-row list-row--mobile-card">
                            <div className="list-row__main">
                              <strong>{alert.itemName}</strong>
                              <span>{alert.locationName}</span>
                            </div>
                            <div className="list-row__meta">
                              <b>
                                {alert.quantity} / {alert.minimumQuantity} {alert.unitShortCode}
                              </b>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Schnellzugriffe</h2>
                          <span>Favoriten und zuletzt genutzt</span>
                        </div>
                      </header>
                      <div className="shortcut-grid">
                        {favoriteLocations.map((location) => (
                          <button
                            key={`fav-loc-${location.id}`}
                            type="button"
                            className="shortcut-card"
                            onClick={() => {
                              handleOpenLocationDetail(location.id);
                              setActiveView("locations");
                            }}
                          >
                            <div className="shortcut-card__top">
                              <IonIcon icon={star} />
                              <span>Ort</span>
                            </div>
                            <strong>{location.name}</strong>
                            <small>{location.slotCount} Slots</small>
                          </button>
                        ))}
                        {favoriteItems.map((item) => (
                          <button
                            key={`fav-item-${item.id}`}
                            type="button"
                            className="shortcut-card"
                            onClick={() => {
                              handleOpenItemDetail(item.id);
                              setActiveView("items");
                            }}
                          >
                            <div className="shortcut-card__top">
                              <IonIcon icon={star} />
                              <span>Artikel</span>
                            </div>
                            <strong>{item.name}</strong>
                            <small>{item.totalQuantity} {item.unitLabel}</small>
                          </button>
                        ))}
                        {recentItems.map((item) => (
                          <button
                            key={`recent-item-${item.id}`}
                            type="button"
                            className="shortcut-card"
                            onClick={() => {
                              setBookingItemId(item.id);
                              setActiveView("booking");
                            }}
                          >
                            <div className="shortcut-card__top">
                              <IonIcon icon={timeOutline} />
                              <span>Zuletzt</span>
                            </div>
                            <strong>{item.name}</strong>
                            <small>{item.barcode}</small>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Warnungen</h2>
                          <span>Globale Vorgaben für Ablaufhinweise</span>
                        </div>
                      </header>
                      <div className="settings-row">
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Warnung ab</IonLabel>
                          <IonInput
                            type="number"
                            value={warningDaysDraft}
                            onIonInput={(event) => setWarningDaysDraft(String(event.detail.value ?? ""))}
                            onIonBlur={() => void handlePersistSettings()}
                          />
                        </IonItem>
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Erneut erinnern</IonLabel>
                          <IonInput
                            type="number"
                            value={reminderDaysDraft}
                            onIonInput={(event) => setReminderDaysDraft(String(event.detail.value ?? ""))}
                            onIonBlur={() => void handlePersistSettings()}
                          />
                        </IonItem>
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Sync</h2>
                          <span>{syncStatus.message}</span>
                        </div>
                        <IonBadge color="light">
                          {syncStatus.state === "syncing"
                            ? "läuft"
                            : syncStatus.state === "success"
                              ? "ok"
                              : syncStatus.state === "error"
                                ? "Fehler"
                                : "lokal"}
                        </IonBadge>
                      </header>
                      <div className="settings-row">
                        <label className="form-field">
                          <span>CouchDB-URL</span>
                          <input
                            className="app-input"
                            value={syncUrlDraft}
                            placeholder="https://couch.example.com"
                            onChange={(event) => setSyncUrlDraft(event.target.value)}
                          />
                        </label>
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Datenbank</IonLabel>
                          <IonInput
                            value={syncDatabaseDraft}
                            onIonInput={(event) => setSyncDatabaseDraft(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Benutzer</IonLabel>
                          <IonInput
                            value={syncUsernameDraft}
                            onIonInput={(event) => setSyncUsernameDraft(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Passwort</IonLabel>
                          <IonInput
                            type="password"
                            value={syncPasswordDraft}
                            onIonInput={(event) => setSyncPasswordDraft(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Gerätename</IonLabel>
                          <IonInput
                            value={syncDeviceLabelDraft}
                            onIonInput={(event) => setSyncDeviceLabelDraft(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <label className="form-field">
                          <span>Sync aktiv</span>
                          <select
                            className="app-select"
                            value={syncEnabledDraft ? "ja" : "nein"}
                            onChange={(event) => setSyncEnabledDraft(event.target.value === "ja")}
                          >
                            <option value="ja">Ja</option>
                            <option value="nein">Nein</option>
                          </select>
                        </label>
                      </div>
                      <div className="help-box">
                        <strong>Was hier hineingehört</strong>
                        <span>
                          Ohne CouchDB bleibt jedes Handy lokal. Die URL ist die Adresse deines CouchDB-Servers, die Datenbank
                          ist meistens `lagerkontrolle`, Benutzer und Passwort kommen aus CouchDB, der Gerätename ist frei wählbar.
                        </span>
                      </div>
                      <div className="form-actions">
                        <IonButton fill="outline" className="primary-button" onClick={() => void handleSaveSyncConfig()}>
                          Sync speichern
                        </IonButton>
                        <IonButton className="primary-button" onClick={() => void handleRunSync()}>
                          Jetzt synchronisieren
                        </IonButton>
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Lokale Daten</h2>
                          <span>Dieses Gerät zurücksetzen</span>
                        </div>
                      </header>
                      <div className="help-box">
                        <span>
                          Löscht nur die Daten auf diesem Handy oder Browser. Standard-Einheiten und Slot-Typen bleiben erhalten.
                        </span>
                      </div>
                      <div className="form-actions">
                        <IonButton fill="outline" className="primary-button" onClick={handleExportBackup}>
                          <IonIcon slot="start" icon={downloadOutline} />
                          Backup exportieren
                        </IonButton>
                        <IonButton fill="outline" className="primary-button" onClick={() => backupInputRef.current?.click()}>
                          Backup importieren
                        </IonButton>
                        <IonButton fill="outline" className="primary-button" onClick={handleExportStockCsv}>
                          <IonIcon slot="start" icon={downloadOutline} />
                          Bestand CSV
                        </IonButton>
                        <IonButton fill="outline" className="danger-button" onClick={() => setPendingReset(true)}>
                          <IonIcon slot="start" icon={trashOutline} />
                          Lokale Daten löschen
                        </IonButton>
                        <input
                          ref={backupInputRef}
                          type="file"
                          accept="application/json,.json"
                          className="visually-hidden"
                          onChange={(event) => void handleRestoreBackup(event.target.files?.[0])}
                        />
                      </div>
                    </section>
                  </div>
                ) : null}

                {activeView === "locations" ? (
                  <div className="stack">
                    {locationDetailId === null ? (
                      <section className="surface">
                        <header className="section-header">
                          <div>
                            <h1>Orte</h1>
                            <span>{viewModel.locations.length} aktiv</span>
                          </div>
                          <IonButton fill="outline" className="primary-button" onClick={() => setLocationDetailId("")}>
                            Neu
                          </IonButton>
                        </header>
                        <IonItem className="compact-field compact-field--filter">
                          <IonLabel position="stacked">Filtern</IonLabel>
                          <IonInput
                            value={locationFilterDraft}
                            placeholder="Ort suchen"
                            onIonInput={(event) => setLocationFilterDraft(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <div className="list">
                          {filteredLocations.map((location) => (
                            <article
                              key={location.id}
                              className="list-row list-row--clickable"
                              onClick={() => handleOpenLocationDetail(location.id)}
                            >
                              <div className="list-row__main">
                                <strong>{location.name}</strong>
                                <span>
                                  {location.slotCount} Slots · {location.itemCount} Artikel
                                </span>
                              </div>
                              <div className="list-row__meta">
                                <button
                                  type="button"
                                  className="icon-toggle"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleToggleFavoriteLocation(location.id);
                                  }}
                                >
                                  <IonIcon icon={favoriteLocationSet.has(location.id) ? star : starOutline} />
                                </button>
                                <small>{location.lastMovementLabel}</small>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : (
                      <>
                        <section className="surface">
                          <header className="section-header">
                            <IonButton fill="clear" className="back-button" onClick={() => setLocationDetailId(null)}>
                              Zurück
                            </IonButton>
                            <div>
                              <h2>{detailLocation ? "Ort bearbeiten" : "Ort anlegen"}</h2>
                              <span>{detailLocation?.name ?? "Neuer Ort"}</span>
                            </div>
                          </header>
                          <div className="unit-form">
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Name</IonLabel>
                              <IonInput
                                value={locationEditName}
                                onIonInput={(event) => setLocationEditName(String(event.detail.value ?? ""))}
                              />
                            </IonItem>
                            <IonButton className="primary-button" onClick={handleSaveLocation}>
                              {detailLocation ? "Ort aktualisieren" : "Ort speichern"}
                            </IonButton>
                            {detailLocation ? (
                              <IonButton className="danger-button" fill="outline" onClick={handleDeleteLocation}>
                                Ort löschen
                              </IonButton>
                            ) : null}
                          </div>
                          {detailLocation ? (
                            <div className="form-actions">
                              <IonButton className="primary-button" onClick={() => handleLocationScan(detailLocation.id)}>
                                <IonIcon slot="start" icon={barcodeOutline} />
                                Einmal scannen
                              </IonButton>
                              <IonButton fill="outline" className="primary-button" onClick={() => handleLocationScan(detailLocation.id, true)}>
                                <IonIcon slot="start" icon={refreshOutline} />
                                Sammelscan starten
                              </IonButton>
                            </div>
                          ) : null}
                        </section>

                        {detailLocation ? (
                          <>
                            {bookingPinnedLocationId === detailLocation.id && locationScanMode ? (
                              <section className="surface surface--scan-context">
                                <header className="section-header">
                                  <div>
                                    <h2>{locationScanMode === "multi" ? "Sammelscan" : "Scan für diesen Ort"}</h2>
                                    <span>
                                      Bucht auf {detailLocation.name}
                                      {locationScanMode === "multi" ? " · Ort bleibt für alle folgenden Scans gesetzt" : ""}
                                    </span>
                                  </div>
                                  <IonBadge color="light">{detailLocation.name}</IonBadge>
                                </header>
                                <div className="help-box help-box--compact">
                                  <strong>{locationScanMode === "multi" ? "Mehrere nacheinander" : "Einmaliger Scan"}</strong>
                                  <span>
                                    {locationScanMode === "multi"
                                      ? "Nach dem Speichern öffnet sich der Scanner wieder und bleibt bei diesem Ort."
                                      : "Nach dem Speichern ist der Scan-Workflow beendet."}
                                  </span>
                                </div>
                                <div className="booking-form-stack">
                                  <div className="toggle-pills booking-toggle-row">
                                    <button
                                      type="button"
                                      className={bookingItemMode === "existing" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                      onClick={() => setBookingItemMode("existing")}
                                    >
                                      Bestehender Artikel
                                    </button>
                                    <button
                                      type="button"
                                      className={bookingItemMode === "new" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                      onClick={() => {
                                        setBookingAction("in");
                                        setBookingItemMode("new");
                                        setBookingBatchMode("new");
                                        setBookingBatchId("");
                                      }}
                                    >
                                      Neuer Artikel
                                    </button>
                                  </div>

                                  {bookingUsesNewItem ? (
                                    <div className="editor-grid booking-inline-grid">
                                      <IonItem className="compact-field">
                                        <IonLabel position="stacked">Artikelname</IonLabel>
                                        <IonInput
                                          value={bookingNewItemNameDraft}
                                          placeholder="z. B. Artikelname"
                                          onIonInput={(event) => setBookingNewItemNameDraft(String(event.detail.value ?? ""))}
                                        />
                                      </IonItem>
                                      <label className="form-field">
                                        <span>Einheit</span>
                                        <select
                                          className="app-select"
                                          value={bookingNewItemUnitTypeId}
                                          onChange={(event) => setBookingNewItemUnitTypeId(event.target.value)}
                                        >
                                          {viewModel.unitTypes.map((unitType) => (
                                            <option key={unitType.id} value={unitType.id}>
                                              {unitType.name} ({unitType.shortCode})
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                      <IonItem className="compact-field">
                                        <IonLabel position="stacked">Barcode</IonLabel>
                                        <IonInput
                                          value={bookingNewItemBarcodeDraft}
                                          onIonInput={(event) => setBookingNewItemBarcodeDraft(String(event.detail.value ?? ""))}
                                        />
                                      </IonItem>
                                      {bookingNewItemBarcodeDraft.trim() ? (
                                        <div className="barcode-confirmation">
                                          Übernommener Barcode: <strong>{bookingNewItemBarcodeDraft.trim()}</strong>
                                        </div>
                                      ) : null}
                                      <IonItem className="compact-field">
                                        <IonLabel position="stacked">Niedriger Bestand ab</IonLabel>
                                        <IonInput
                                          type="number"
                                          value={bookingNewItemLowStockThresholdDraft}
                                          onIonInput={(event) => setBookingNewItemLowStockThresholdDraft(String(event.detail.value ?? ""))}
                                        />
                                      </IonItem>
                                      <div className="toggle-pills booking-toggle-row">
                                        <button
                                          type="button"
                                          className={bookingNewItemTrackExpiry ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                          onClick={() => setBookingNewItemTrackExpiry(true)}
                                        >
                                          Ablauf aktiv
                                        </button>
                                        <button
                                          type="button"
                                          className={!bookingNewItemTrackExpiry ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                          onClick={() => setBookingNewItemTrackExpiry(false)}
                                        >
                                          Ohne Ablauf
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <label className="form-field">
                                        <span>Artikel</span>
                                        <select
                                          className="app-select"
                                          value={bookingItemId}
                                          onChange={(event) => setBookingItemId(event.target.value)}
                                        >
                                          {bookingItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                              {item.name}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                      <div className="booking-preview__row">
                                        <span>Artikel</span>
                                        <b>{bookingDisplayItemName}</b>
                                      </div>
                                      {bookingItem?.barcode && bookingItem.barcode !== "kein Code" ? (
                                        <div className="barcode-confirmation">
                                          Gescannter Barcode: <strong>{bookingItem.barcode}</strong>
                                        </div>
                                      ) : null}
                                    </>
                                  )}

                                  {bookingTargetSlots.length > 0 ? (
                                    <label className="form-field">
                                      <span>Slot optional in {detailLocation.name}</span>
                                      <select
                                        className="app-select"
                                        value={bookingTargetSlotId}
                                        onChange={(event) => setBookingTargetSlotId(event.target.value)}
                                      >
                                        <option value="">Ohne Slot direkt auf Ort</option>
                                        {bookingTargetSlots.map((slot) => (
                                          <option key={slot.id} value={slot.id}>
                                            {slot.label}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  ) : (
                                    <div className="empty-state empty-state--action">
                                      <span>In diesem Ort ist kein Slot angelegt. Es wird direkt auf den Ort gebucht.</span>
                                      <IonButton size="small" className="primary-button" onClick={() => void handleCreateBookingSlot()}>
                                        Optional Slot anlegen
                                      </IonButton>
                                    </div>
                                  )}

                                  {canCreateNewBookingBatch && !bookingUsesNewItem ? (
                                    <label className="form-field">
                                      <span>Charge</span>
                                      <div className="toggle-pills">
                                        <button
                                          type="button"
                                          className={bookingBatchMode === "existing" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                          onClick={() => setBookingBatchMode("existing")}
                                        >
                                          Bestehend
                                        </button>
                                        <button
                                          type="button"
                                          className={bookingBatchMode === "new" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                          onClick={() => setBookingBatchMode("new")}
                                        >
                                          Neu
                                        </button>
                                      </div>
                                    </label>
                                  ) : null}

                                  <div className="unit-form booking-batch-fields">
                                    {bookingBatchMode === "existing" && !bookingUsesNewItem ? (
                                      bookingAllItemBatches.length > 0 ? (
                                        <label className="form-field">
                                          <span>Bestehende Charge</span>
                                          <select
                                            className="app-select"
                                            value={bookingBatchId}
                                            onChange={(event) => setBookingBatchId(event.target.value)}
                                          >
                                            {bookingAllItemBatches.map((batch) => (
                                              <option key={batch.id} value={batch.id}>
                                                {batch.batchCode}
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                      ) : (
                                        <div className="empty-state">Keine bestehende Charge verfügbar.</div>
                                      )
                                    ) : (
                                      <>
                                        <label className="form-field batch-code-choice">
                                          <span>Chargencode</span>
                                          <div className="toggle-pills toggle-pills--full">
                                            <button
                                              type="button"
                                              className={!bookingBatchHasNoCode ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                              onClick={() => setBookingBatchHasNoCode(false)}
                                            >
                                              Code vorhanden
                                            </button>
                                            <button
                                              type="button"
                                              className={bookingBatchHasNoCode ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                              onClick={() => {
                                                setBookingBatchHasNoCode(true);
                                                setBookingNewBatchCodeDraft("");
                                              }}
                                            >
                                              Keine Charge
                                            </button>
                                          </div>
                                        </label>
                                        {bookingBatchHasNoCode ? (
                                          <div className="empty-state empty-state--compact">Die Buchung wird unter „Keine Charge“ gespeichert.</div>
                                        ) : (
                                          <IonItem className="compact-field">
                                            <IonLabel position="stacked">Chargencode</IonLabel>
                                            <IonInput
                                              value={bookingNewBatchCodeDraft}
                                              placeholder="z. B. CH-2026-01"
                                              onIonInput={(event) => setBookingNewBatchCodeDraft(String(event.detail.value ?? ""))}
                                            />
                                          </IonItem>
                                        )}
                                        <label className="form-field">
                                          <span>{bookingTrackExpiry ? "Ablaufdatum" : "Datum optional"}</span>
                                          <input
                                            className="app-input"
                                            type="date"
                                            value={bookingNewBatchExpiryDraft}
                                            onChange={(event) => setBookingNewBatchExpiryDraft(event.target.value)}
                                          />
                                        </label>
                                      </>
                                    )}
                                    <IonItem className="compact-field">
                                      <IonLabel position="stacked">Menge</IonLabel>
                                      <IonInput
                                        type="number"
                                        value={bookingQuantityDraft}
                                        onIonInput={(event) => setBookingQuantityDraft(String(event.detail.value ?? ""))}
                                      />
                                    </IonItem>
                                  </div>
                                </div>
                                <div className="form-actions">
                                  <IonButton fill="outline" className="primary-button" onClick={() => openScan("booking-item")}>
                                    <IonIcon slot="start" icon={barcodeOutline} />
                                    Erneut scannen
                                  </IonButton>
                                  <IonButton className="primary-button" onClick={handleSaveBooking}>
                                    Buchung für {detailLocation.name} speichern
                                  </IonButton>
                                  <IonButton fill="clear" className="back-button" onClick={closeLocationScanFlow}>
                                    Scan beenden
                                  </IonButton>
                                </div>
                              </section>
                            ) : null}

                            <section className="surface">
                              <header className="section-header">
                                <div>
                                  <h2>Slot anlegen</h2>
                                  <span>{detailLocation.name}</span>
                                </div>
                              </header>
                              <div className="unit-form">
                                <label className="form-field">
                                  <span>Typ</span>
                                  <select className="app-select" value={slotKind} onChange={(event) => setSlotKind(event.target.value)}>
                                    {(snapshotState?.settings.slotTypeNames ?? []).map((slotTypeName) => (
                                      <option key={slotTypeName} value={slotTypeName}>
                                        {slotTypeName}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <IonItem className="compact-field">
                                  <IonLabel position="stacked">Nummer</IonLabel>
                                  <IonInput
                                    type="number"
                                    value={slotNumber}
                                    onIonInput={(event) => setSlotNumber(String(event.detail.value ?? ""))}
                                  />
                                </IonItem>
                                <IonButton className="primary-button" onClick={handleSaveSlot}>
                                  {slotKind} speichern
                                </IonButton>
                              </div>
                            </section>

                            <section className="surface">
                              <header className="section-header">
                                <div>
                                  <h2>Slot-Typen</h2>
                                  <span>Anlegen, umbenennen, löschen</span>
                                </div>
                              </header>
                              <div className="unit-form">
                                <IonItem className="compact-field">
                                  <IonLabel position="stacked">Neuer Typ</IonLabel>
                                  <IonInput value={slotTypeDraft} onIonInput={(event) => setSlotTypeDraft(String(event.detail.value ?? ""))} />
                                </IonItem>
                                <IonButton className="primary-button" onClick={handleSaveSlotType}>
                                  Typ speichern
                                </IonButton>
                              </div>
                              <div className="list list--slot-types">
                                {(snapshotState?.settings.slotTypeNames ?? []).map((slotTypeName) => (
                                  <article key={slotTypeName} className="list-row list-row--mobile-card">
                                    <div className="list-row__main">
                                      {slotTypeEditSource === slotTypeName ? (
                                        <IonInput
                                          value={slotTypeEditDraft}
                                          onIonInput={(event) => setSlotTypeEditDraft(String(event.detail.value ?? ""))}
                                        />
                                      ) : (
                                        <strong>{slotTypeName}</strong>
                                      )}
                                    </div>
                                    <div className="list-row__meta list-row__meta--actions">
                                      {slotTypeEditSource === slotTypeName ? (
                                        <IonButton size="small" fill="clear" onClick={handleRenameSlotType}>
                                          Speichern
                                        </IonButton>
                                      ) : (
                                        <IonButton
                                          size="small"
                                          fill="clear"
                                          onClick={() => {
                                            setSlotTypeEditSource(slotTypeName);
                                            setSlotTypeEditDraft(slotTypeName);
                                          }}
                                        >
                                          Umbenennen
                                        </IonButton>
                                      )}
                                      <IonButton size="small" fill="clear" className="danger-button" onClick={() => void handleDeleteSlotType(slotTypeName)}>
                                        Löschen
                                      </IonButton>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </section>

                            <section className="surface">
                              <header className="section-header">
                                <div>
                                  <h2>Slots</h2>
                                  <span>{currentSlots.length} angelegt</span>
                                </div>
                              </header>
                              <div className="list list--slots">
                                {currentSlots.map((slot) => (
                                  <article key={slot.id} className="list-row list-row--mobile-card">
                                    <div className="list-row__main">
                                      <strong>{slot.label}</strong>
                                      <span>{slot.kind}</span>
                                    </div>
                                    <div className="list-row__meta">
                                      <IonButton
                                        size="small"
                                        fill="clear"
                                        className="danger-button"
                                        onClick={() => void handleDeleteSlot(slot.id)}
                                      >
                                        Löschen
                                      </IonButton>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </section>

                            <section className="surface">
                              <header className="section-header">
                                <div>
                                  <h2>{detailLocation.name}</h2>
                                  <span>
                                    {detailLocation.itemCount} Artikel · {detailLocation.lastMovementLabel}
                                  </span>
                                </div>
                              </header>
                              <div className="stock-grid">
                                {visibleStocks.map((line) => (
                                  <article key={line.id} className="stock-card">
                                    <div className="stock-card__top">
                                      <span>{line.slotName}</span>
                                      <small className={`status-text ${toneClass(line.status === "ok" ? "good" : line.status)}`}>
                                        {line.status === "critical"
                                          ? "kritisch"
                                          : line.status === "warning"
                                            ? "bald"
                                            : "ok"}
                                      </small>
                                    </div>
                                    <strong>{line.itemName}</strong>
                                    <div className="stock-card__meta">
                                      <b>
                                        {line.quantity} {line.unitShortCode}
                                      </b>
                                      <span>Verfall {line.expiryDate}</span>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </section>
                          </>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}

                {activeView === "items" ? (
                  <div className="stack">
                    {itemDetailId === null ? (
                      <section className="surface">
                        <header className="section-header">
                          <div>
                            <h1>Artikel</h1>
                            <span>{itemSummaries.length} angelegt</span>
                          </div>
                          <div className="header-actions">
                            <IonButton fill="outline" className="primary-button" onClick={() => openScan("item-search")}>
                              <IonIcon slot="start" icon={searchOutline} />
                              Scannen
                            </IonButton>
                            <IonButton fill="outline" className="primary-button" onClick={handleNewItem}>
                              Neu
                            </IonButton>
                          </div>
                        </header>
                        <IonItem className="compact-field compact-field--filter">
                          <IonLabel position="stacked">Filtern</IonLabel>
                          <IonInput
                            value={itemFilterDraft}
                            placeholder="Name oder Barcode"
                            onIonInput={(event) => setItemFilterDraft(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <div className="filter-pills filter-pills--grid-mobile">
                          {[
                            ["all", "Alle"],
                            ["no-barcode", "Ohne Barcode"],
                            ["low", "Niedrig"],
                            ["expiry", "Ablauf"]
                          ].map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              className={itemQuickFilter === key ? "pill pill--active" : "pill"}
                              onClick={() => setItemQuickFilter(key as typeof itemQuickFilter)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="list list--items">
                          {filteredItems.map((item) => (
                            <article
                              key={item.id}
                              className="list-row list-row--clickable list-row--mobile-card"
                              onClick={() => handleOpenItemDetail(item.id)}
                            >
                              <div className="list-row__main">
                                <strong>{item.name}</strong>
                                <span>{item.preferredLocationName}</span>
                              </div>
                              <div className="list-row__meta">
                                <button
                                  type="button"
                                  className="icon-toggle"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleToggleFavoriteItem(item.id);
                                  }}
                                >
                                  <IonIcon icon={favoriteItemSet.has(item.id) ? star : starOutline} />
                                </button>
                                <b>
                                  {item.batchCount} Chargen · {item.totalQuantity} {item.unitLabel}
                                </b>
                                <small>Ablauf: {item.nextExpiry}</small>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : (
                      <>
                        <section className="surface">
                          <header className="section-header">
                            <IonButton fill="clear" className="back-button" onClick={() => setItemDetailId(null)}>
                              Zurück
                            </IonButton>
                            <div>
                              <h2>{currentItem ? "Artikel bearbeiten" : "Artikel anlegen"}</h2>
                              <span>{currentItem ? currentItem.name : "Neuer Stammdatensatz"}</span>
                            </div>
                          </header>
                          <div className="editor-grid">
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Name</IonLabel>
                              <IonInput
                                value={itemNameDraft}
                                placeholder="z. B. Schwarztee 25er"
                                onIonInput={(event) => setItemNameDraft(String(event.detail.value ?? ""))}
                              />
                            </IonItem>
                            <label className="form-field">
                              <span>Einheit</span>
                              <select
                                className="app-select"
                                value={itemUnitTypeId}
                                onChange={(event) => setItemUnitTypeId(event.target.value)}
                              >
                                {viewModel.unitTypes.map((unitType) => (
                                  <option key={unitType.id} value={unitType.id}>
                                    {unitType.name} ({unitType.shortCode})
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="form-field">
                              <span>Ort</span>
                              <select
                                className="app-select"
                                value={itemPreferredLocationId}
                                onChange={(event) => setItemPreferredLocationId(event.target.value)}
                              >
                                {(snapshotState?.locations ?? []).map((location) => (
                                  <option key={location.id} value={location.id}>
                                    {location.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Niedriger Bestand ab</IonLabel>
                              <IonInput
                                type="number"
                                value={itemLowStockThresholdDraft}
                                onIonInput={(event) => setItemLowStockThresholdDraft(String(event.detail.value ?? ""))}
                              />
                            </IonItem>
                            <label className="form-field">
                              <span>Barcodes</span>
                              <textarea
                                className="app-input app-textarea"
                                value={itemBarcodeDraft}
                                placeholder="ein Code pro Zeile"
                                rows={3}
                                onChange={(event) => setItemBarcodeDraft(event.target.value)}
                              />
                            </label>
                          </div>
                          <div className="form-actions">
                            <IonButton
                              fill="outline"
                              className="primary-button"
                              onClick={() => openScan("item-barcode")}
                            >
                              Barcode scannen
                            </IonButton>
                          </div>
                          <div className="toggle-pills">
                            <button
                              type="button"
                              className={itemTrackExpiryDraft ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                              onClick={() => setItemTrackExpiryDraft(true)}
                            >
                              Ablauf aktiv
                            </button>
                            <button
                              type="button"
                              className={!itemTrackExpiryDraft ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                              onClick={() => setItemTrackExpiryDraft(false)}
                            >
                              Ohne Ablauf
                            </button>
                          </div>
                          <div className="form-actions">
                            <IonButton className="primary-button" onClick={handleSaveItem}>
                              {currentItem ? "Artikel aktualisieren" : "Artikel speichern"}
                            </IonButton>
                            {currentItem ? (
                              <>
                                <IonButton
                                  fill="outline"
                                  className="primary-button"
                                  onClick={() => {
                                    setBookingAction("adjustment");
                                    setBookingAdjustmentDirection("increase");
                                    setBookingItemMode("existing");
                                    setBookingItemId(currentItem.id);
                                    setBookingLocationId(currentItem.preferredLocationId ?? snapshotState?.locations[0]?.id ?? "");
                                    setBookingPinnedLocationId(null);
                                    setBatchScanMode(false);
                                    setActiveView("booking");
                                  }}
                                >
                                  Bestand korrigieren
                                </IonButton>
                                <IonButton fill="outline" className="danger-button" onClick={() => setPendingDeleteItemId(currentItem.id)}>
                                  <IonIcon slot="start" icon={trashOutline} />
                                  Artikel löschen
                                </IonButton>
                              </>
                            ) : null}
                          </div>
                        </section>

                        <section className="surface">
                          <header className="section-header">
                            <div>
                              <h2>Chargen</h2>
                              <span>{currentItem ? currentItem.name : "Nach dem Speichern verfügbar"}</span>
                            </div>
                          </header>
                          {currentItem ? (
                            <>
                              <div className="unit-form">
                                <label className="form-field batch-code-choice">
                                  <span>Chargencode</span>
                                  <div className="toggle-pills toggle-pills--full">
                                    <button
                                      type="button"
                                      className={!batchHasNoCode ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                      onClick={() => setBatchHasNoCode(false)}
                                    >
                                      Code vorhanden
                                    </button>
                                    <button
                                      type="button"
                                      className={batchHasNoCode ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                      onClick={() => {
                                        setBatchHasNoCode(true);
                                        setBatchCodeDraft("");
                                      }}
                                    >
                                      Keine Charge
                                    </button>
                                  </div>
                                </label>
                                {batchHasNoCode ? (
                                  <div className="empty-state empty-state--compact">Die Charge wird als „Keine Charge“ gespeichert.</div>
                                ) : (
                                  <IonItem className="compact-field">
                                    <IonLabel position="stacked">Chargencode</IonLabel>
                                    <IonInput
                                      value={batchCodeDraft}
                                      placeholder="z. B. ST-2026-04"
                                      onIonInput={(event) => setBatchCodeDraft(String(event.detail.value ?? ""))}
                                    />
                                  </IonItem>
                                )}
                                <label className="form-field">
                                  <span>{currentItem.trackExpiry ? "Ablaufdatum" : "Datum optional"}</span>
                                  <input
                                    className="app-input"
                                    type="date"
                                    value={batchExpiryDateDraft}
                                    onChange={(event) => setBatchExpiryDateDraft(event.target.value)}
                                  />
                                </label>
                                <IonButton className="primary-button" onClick={handleSaveBatch}>
                                  Charge speichern
                                </IonButton>
                              </div>
                              <div className="list">
                                {currentItemBatches.map((batch) => (
                                  <article key={batch.id} className="list-row">
                                    <div className="list-row__main">
                                      <strong>{batch.batchCode}</strong>
                                      <span>{batch.expiryLabel}</span>
                                    </div>
                                    <div className="list-row__meta">
                                      <b>
                                        {batch.quantity} {batch.unitShortCode}
                                      </b>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="empty-state">Artikel zuerst speichern, danach Chargen pflegen.</div>
                          )}
                        </section>
                      </>
                    )}
                  </div>
                ) : null}

                {activeView === "booking" ? (
                  <div className="stack">
                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h1>Schnellbuchung</h1>
                          <span>{batchScanMode ? "Sammelscan aktiv: nach dem Speichern folgt der nächste Scan" : "wenige Taps für Zugang, Abgang und Umbuchung"}</span>
                        </div>
                        <IonButton fill="solid" className="primary-button" onClick={() => openScan("booking-item")}>
                          <IonIcon slot="start" icon={barcodeOutline} />
                          Scannen
                        </IonButton>
                      </header>
                      <div className="action-grid">
                        <button
                          type="button"
                          className={bookingAction === "in" ? "action-card action-card--active" : "action-card"}
                          onClick={() => setBookingAction("in")}
                        >
                          <strong>Zugang</strong>
                          <span>Ware einbuchen</span>
                        </button>
                        <button
                          type="button"
                          className={bookingAction === "out" ? "action-card action-card--active" : "action-card"}
                          onClick={() => setBookingAction("out")}
                        >
                          <strong>Abgang</strong>
                          <span>Verbrauch buchen</span>
                        </button>
                        <button
                          type="button"
                          className={bookingAction === "transfer" ? "action-card action-card--active" : "action-card"}
                          onClick={() => setBookingAction("transfer")}
                        >
                          <strong>Umbuchung</strong>
                          <span>Regal oder Lade wechseln</span>
                        </button>
                        <button
                          type="button"
                          className={bookingAction === "adjustment" ? "action-card action-card--active" : "action-card"}
                          onClick={() => setBookingAction("adjustment")}
                        >
                          <strong>Korrektur</strong>
                          <span>Bestand anpassen</span>
                        </button>
                      </div>
                    </section>

                    <section className="surface booking-form-anchor">
                      <header className="section-header">
                        <div>
                          <h2>Buchungsdaten</h2>
                          <span>{bookingDisplayItemName}</span>
                        </div>
                      </header>
                      <div className="booking-form-stack">
                        {bookingAction === "in" ? (
                          <div className="toggle-pills booking-toggle-row">
                            <button
                              type="button"
                              className={bookingItemMode === "existing" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                              onClick={() => setBookingItemMode("existing")}
                            >
                              Bestehender Artikel
                            </button>
                            <button
                              type="button"
                              className={bookingItemMode === "new" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                              onClick={() => setBookingItemMode("new")}
                            >
                              Neuer Artikel
                            </button>
                          </div>
                        ) : null}

                        {bookingUsesNewItem ? (
                          <div className="editor-grid booking-inline-grid">
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Artikelname</IonLabel>
                              <IonInput
                                value={bookingNewItemNameDraft}
                                placeholder="z. B. Früchtetee 20er"
                                onIonInput={(event) => setBookingNewItemNameDraft(String(event.detail.value ?? ""))}
                              />
                            </IonItem>
                            <label className="form-field">
                              <span>Einheit</span>
                              <select
                                className="app-select"
                                value={bookingNewItemUnitTypeId}
                                onChange={(event) => setBookingNewItemUnitTypeId(event.target.value)}
                              >
                                {viewModel.unitTypes.map((unitType) => (
                                  <option key={unitType.id} value={unitType.id}>
                                    {unitType.name} ({unitType.shortCode})
                                  </option>
                                ))}
                              </select>
                            </label>
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Barcode</IonLabel>
                              <IonInput
                                value={bookingNewItemBarcodeDraft}
                                placeholder="optional"
                                onIonInput={(event) => setBookingNewItemBarcodeDraft(String(event.detail.value ?? ""))}
                              />
                            </IonItem>
                            <div className="form-actions booking-inline-actions">
                              <IonButton
                                fill="outline"
                                className="primary-button"
                                onClick={() => openScan("booking-new-item-barcode")}
                              >
                                Barcode scannen
                              </IonButton>
                            </div>
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Niedriger Bestand ab</IonLabel>
                              <IonInput
                                type="number"
                                value={bookingNewItemLowStockThresholdDraft}
                                onIonInput={(event) => setBookingNewItemLowStockThresholdDraft(String(event.detail.value ?? ""))}
                              />
                            </IonItem>
                            <div className="toggle-pills booking-toggle-row">
                              <button
                                type="button"
                                className={bookingNewItemTrackExpiry ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                onClick={() => setBookingNewItemTrackExpiry(true)}
                              >
                                Ablauf aktiv
                              </button>
                              <button
                                type="button"
                                className={!bookingNewItemTrackExpiry ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                onClick={() => setBookingNewItemTrackExpiry(false)}
                              >
                                Ohne Ablauf
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <label className="form-field">
                              <span>Artikel</span>
                              <select
                                className="app-select"
                                value={bookingItemId}
                                onChange={(event) => setBookingItemId(event.target.value)}
                              >
                                {bookingItems.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            {bookingItem ? (
                              <div className="stock-feedback">
                                <strong>
                                  Bestand: {bookingSelectedItemQuantity} {bookingItem.unitLabel}
                                </strong>
                                <span>
                                  Am gewählten Ort: {bookingSelectedLocationQuantity} {bookingItem.unitLabel}
                                </span>
                              </div>
                            ) : null}
                          </>
                        )}
                        <label className="form-field">
                          <span>Ort</span>
                          <select
                            className="app-select"
                            value={bookingLocationId}
                            onChange={(event) => handleBookingLocationChange(event.target.value)}
                          >
                            {(viewModel.locations ?? []).map((location) => (
                              <option key={location.id} value={location.id}>
                                {location.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        {bookingPinnedLocationId ? (
                          <div className="help-box help-box--compact">
                            <span>
                              Ort wurde aus dem Ort-Scan vorausgewählt. Beim Wechsel fragt die App zur Sicherheit nach.
                            </span>
                          </div>
                        ) : null}

                        {bookingAction === "adjustment" ? (
                          <div className="toggle-pills">
                            <button
                              type="button"
                              className={bookingAdjustmentDirection === "increase" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                              onClick={() => setBookingAdjustmentDirection("increase")}
                            >
                              Pluskorrektur
                            </button>
                            <button
                              type="button"
                              className={bookingAdjustmentDirection === "decrease" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                              onClick={() => setBookingAdjustmentDirection("decrease")}
                            >
                              Minuskorrektur
                            </button>
                          </div>
                        ) : null}

                        {(bookingAction === "out" || bookingAction === "transfer" || (bookingAction === "adjustment" && bookingAdjustmentDirection === "decrease")) ? (
                          bookingSourceSlotOptions.length > 0 ? (
                            <>
                              <label className="form-field">
                                <span>Quellort / Slot</span>
                                <select
                                  ref={bookingSourceSlotRef}
                                  className="app-select"
                                  value={bookingSourceSlotId}
                                  onChange={(event) => setBookingSourceSlotId(event.target.value)}
                                >
                                  {bookingSourceSlotOptions.map((slot) => (
                                    <option key={slot.id} value={slot.id}>
                                      {slot.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <div className="booking-feedback">
                                <strong>Quelle: {selectedSourceOption?.label ?? "Direkt am Ort"}</strong>
                                <span>
                                  {bookingSelectedLocationQuantity} {bookingItem?.unitLabel ?? ""} am gewählten Ort verfügbar
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="empty-state">Kein Bestand für diesen Artikel im gewählten Ort.</div>
                          )
                        ) : null}

                        {(bookingAction === "in" || (bookingAction === "adjustment" && bookingAdjustmentDirection === "increase")) ? (
                          bookingTargetSlots.length > 0 ? (
                            <label className="form-field">
                              <span>Slot optional</span>
                              <select
                                ref={bookingTargetSlotRef}
                                className="app-select"
                                value={bookingTargetSlotId}
                                onChange={(event) => setBookingTargetSlotId(event.target.value)}
                              >
                                <option value="">Ohne Slot direkt auf Ort</option>
                                {bookingTargetSlots.map((slot) => (
                                  <option key={slot.id} value={slot.id}>
                                    {slot.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <div className="empty-state empty-state--action">
                              <span>Keine Slots angelegt. Die Buchung läuft direkt auf den Ort.</span>
                              <IonButton size="small" className="primary-button" onClick={() => void handleCreateBookingSlot()}>
                                Optional Slot anlegen
                              </IonButton>
                            </div>
                          )
                        ) : null}

                        {bookingAction === "transfer" ? (
                          <>
                            <label className="form-field">
                              <span>Zielort</span>
                              <select
                                className="app-select"
                                value={bookingTargetLocationId}
                                onChange={(event) => setBookingTargetLocationId(event.target.value)}
                              >
                                {(viewModel.locations ?? []).map((location) => (
                                  <option key={location.id} value={location.id}>
                                    {location.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            {bookingTargetSlots.length > 0 ? (
                              <label className="form-field">
                                <span>Zielslot</span>
                                <select
                                  className="app-select"
                                  value={bookingTargetSlotId}
                                  onChange={(event) => setBookingTargetSlotId(event.target.value)}
                                >
                                  <option value="">Ohne Slot direkt auf Zielort</option>
                                  {bookingTargetSlots.map((slot) => (
                                    <option key={slot.id} value={slot.id}>
                                      {slot.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : (
                              <div className="empty-state">Im Zielort sind keine Slots angelegt. Die Umbuchung kann direkt auf den Zielort laufen.</div>
                            )}
                            <div className="booking-feedback">
                              <strong>Ziel: {selectedTargetLocation?.name ?? bookingLocation?.name ?? "Ort"}</strong>
                              <span>{selectedTargetSlot?.label ?? "Direkt auf den Ort"}</span>
                            </div>
                          </>
                        ) : null}

                        {canCreateNewBookingBatch && !bookingUsesNewItem ? (
                          <label className="form-field">
                            <span>Charge</span>
                            <div className="toggle-pills">
                              <button
                                type="button"
                                className={bookingBatchMode === "existing" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                onClick={() => setBookingBatchMode("existing")}
                              >
                                Bestehend
                              </button>
                              <button
                                type="button"
                                className={bookingBatchMode === "new" ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                onClick={() => setBookingBatchMode("new")}
                              >
                                Neu
                              </button>
                            </div>
                          </label>
                        ) : null}

                        {bookingBatchMode === "existing" || mustUseExistingBookingBatch ? (
                          bookingExistingBatchOptions.length > 0 ? (
                            <>
                              <label className="form-field">
                                <span>Bestehende Charge</span>
                                <select
                                  ref={bookingBatchSelectRef}
                                  className="app-select"
                                  value={effectiveBookingBatchId}
                                  onChange={(event) => setBookingBatchId(event.target.value)}
                                >
                                  {bookingExistingBatchOptions.map((batch) => (
                                    <option key={batch.id} value={batch.id}>
                                      {batch.batchCode}{"quantity" in batch ? ` · ${batch.quantity}` : ""}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              {selectedBookingBatch ? (
                                <div className="booking-feedback">
                                  <strong>Charge gewählt: {selectedBookingBatch.batchCode}</strong>
                                  <span>
                                    {"quantity" in selectedBookingBatch
                                      ? `${selectedBookingBatch.quantity} am gewählten Ort verfügbar`
                                      : "Bestehende Charge wird verwendet"}
                                  </span>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <div className="empty-state">Keine passende bestehende Charge verfügbar.</div>
                          )
                        ) : (
                          <div className="unit-form booking-batch-fields">
                            <label className="form-field batch-code-choice">
                              <span>Chargencode</span>
                              <div className="toggle-pills toggle-pills--full">
                                <button
                                  type="button"
                                  className={!bookingBatchHasNoCode ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                  onClick={() => setBookingBatchHasNoCode(false)}
                                >
                                  Code vorhanden
                                </button>
                                <button
                                  type="button"
                                  className={bookingBatchHasNoCode ? "toggle-pill toggle-pill--active" : "toggle-pill"}
                                  onClick={() => {
                                    setBookingBatchHasNoCode(true);
                                    setBookingNewBatchCodeDraft("");
                                  }}
                                >
                                  Keine Charge
                                </button>
                              </div>
                            </label>
                            {bookingBatchHasNoCode ? (
                              <div className="empty-state empty-state--compact">Die Buchung wird unter „Keine Charge“ gespeichert.</div>
                            ) : (
                              <IonItem className="compact-field">
                                <IonLabel position="stacked">Chargencode</IonLabel>
                                <IonInput
                                  value={bookingNewBatchCodeDraft}
                                  placeholder="z. B. TEE-2026-04"
                                  onIonInput={(event) => setBookingNewBatchCodeDraft(String(event.detail.value ?? ""))}
                                  ref={(element) => {
                                    bookingBatchCodeRef.current = element?.querySelector("input") ?? null;
                                  }}
                                />
                              </IonItem>
                            )}
                            <label className="form-field">
                              <span>{bookingTrackExpiry ? "Ablaufdatum" : "Datum optional"}</span>
                              <input
                                className="app-input"
                                type="date"
                                value={bookingNewBatchExpiryDraft}
                                onChange={(event) => setBookingNewBatchExpiryDraft(event.target.value)}
                              />
                            </label>
                          </div>
                        )}

                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Menge</IonLabel>
                          <IonInput
                            type="number"
                            value={bookingQuantityDraft}
                            onIonInput={(event) => setBookingQuantityDraft(String(event.detail.value ?? ""))}
                            ref={bookingQuantityInputRef}
                          />
                        </IonItem>
                      </div>

                      <div className="booking-preview">
                        <div className="booking-preview__row">
                          <span>Aktion</span>
                          <b>
                            {bookingAction === "in"
                              ? "Zugang"
                              : bookingAction === "out"
                                ? "Abgang"
                                : bookingAction === "transfer"
                                  ? "Umbuchung"
                                  : "Korrektur"}
                          </b>
                        </div>
                        <div className="booking-preview__row">
                          <span>Artikel</span>
                          <b>{bookingDisplayItemName}</b>
                        </div>
                        <div className="booking-preview__row">
                          <span>Ort</span>
                          <b>{bookingLocation?.name ?? "bitte wählen"}</b>
                        </div>
                        {bookingAction === "transfer" ? (
                          <div className="booking-preview__row">
                            <span>Zielort</span>
                            <b>
                              {viewModel.locations.find((location) => location.id === bookingTargetLocationId)?.name ??
                                "bitte wählen"}
                            </b>
                          </div>
                        ) : null}
                        <div className="booking-preview__row">
                          <span>Charge</span>
                          <b>
                            {bookingBatchMode === "existing" || mustUseExistingBookingBatch
                              ? selectedBookingBatch?.batchCode ?? "bitte wählen"
                              : bookingBatchHasNoCode
                                ? "Keine Charge"
                                : bookingNewBatchCodeDraft || "neu anlegen"}
                          </b>
                        </div>
                        <div className="booking-preview__row">
                          <span>Menge</span>
                          <b>{bookingQuantityDraft || "0"}</b>
                        </div>
                      </div>
                      <div className="form-actions">
                        <IonButton className="primary-button" onClick={handleSaveBooking}>
                          Buchung speichern
                        </IonButton>
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Schnellzugriffe</h2>
                          <span>Favoriten und letzte Buchungen</span>
                        </div>
                      </header>
                      <div className="shortcut-grid">
                        {recentItems.map((item) => (
                          <button
                            key={`book-recent-${item.id}`}
                            type="button"
                            className="shortcut-card"
                            onClick={() => {
                              setBookingItemId(item.id);
                              setActionSuccess(`${item.name} ist für die Buchung ausgewählt.`);
                              scrollToBookingForm();
                            }}
                          >
                            <div className="shortcut-card__top">
                              <IonIcon icon={timeOutline} />
                              <span>Artikel</span>
                            </div>
                            <strong>{item.name}</strong>
                            <small>{item.barcode}</small>
                          </button>
                        ))}
                        {favoriteItems.map((item) => (
                          <button
                            key={`book-fav-item-${item.id}`}
                            type="button"
                            className="shortcut-card"
                            onClick={() => {
                              setBookingItemId(item.id);
                              setActionSuccess(`${item.name} ist für die Buchung ausgewählt.`);
                              scrollToBookingForm();
                            }}
                          >
                            <div className="shortcut-card__top">
                              <IonIcon icon={star} />
                              <span>Artikel</span>
                            </div>
                            <strong>{item.name}</strong>
                            <small>{item.totalQuantity} {item.unitLabel}</small>
                          </button>
                        ))}
                        {favoriteLocations.map((location) => (
                          <button
                            key={`book-fav-loc-${location.id}`}
                            type="button"
                            className="shortcut-card"
                            onClick={() => {
                              setBookingLocationId(location.id);
                              setActionSuccess(`${location.name} ist als Ort ausgewählt.`);
                              scrollToBookingForm();
                            }}
                          >
                            <div className="shortcut-card__top">
                              <IonIcon icon={star} />
                              <span>Ort</span>
                            </div>
                            <strong>{location.name}</strong>
                            <small>{location.slotCount} Slots</small>
                          </button>
                        ))}
                      </div>
                      {recentScans.length > 0 ? (
                        <div className="recent-scan-row">
                          {recentScans.map((code) => (
                            <button key={code} type="button" className="pill" onClick={() => reuseBookingScan(code)}>
                              {code}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  </div>
                ) : null}

                {activeView === "units" ? (
                  <div className="stack">
                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h1>Einheiten</h1>
                          <span>{viewModel.unitTypes.length} aktiv</span>
                        </div>
                      </header>
                      <div className="unit-form">
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Name</IonLabel>
                          <IonInput value={unitName} placeholder="Kiste" onIonInput={(event) => setUnitName(String(event.detail.value ?? ""))} />
                        </IonItem>
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Kurzcode</IonLabel>
                          <IonInput
                            value={unitShortCode}
                            placeholder="Kis"
                            onIonInput={(event) => setUnitShortCode(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Beschreibung</IonLabel>
                          <IonInput
                            value={unitDescription}
                            placeholder="optional"
                            onIonInput={(event) => setUnitDescription(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <IonButton expand="block" className="primary-button" onClick={handleSaveUnit}>
                          Einheit speichern
                        </IonButton>
                      </div>
                    </section>

                    <section className="surface">
                      <div className="list">
                        {viewModel.unitTypes.map((unitType) => (
                          <article key={unitType.id} className="list-row">
                            <div className="list-row__main">
                              <strong>{unitType.name}</strong>
                              <span>{unitType.description}</span>
                            </div>
                            <div className="list-row__meta list-row__meta--actions">
                              <IonBadge color="light">{unitType.shortCode}</IonBadge>
                              <IonButton size="small" fill="clear" className="danger-button" onClick={() => void handleDeleteUnitType(unitType.id)}>
                                Löschen
                              </IonButton>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}

                {activeView === "analytics" ? (
                  <div className="stack">
                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h1>Nächste Abläufe</h1>
                        </div>
                      </header>
                      <div className="list list--mobile-cards">
                        {analyticsRiskList.map((alert) => (
                          <article key={alert.id} className="list-row list-row--mobile-card">
                            <div className="list-row__main">
                              <strong>{alert.itemName}</strong>
                              <span>
                                {alert.locationName} · {alert.slotName}
                              </span>
                            </div>
                            <div className="list-row__meta">
                              <b>{alert.daysUntilExpiry} T</b>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Bewegungen 7 Tage</h2>
                        </div>
                      </header>
                      <div className="mini-chart mini-chart--columns mini-chart--scroll-mobile">
                        {analyticsMovementSeries.map((entry) => (
                          <div key={entry.key} className="mini-chart__column">
                            <div className="mini-chart__track">
                              <div
                                className="mini-chart__bar mini-chart__bar--primary"
                                style={{ height: `${Math.max(entry.percent, entry.count > 0 ? 14 : 6)}%` }}
                              />
                            </div>
                            <strong>{entry.count}</strong>
                            <span>{entry.label}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Ablauf-Verteilung</h2>
                        </div>
                      </header>
                      <div className="mini-chart mini-chart--columns mini-chart--scroll-mobile">
                        {analyticsExpiryBuckets.map((bucket) => (
                          <div key={bucket.id} className="mini-chart__column">
                            <div className="mini-chart__track">
                              <div
                                className="mini-chart__bar mini-chart__bar--warning"
                                style={{ height: `${Math.max(bucket.percent, bucket.count > 0 ? 14 : 6)}%` }}
                              />
                            </div>
                            <strong>{bucket.count}</strong>
                            <span>{bucket.label} T</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Top-Orte und Top-Artikel</h2>
                        </div>
                      </header>
                      <div className="chart-grid chart-grid--stack-mobile">
                        <div className="bar-list">
                          {analyticsOccupancyBars.map((entry) => (
                            <div key={entry.id} className="bar-list__row">
                              <div className="bar-list__head">
                                <strong>{entry.label}</strong>
                                <span>{entry.value}%</span>
                              </div>
                              <div className="bar-list__track">
                                <div className="bar-list__fill bar-list__fill--primary" style={{ width: `${Math.max(entry.value, 6)}%` }} />
                              </div>
                              <small>{entry.detail}</small>
                            </div>
                          ))}
                        </div>
                        <div className="bar-list">
                          {analyticsTopItems.map((entry) => {
                            const max = analyticsTopItems[0]?.value ?? 1;
                            const width = Math.round((entry.value / Math.max(max, 1)) * 100);
                            return (
                              <div key={entry.id} className="bar-list__row">
                                <div className="bar-list__head">
                                  <strong>{entry.label}</strong>
                                  <span>
                                    {entry.value} {entry.unit}
                                  </span>
                                </div>
                                <div className="bar-list__track">
                                  <div className="bar-list__fill bar-list__fill--neutral" style={{ width: `${Math.max(width, 6)}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  </div>
                ) : null}

                {activeView === "log" ? (
                  <div className="stack">
                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h1>Log</h1>
                          <span>Letzte {viewModel.recentMovements.length} Bewegungen</span>
                        </div>
                      </header>
                      <div className="list list--mobile-cards">
                        {viewModel.recentMovements.length > 0 ? (
                          viewModel.recentMovements.map((movement) => (
                            <article key={movement.id} className="list-row list-row--mobile-card">
                              <div className="list-row__main">
                                <strong>{movement.itemName}</strong>
                                <span>
                                  {movement.direction === "in"
                                    ? "Zugang"
                                    : movement.direction === "out"
                                      ? "Abgang"
                                      : movement.direction === "transfer"
                                        ? "Umbuchung"
                                        : "Korrektur"}{" "}
                                  · Charge {movement.batchCode}
                                </span>
                                <span>
                                  {movement.fromLabel ? `Von ${movement.fromLabel}` : ""}
                                  {movement.fromLabel && movement.toLabel ? " · " : ""}
                                  {movement.toLabel ? `Nach ${movement.toLabel}` : ""}
                                </span>
                              </div>
                              <div className="list-row__meta">
                                <b>
                                  {movement.quantity} {movement.unitShortCode}
                                </b>
                                <small>{movement.timestampLabel}</small>
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="empty-state">Noch keine Bewegungen gespeichert.</div>
                        )}
                      </div>
                    </section>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </IonContent>

        <IonFooter translucent>
          <IonToolbar className="bottom-nav">
            <div className="bottom-nav__row">
              {viewMeta.map((view) => (
                <button
                  key={view.key}
                  type="button"
                  className={view.key === activeView ? "bottom-nav__item bottom-nav__item--active" : "bottom-nav__item"}
                  onClick={() => setActiveView(view.key)}
                >
                  <IonIcon icon={view.icon} />
                  <span>{view.label}</span>
                </button>
              ))}
            </div>
          </IonToolbar>
        </IonFooter>
        {scanMode ? (
          <div className="scan-overlay">
              <div className="scan-sheet">
                <div className="scan-sheet__header">
                <strong>
                  {scanMode === "booking-item"
                    ? "Artikel scannen"
                    : scanMode === "item-search"
                      ? "Artikel suchen"
                      : "Barcode erfassen"}
                </strong>
                <div className="scan-sheet__actions">
                  <IonButton fill="clear" className="back-button" onClick={restartScan}>
                    Neu scannen
                  </IonButton>
                  <IonButton fill="clear" className="back-button" onClick={closeScan}>
                    Schließen
                  </IonButton>
                </div>
              </div>
              <div className="scan-viewfinder">
                <video ref={videoRef} className="scan-video" playsInline muted />
              </div>
              <div className="scan-meta">
                <span>{scanMessage ?? "Kamera wird vorbereitet."}</span>
                {!scanSupported ? <small>Live-Scan ist hier nicht verfügbar. Manuelle Eingabe geht trotzdem.</small> : null}
              </div>
              <div className="scan-manual">
                <input
                  className="app-input"
                  value={scanInputDraft}
                  placeholder="Barcode manuell eingeben"
                  onChange={(event) => setScanInputDraft(event.target.value)}
                />
                <IonButton className="primary-button" onClick={() => applyScannedValue(scanInputDraft.trim())}>
                  Übernehmen
                </IonButton>
              </div>
            </div>
          </div>
        ) : null}
      </IonPage>
    </IonApp>
  );
}

export default App;
