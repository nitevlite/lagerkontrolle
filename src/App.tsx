import { useEffect, useMemo, useState } from "react";
import {
  IonAlert,
  IonApp,
  IonBadge,
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import {
  analyticsOutline,
  barcodeOutline,
  cubeOutline,
  gridOutline,
  layersOutline,
  pricetagOutline,
  refreshOutline,
  syncOutline,
  warningOutline
} from "ionicons/icons";
import { ensureSeedData, resetSeedData } from "./data/bootstrap";
import {
  addBatch,
  addItem,
  addLocation,
  addStorageSlot,
  addUnitType,
  deleteLocation,
  deleteStorageSlot,
  loadSnapshot,
  renameLocation,
  updateItem,
  updateSettings
} from "./data/repositories";
import { seedSnapshot } from "./domain/seed";
import { buildViewModel, type ViewKey } from "./domain/selectors";
import "./theme.css";

const viewMeta: Array<{ key: ViewKey; label: string; icon: string }> = [
  { key: "dashboard", label: "Dashboard", icon: gridOutline },
  { key: "locations", label: "Orte", icon: cubeOutline },
  { key: "items", label: "Artikel", icon: pricetagOutline },
  { key: "booking", label: "Buchung", icon: barcodeOutline },
  { key: "units", label: "Einheiten", icon: layersOutline },
  { key: "analytics", label: "Analyse", icon: analyticsOutline }
];

const expiryFilters = [7, 10, 30, 60] as const;
const displayDateFormatter = new Intl.DateTimeFormat("de-AT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

function toneClass(tone: "critical" | "warning" | "neutral" | "good") {
  return `tone-${tone}`;
}

function App() {
  const [activeView, setActiveView] = useState<ViewKey>("locations");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [expiryFilterDays, setExpiryFilterDays] = useState<number>(10);
  const [warningDaysDraft, setWarningDaysDraft] = useState("10");
  const [reminderDaysDraft, setReminderDaysDraft] = useState("3");
  const [locationName, setLocationName] = useState("");
  const [locationEditName, setLocationEditName] = useState("");
  const [slotKind, setSlotKind] = useState<"shelf" | "drawer">("shelf");
  const [slotNumber, setSlotNumber] = useState("1");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemNameDraft, setItemNameDraft] = useState("");
  const [itemBarcodeDraft, setItemBarcodeDraft] = useState("");
  const [itemUnitTypeId, setItemUnitTypeId] = useState("");
  const [itemTrackExpiryDraft, setItemTrackExpiryDraft] = useState(true);
  const [batchCodeDraft, setBatchCodeDraft] = useState("");
  const [batchExpiryDateDraft, setBatchExpiryDateDraft] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitShortCode, setUnitShortCode] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [snapshotState, setSnapshotState] = useState<Awaited<ReturnType<typeof loadSnapshot>> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
        setSelectedLocationId((current) => current || snapshot.locations[0]?.id || "");
      } catch (error) {
        if (cancelled) {
          return;
        }
        setSnapshotState(seedSnapshot);
        setWarningDaysDraft(String(seedSnapshot.settings.expiryWarningDays));
        setReminderDaysDraft(String(seedSnapshot.settings.reminderRepeatDays));
        setSelectedLocationId((current) => current || seedSnapshot.locations[0]?.id || "");
        setLoadError(error instanceof Error ? error.message : "Lokale Daten konnten nicht geladen werden.");
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

  const currentLocation =
    viewModel?.locations.find((location) => location.id === selectedLocationId) ?? viewModel?.locations[0];

  useEffect(() => {
    setLocationEditName(currentLocation?.name ?? "");
  }, [currentLocation?.id, currentLocation?.name]);

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

  const currentItem = snapshotState?.items.find((item) => item.id === selectedItemId) ?? null;

  useEffect(() => {
    if (currentItem) {
      setItemNameDraft(currentItem.name);
      setItemBarcodeDraft(currentItem.barcode ?? "");
      setItemUnitTypeId(currentItem.unitTypeId);
      setItemTrackExpiryDraft(currentItem.trackExpiry);
      return;
    }

    setItemNameDraft("");
    setItemBarcodeDraft("");
    setItemUnitTypeId(snapshotState?.unitTypes[0]?.id ?? "");
    setItemTrackExpiryDraft(true);
  }, [currentItem, snapshotState]);

  const visibleAlerts = useMemo(
    () =>
      viewModel?.expiryAlerts.filter((alert) => alert.daysUntilExpiry <= expiryFilterDays) ?? [],
    [expiryFilterDays, viewModel]
  );

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

  const analyticsRiskList = useMemo(
    () => (viewModel?.expiryAlerts.slice(0, 4) ?? []),
    [viewModel]
  );

  const analyticsLocationList = useMemo(
    () => (viewModel?.locations.slice().sort((left, right) => right.occupancyPercent - left.occupancyPercent).slice(0, 4) ?? []),
    [viewModel]
  );

  const batchQuantityById = useMemo(() => {
    const quantities = new Map<string, number>();

    for (const movement of snapshotState?.movements ?? []) {
      const current = quantities.get(movement.batchId) ?? 0;
      const delta = movement.toSlotId ? movement.quantity : -movement.quantity;
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

          return {
            id: item.id,
            name: item.name,
            barcode: item.barcode ?? "kein Code",
            batchCount: relatedBatches.length,
            totalQuantity,
            trackExpiry: item.trackExpiry,
            nextExpiry: nextExpiry ? displayDateFormatter.format(new Date(nextExpiry)) : "ohne Ablauf",
            unitLabel: unitType?.shortCode ?? "?"
          };
        })
        .sort((left, right) => left.name.localeCompare(right.name)),
    [batchQuantityById, snapshotState]
  );

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

  async function handleReset() {
    await resetSeedData();
    setRefreshToken((current) => current + 1);
  }

  async function handleSaveLocation() {
    const trimmed = locationName.trim();
    if (!trimmed) {
      return;
    }

    try {
      await addLocation({ name: trimmed });
      setLocationName("");
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
    if (!currentLocation) {
      return;
    }

    try {
      await deleteLocation(currentLocation.id);
      setSelectedLocationId("");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Ort konnte nicht geloescht werden.");
    }
  }

  async function handleDeleteSlot(slotId: string) {
    try {
      await deleteStorageSlot(slotId);
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Slot konnte nicht geloescht werden.");
    }
  }

  async function handleSaveItem() {
    const unitTypeId = itemUnitTypeId || snapshotState?.unitTypes[0]?.id;
    if (!unitTypeId) {
      setActionError("Bitte zuerst einen Einheitentyp anlegen.");
      return;
    }

    try {
      if (currentItem && currentItem.id === selectedItemId) {
        await updateItem({
          id: currentItem.id,
          name: itemNameDraft,
          unitTypeId,
          barcode: itemBarcodeDraft,
          trackExpiry: itemTrackExpiryDraft
        });
      } else {
        const newItemId = await addItem({
          name: itemNameDraft,
          unitTypeId,
          barcode: itemBarcodeDraft,
          trackExpiry: itemTrackExpiryDraft
        });
        if (newItemId) {
          setSelectedItemId(newItemId);
        }
      }

      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Artikel konnte nicht gespeichert werden.");
    }
  }

  async function handleSaveBatch() {
    if (!currentItem) {
      setActionError("Bitte zuerst einen Artikel waehlen.");
      return;
    }

    if (currentItem.trackExpiry && !batchExpiryDateDraft) {
      setActionError("Bitte ein Ablaufdatum fuer die Charge setzen.");
      return;
    }

    try {
      await addBatch({
        itemId: currentItem.id,
        batchCode: batchCodeDraft,
        expiryDate: currentItem.trackExpiry ? batchExpiryDateDraft : batchExpiryDateDraft || "2099-12-31"
      });
      setBatchCodeDraft("");
      setBatchExpiryDateDraft("");
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Charge konnte nicht gespeichert werden.");
    }
  }

  function handleNewItem() {
    setSelectedItemId("");
    setItemNameDraft("");
    setItemBarcodeDraft("");
    setItemUnitTypeId(snapshotState?.unitTypes[0]?.id ?? "");
    setItemTrackExpiryDraft(true);
    setBatchCodeDraft("");
    setBatchExpiryDateDraft("");
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
        <IonHeader translucent>
          <IonToolbar className="topbar">
            <div className="topbar__main">
              <IonTitle>Lagerkontrolle</IonTitle>
              <span className="topbar__sub">
                {currentLocation?.name ?? "Lager"} · {viewModel?.locations.length ?? 0} Orte · offline bereit
              </span>
            </div>
            <div className="topbar__actions">
              <span className="status-dot">
                <IonIcon icon={syncOutline} />
                Sync ok
              </span>
              <IonButton fill="clear" className="reset-button" onClick={handleReset}>
                <IonIcon slot="icon-only" icon={refreshOutline} />
              </IonButton>
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen className="shell">
          <div className="shell__inner">
            {isLoading || !viewModel ? (
              <section className="surface surface--loading">Daten werden geladen …</section>
            ) : (
              <>
                <section className="surface surface--nav">
                  <div className="view-switcher">
                    {viewMeta.map((view) => (
                      <button
                        key={view.key}
                        type="button"
                        className={
                          view.key === activeView
                            ? "view-switcher__button view-switcher__button--active"
                            : "view-switcher__button"
                        }
                        onClick={() => setActiveView(view.key)}
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
                      <header className="section-header">
                        <div>
                          <h1>Dashboard</h1>
                          <span>Warnung standardmaessig {viewModel.settings.expiryWarningDays} Tage vorher</span>
                        </div>
                      </header>
                      <div className="metric-grid">
                        {viewModel.dashboardStats.map((stat) => (
                          <article key={stat.id} className={`metric-card ${toneClass(stat.tone)}`}>
                            <span>{stat.label}</span>
                            <strong>{stat.value}</strong>
                            <small>{stat.detail}</small>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Ablauf</h2>
                          <span>{visibleAlerts.length} Treffer im Filter</span>
                        </div>
                        <IonBadge color="light">{expiryFilterDays} Tage</IonBadge>
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

                      <div className="filter-pills">
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

                      <div className="list">
                        {visibleAlerts.map((alert) => (
                          <article
                            key={alert.id}
                            className={`list-row list-row--alert ${toneClass(
                              alert.daysUntilExpiry <= 5
                                ? "critical"
                                : alert.daysUntilExpiry <= viewModel.settings.expiryWarningDays
                                  ? "warning"
                                  : "neutral"
                            )}`}
                          >
                            <div className="list-row__main">
                              <strong>{alert.itemName}</strong>
                              <span>
                                {alert.locationName} · {alert.slotName}
                              </span>
                            </div>
                            <div className="list-row__meta">
                              <b>{alert.daysUntilExpiry} T</b>
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
                          <h2>Orte im Ueberblick</h2>
                        </div>
                      </header>
                      <div className="list">
                        {viewModel.locations.map((location) => (
                          <article
                            key={location.id}
                            className="list-row list-row--clickable"
                            onClick={() => {
                              setSelectedLocationId(location.id);
                              setActiveView("locations");
                            }}
                          >
                            <div className="list-row__main">
                              <strong>{location.name}</strong>
                              <span>
                                {location.slotCount} Slots · {location.itemCount} Artikel
                              </span>
                            </div>
                            <div className="list-row__meta">
                              <b>{location.occupancyPercent}%</b>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Letzte Bewegungen</h2>
                        </div>
                      </header>
                      <div className="list">
                        {viewModel.recentMovements.map((movement) => (
                          <article key={movement.id} className="list-row">
                            <div className="list-row__main">
                              <strong>
                                {movement.itemName} · {movement.quantity} {movement.unitShortCode}
                              </strong>
                              <span>{movement.toLabel ?? movement.fromLabel}</span>
                            </div>
                            <div className="list-row__meta">
                              <small>{movement.timestampLabel}</small>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}

                {activeView === "locations" ? (
                  <div className="stack">
                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Neu anlegen</h2>
                        </div>
                      </header>
                      <div className="unit-form">
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Neuer Ort</IonLabel>
                          <IonInput
                            value={locationName}
                            placeholder="z. B. Kuehllager"
                            onIonInput={(event) => setLocationName(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
                        <IonButton className="primary-button" onClick={handleSaveLocation}>
                          Ort speichern
                        </IonButton>
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h1>Orte</h1>
                          <span>{viewModel.locations.length} aktiv</span>
                        </div>
                      </header>
                      <div className="location-grid">
                        {viewModel.locations.map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            className={
                              location.id === currentLocation?.id
                                ? "location-card location-card--active"
                                : "location-card"
                            }
                            onClick={() => setSelectedLocationId(location.id)}
                          >
                            <div className="location-card__top">
                              <strong>{location.name}</strong>
                              <IonBadge color="light">{location.occupancyPercent}%</IonBadge>
                            </div>
                            <span>{location.slotCount} Slots</span>
                            <small>{location.itemCount} Artikel</small>
                          </button>
                        ))}
                      </div>
                    </section>

                    {currentLocation ? (
                      <>
                        <section className="surface">
                          <header className="section-header">
                            <div>
                              <h2>Ort verwalten</h2>
                              <span>{currentLocation.name}</span>
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
                            <IonButton className="primary-button" onClick={handleRenameLocation}>
                              Ort aktualisieren
                            </IonButton>
                            <IonButton className="danger-button" fill="outline" onClick={handleDeleteLocation}>
                              Ort loeschen
                            </IonButton>
                          </div>
                        </section>

                        <section className="surface">
                          <header className="section-header">
                            <div>
                              <h2>Slot anlegen</h2>
                              <span>{currentLocation.name}</span>
                            </div>
                          </header>
                          <div className="unit-form">
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Typ</IonLabel>
                              <IonInput
                                value={slotKind === "shelf" ? "Regal" : "Lade"}
                                readonly
                                onClick={() => setSlotKind((current) => (current === "shelf" ? "drawer" : "shelf"))}
                              />
                            </IonItem>
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Nummer</IonLabel>
                              <IonInput
                                type="number"
                                value={slotNumber}
                                onIonInput={(event) => setSlotNumber(String(event.detail.value ?? ""))}
                              />
                            </IonItem>
                            <IonButton className="primary-button" onClick={handleSaveSlot}>
                              {slotKind === "shelf" ? "Regal speichern" : "Lade speichern"}
                            </IonButton>
                          </div>
                          <div className="filter-pills">
                            <button
                              type="button"
                              className={slotKind === "shelf" ? "pill pill--active" : "pill"}
                              onClick={() => setSlotKind("shelf")}
                            >
                              Regal
                            </button>
                            <button
                              type="button"
                              className={slotKind === "drawer" ? "pill pill--active" : "pill"}
                              onClick={() => setSlotKind("drawer")}
                            >
                              Lade
                            </button>
                          </div>
                        </section>

                        <section className="surface">
                          <header className="section-header">
                            <div>
                              <h2>Regale und Laden</h2>
                              <span>{currentSlots.length} angelegt</span>
                            </div>
                          </header>
                          <div className="list">
                            {currentSlots.map((slot) => (
                              <article key={slot.id} className="list-row">
                                <div className="list-row__main">
                                  <strong>{slot.label}</strong>
                                  <span>{slot.kind === "shelf" ? "Regal" : "Lade"}</span>
                                </div>
                                <div className="list-row__meta">
                                  <IonButton
                                    size="small"
                                    fill="clear"
                                    className="danger-button"
                                    onClick={() => void handleDeleteSlot(slot.id)}
                                  >
                                    Loeschen
                                  </IonButton>
                                </div>
                              </article>
                            ))}
                          </div>
                        </section>

                        <section className="surface">
                          <header className="section-header">
                            <div>
                              <h2>{currentLocation.name}</h2>
                              <span>
                                {currentLocation.itemCount} Artikel · {currentLocation.lastMovementLabel}
                              </span>
                            </div>
                            <IonBadge color="light">{currentLocation.occupancyPercent}% belegt</IonBadge>
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
                  </div>
                ) : null}

                {activeView === "items" ? (
                  <div className="stack">
                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h1>Artikel</h1>
                          <span>{itemSummaries.length} angelegt</span>
                        </div>
                        <IonButton fill="outline" className="primary-button" onClick={handleNewItem}>
                          Neu
                        </IonButton>
                      </header>
                      <div className="entity-grid">
                        {itemSummaries.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={item.id === selectedItemId ? "entity-card entity-card--active" : "entity-card"}
                            onClick={() => setSelectedItemId(item.id)}
                          >
                            <div className="entity-card__top">
                              <strong>{item.name}</strong>
                              <IonBadge color="light">{item.unitLabel}</IonBadge>
                            </div>
                            <span>{item.totalQuantity} im Bestand</span>
                            <small>
                              {item.batchCount} Chargen · {item.trackExpiry ? item.nextExpiry : "ohne Ablauf"}
                            </small>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>{currentItem ? "Artikel bearbeiten" : "Artikel anlegen"}</h2>
                          <span>{currentItem ? currentItem.name : "Neuer Stammdatensatz"}</span>
                        </div>
                      </header>
                      <div className="unit-form">
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
                        <IonItem className="compact-field">
                          <IonLabel position="stacked">Barcode</IonLabel>
                          <IonInput
                            value={itemBarcodeDraft}
                            placeholder="optional"
                            onIonInput={(event) => setItemBarcodeDraft(String(event.detail.value ?? ""))}
                          />
                        </IonItem>
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
                          <IonButton fill="outline" className="primary-button" onClick={handleNewItem}>
                            Neuer Artikel
                          </IonButton>
                        ) : null}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Chargen</h2>
                          <span>{currentItem ? currentItem.name : "Bitte zuerst Artikel waehlen"}</span>
                        </div>
                      </header>
                      {currentItem ? (
                        <>
                          <div className="unit-form">
                            <IonItem className="compact-field">
                              <IonLabel position="stacked">Chargencode</IonLabel>
                              <IonInput
                                value={batchCodeDraft}
                                placeholder="z. B. ST-2026-04"
                                onIonInput={(event) => setBatchCodeDraft(String(event.detail.value ?? ""))}
                              />
                            </IonItem>
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
                        <div className="empty-state">Mit Neu zuerst einen Artikel anlegen oder einen bestehenden waehlen.</div>
                      )}
                    </section>
                  </div>
                ) : null}

                {activeView === "booking" ? (
                  <div className="stack">
                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h1>Schnellbuchung</h1>
                          <span>naechster Schritt: echte Buchungsmaske</span>
                        </div>
                        <IonButton fill="solid" className="primary-button">
                          <IonIcon slot="start" icon={barcodeOutline} />
                          Scannen
                        </IonButton>
                      </header>
                      <div className="action-grid">
                        <button type="button" className="action-card">
                          <strong>Zugang</strong>
                          <span>Ware einbuchen</span>
                        </button>
                        <button type="button" className="action-card">
                          <strong>Abgang</strong>
                          <span>Verbrauch buchen</span>
                        </button>
                        <button type="button" className="action-card">
                          <strong>Umbuchung</strong>
                          <span>Regal oder Lade wechseln</span>
                        </button>
                        <button type="button" className="action-card">
                          <strong>Korrektur</strong>
                          <span>Bestand anpassen</span>
                        </button>
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Vorschau</h2>
                        </div>
                      </header>
                      <div className="booking-preview">
                        <div className="booking-preview__row">
                          <span>Ort</span>
                          <b>{currentLocation?.name ?? "Teelager"}</b>
                        </div>
                        <div className="booking-preview__row">
                          <span>Slot</span>
                          <b>Regal 3</b>
                        </div>
                        <div className="booking-preview__row">
                          <span>Warnung</span>
                          <b>{viewModel.settings.expiryWarningDays} Tage vorher</b>
                        </div>
                        <div className="booking-preview__row">
                          <span>Wiedervorlage</span>
                          <b>alle {viewModel.settings.reminderRepeatDays} Tage</b>
                        </div>
                      </div>
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
                            <div className="list-row__meta">
                              <IonBadge color="light">{unitType.shortCode}</IonBadge>
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
                          <h1>Analyse</h1>
                          <span>Kennzahlen fuer Alltag und Leitung</span>
                        </div>
                      </header>
                      <div className="metric-grid">
                        {viewModel.analyticsMetrics.map((metric) => (
                          <article key={metric.id} className="metric-card tone-neutral">
                            <span>{metric.title}</span>
                            <strong>{metric.value}</strong>
                            <small>{metric.detail}</small>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="surface">
                      <header className="section-header">
                        <div>
                          <h2>Risiko zuerst</h2>
                        </div>
                      </header>
                      <div className="list">
                        {analyticsRiskList.map((alert) => (
                          <article key={alert.id} className="list-row">
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
                          <h2>Auslastung</h2>
                        </div>
                      </header>
                      <div className="list">
                        {analyticsLocationList.map((location) => (
                          <article key={location.id} className="list-row">
                            <div className="list-row__main">
                              <strong>{location.name}</strong>
                              <span>
                                {location.itemCount} Artikel · {location.slotCount} Slots
                              </span>
                            </div>
                            <div className="list-row__meta">
                              <b>{location.occupancyPercent}%</b>
                            </div>
                          </article>
                        ))}
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
      </IonPage>
    </IonApp>
  );
}

export default App;
