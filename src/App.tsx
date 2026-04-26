import { useMemo, useState } from "react";
import {
  IonApp,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import {
  alertCircleOutline,
  analyticsOutline,
  archiveOutline,
  barcodeOutline,
  checkmarkCircleOutline,
  cubeOutline,
  layersOutline,
  pulseOutline,
  repeatOutline,
  syncOutline,
  warningOutline
} from "ionicons/icons";
import {
  analyticsMetrics,
  expiryAlerts,
  initialUnitTypes,
  locationSummaries,
  recentMovements,
  slotStocks,
  type UnitType,
  type ViewKey
} from "./demo-data";

const viewTitles: Record<ViewKey, string> = {
  dashboard: "Dashboard",
  locations: "Orte",
  booking: "Schnellbuchung",
  units: "Einheiten",
  analytics: "Auswertung"
};

const expiryFilters = [7, 10, 30, 60] as const;

function getAlertTone(daysUntilExpiry: number, warningWindowDays: number) {
  if (daysUntilExpiry <= 5) {
    return "critical";
  }
  if (daysUntilExpiry <= warningWindowDays) {
    return "warning";
  }
  return "neutral";
}

function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [unitTypes, setUnitTypes] = useState<UnitType[]>(initialUnitTypes);
  const [unitName, setUnitName] = useState("");
  const [unitShortCode, setUnitShortCode] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(locationSummaries[0].id);
  const [warningWindowDays, setWarningWindowDays] = useState(10);
  const [reminderRepeatDays, setReminderRepeatDays] = useState(3);
  const [expiryFilterDays, setExpiryFilterDays] = useState<number>(10);

  const saveUnitType = () => {
    const trimmedName = unitName.trim();
    const trimmedCode = unitShortCode.trim();

    if (!trimmedName || !trimmedCode) {
      return;
    }

    setUnitTypes((current) => [
      {
        id: `unit-${current.length + 1}`,
        name: trimmedName,
        shortCode: trimmedCode,
        description: unitDescription.trim() || "Benutzerdefiniert"
      },
      ...current
    ]);
    setUnitName("");
    setUnitShortCode("");
    setUnitDescription("");
  };

  const currentLocation =
    locationSummaries.find((location) => location.id === selectedLocation) ?? locationSummaries[0];

  const filteredAlerts = useMemo(
    () =>
      expiryAlerts
        .filter((alert) => alert.daysUntilExpiry <= expiryFilterDays)
        .sort((left, right) => left.daysUntilExpiry - right.daysUntilExpiry),
    [expiryFilterDays]
  );

  const locationStocks = useMemo(
    () => slotStocks.filter((stock) => stock.locationId === currentLocation.id),
    [currentLocation.id]
  );

  const dashboardStats = useMemo(() => {
    const critical = expiryAlerts.filter((alert) => alert.daysUntilExpiry <= 5).length;
    const warning = expiryAlerts.filter((alert) => alert.daysUntilExpiry <= warningWindowDays).length;
    const lowStock = slotStocks.filter((stock) => stock.quantity <= 5).length;
    const overfilled = locationSummaries.filter((location) => location.occupancyPercent >= 80).length;

    return [
      {
        id: "critical",
        label: "Kritisch",
        value: String(critical),
        detail: "<= 5 Tage",
        tone: "critical"
      },
      {
        id: "warning",
        label: "Warnfenster",
        value: String(warning),
        detail: `<= ${warningWindowDays} Tage`,
        tone: "warning"
      },
      {
        id: "low-stock",
        label: "Niedrige Bestaende",
        value: String(lowStock),
        detail: "<= 5 Einheiten",
        tone: "neutral"
      },
      {
        id: "moves",
        label: "Bewegungen",
        value: "37",
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
        value: String(overfilled),
        detail: ">= 80% belegt",
        tone: "warning"
      }
    ] as const;
  }, [warningWindowDays]);

  return (
    <IonApp>
      <IonPage>
        <IonHeader translucent>
          <IonToolbar className="topbar">
            <div className="brand-block">
              <span className="brand-kicker">Offline-first Lagersteuerung</span>
              <IonTitle>Lagerkontrolle</IonTitle>
            </div>
            <div className="toolbar-meta">
              <IonChip className="status-chip status-chip--good">
                <IonIcon icon={syncOutline} />
                <IonLabel>Sync stabil</IonLabel>
              </IonChip>
              <IonChip className="status-chip status-chip--warning">
                <IonIcon icon={barcodeOutline} />
                <IonLabel>Scan bereit</IonLabel>
              </IonChip>
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen className="app-shell">
          <div className="shell-gradient" />
          <div className="page-wrap">
            <section className="hero-card">
              <div>
                <p className="eyebrow">Mobile Demo</p>
                <h1>{viewTitles[activeView]}</h1>
                <p className="hero-copy">Warnen, buchen, scannen, synchronisieren.</p>
              </div>
              <div className="hero-actions">
                <IonButton shape="round" className="hero-button">
                  Demo-Daten
                </IonButton>
                <IonChip className="signal-chip">
                  <IonIcon icon={pulseOutline} />
                  <IonLabel>37 Bewegungen heute</IonLabel>
                </IonChip>
              </div>
            </section>

            <IonSegment
              className="main-nav"
              value={activeView}
              onIonChange={(event) => setActiveView(event.detail.value as ViewKey)}
            >
              <IonSegmentButton value="dashboard">
                <IonLabel>Dashboard</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="locations">
                <IonLabel>Orte</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="booking">
                <IonLabel>Buchung</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="units">
                <IonLabel>Einheiten</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="analytics">
                <IonLabel>Auswertung</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {activeView === "dashboard" ? (
              <div className="view-grid">
                <section className="stats-grid">
                  {dashboardStats.map((stat) => (
                    <IonCard key={stat.id} className={`stat-card stat-card--${stat.tone}`}>
                      <IonCardContent>
                        <p>{stat.label}</p>
                        <strong>{stat.value}</strong>
                        <span>{stat.detail}</span>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Ablauf</h2>
                    </div>
                    <IonChip className="signal-chip signal-chip--critical">
                      <IonIcon icon={warningOutline} />
                      <IonLabel>{filteredAlerts.length} Treffer</IonLabel>
                    </IonChip>
                  </div>

                  <div className="settings-grid">
                    <IonItem className="field field--compact">
                      <IonLabel position="stacked">Warnung ab</IonLabel>
                      <IonInput
                        type="number"
                        min="1"
                        value={warningWindowDays}
                        onIonInput={(event) =>
                          setWarningWindowDays(Math.max(1, Number(event.detail.value ?? 10)))
                        }
                      />
                    </IonItem>
                    <IonItem className="field field--compact">
                      <IonLabel position="stacked">Erneut erinnern</IonLabel>
                      <IonInput
                        type="number"
                        min="1"
                        value={reminderRepeatDays}
                        onIonInput={(event) =>
                          setReminderRepeatDays(Math.max(1, Number(event.detail.value ?? 3)))
                        }
                      />
                    </IonItem>
                  </div>

                  <div className="filter-row">
                    {expiryFilters.map((days) => (
                      <button
                        key={days}
                        className={
                          days === expiryFilterDays ? "filter-pill filter-pill--active" : "filter-pill"
                        }
                        onClick={() => setExpiryFilterDays(days)}
                        type="button"
                      >
                        {days} Tage
                      </button>
                    ))}
                  </div>

                  <div className="alert-list">
                    {filteredAlerts.map((alert) => {
                      const tone = getAlertTone(alert.daysUntilExpiry, warningWindowDays);
                      return (
                        <article key={alert.id} className={`alert-card alert-card--${tone}`}>
                          <div>
                            <h3>{alert.itemName}</h3>
                            <p>
                              {alert.locationName} / {alert.slotName}
                            </p>
                            <span>Charge {alert.batchCode}</span>
                          </div>
                          <div className="alert-metrics">
                            <IonBadge color={tone === "critical" ? "danger" : tone === "warning" ? "warning" : "medium"}>
                              {alert.daysUntilExpiry} Tage
                            </IonBadge>
                            <strong>
                              {alert.quantity} {alert.unitShortCode}
                            </strong>
                            <small>Wiedervorlage in {Math.min(alert.reminderDueInDays, reminderRepeatDays)} Tagen</small>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Letzte Bewegungen</h2>
                    </div>
                  </div>
                  <IonList lines="none" className="movement-list">
                    {recentMovements.map((movement) => (
                      <IonItem key={movement.id} className="movement-item">
                        <IonIcon
                          slot="start"
                          icon={
                            movement.direction === "transfer"
                              ? repeatOutline
                              : movement.direction === "in"
                                ? checkmarkCircleOutline
                                : alertCircleOutline
                          }
                        />
                        <IonLabel>
                          <h3>
                            {movement.itemName} · {movement.quantity} {movement.unitShortCode}
                          </h3>
                          <p>{movement.toLabel ?? movement.fromLabel}</p>
                        </IonLabel>
                        <IonNote slot="end">{movement.timestampLabel}</IonNote>
                      </IonItem>
                    ))}
                  </IonList>
                </section>
              </div>
            ) : null}

            {activeView === "locations" ? (
              <div className="view-grid">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Orte</h2>
                    </div>
                  </div>
                  <div className="location-pills">
                    {locationSummaries.map((location) => (
                      <button
                        key={location.id}
                        className={
                          location.id === currentLocation.id
                            ? "location-pill location-pill--active"
                            : "location-pill"
                        }
                        onClick={() => setSelectedLocation(location.id)}
                        type="button"
                      >
                        <span>{location.name}</span>
                        <small>{location.slotCount} Slots</small>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="panel panel--location">
                  <div className="panel-header">
                    <div>
                      <h2>{currentLocation.name}</h2>
                      <p>
                        {currentLocation.itemCount} Artikel · {currentLocation.lastMovementLabel}
                      </p>
                    </div>
                    <IonChip className="signal-chip">
                      <IonIcon icon={archiveOutline} />
                      <IonLabel>{currentLocation.occupancyPercent}% belegt</IonLabel>
                    </IonChip>
                  </div>
                  <div className="slot-grid">
                    {locationStocks.map((stock) => (
                      <IonCard key={stock.id} className={`slot-card slot-card--${stock.status}`}>
                        <IonCardContent>
                          <div className="slot-topline">
                            <span>{stock.slotName}</span>
                            <IonBadge
                              color={
                                stock.status === "critical"
                                  ? "danger"
                                  : stock.status === "warning"
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {stock.status === "critical"
                                ? "kritisch"
                                : stock.status === "warning"
                                  ? "bald"
                                  : "ok"}
                            </IonBadge>
                          </div>
                          <h3>{stock.itemName}</h3>
                          <strong>
                            {stock.quantity} {stock.unitShortCode}
                          </strong>
                          <p>Verfall {stock.expiryDate}</p>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}

            {activeView === "booking" ? (
              <div className="view-grid">
                <section className="panel panel--booking">
                  <div className="panel-header">
                    <div>
                      <h2>Schnellbuchung</h2>
                    </div>
                    <IonButton fill="outline" shape="round">
                      <IonIcon slot="start" icon={barcodeOutline} />
                      Scannen
                    </IonButton>
                  </div>

                  <div className="booking-steps">
                    <article className="booking-step">
                      <span>1</span>
                      <div>
                        <h3>Ort / Slot</h3>
                        <p>Teelager / Regal 3</p>
                      </div>
                    </article>
                    <article className="booking-step">
                      <span>2</span>
                      <div>
                        <h3>Artikel</h3>
                        <p>scannen oder suchen</p>
                      </div>
                    </article>
                    <article className="booking-step">
                      <span>3</span>
                      <div>
                        <h3>Menge / Charge</h3>
                        <p>+ / - / Umbuchung</p>
                      </div>
                    </article>
                  </div>

                  <div className="booking-preview">
                    <IonChip className="status-chip status-chip--warning">
                      <IonIcon icon={warningOutline} />
                      <IonLabel>Warnung ab {warningWindowDays} Tagen</IonLabel>
                    </IonChip>
                    <IonChip className="status-chip">
                      <IonIcon icon={cubeOutline} />
                      <IonLabel>Einheit: Packung</IonLabel>
                    </IonChip>
                  </div>
                </section>
              </div>
            ) : null}

            {activeView === "units" ? (
              <div className="view-grid">
                <section className="panel panel--unit-form">
                  <div className="panel-header">
                    <div>
                      <h2>Einheit anlegen</h2>
                    </div>
                  </div>
                  <div className="form-grid">
                    <IonItem className="field">
                      <IonLabel position="stacked">Name</IonLabel>
                      <IonInput
                        value={unitName}
                        placeholder="Kiste"
                        onIonInput={(event) => setUnitName(String(event.detail.value ?? ""))}
                      />
                    </IonItem>
                    <IonItem className="field">
                      <IonLabel position="stacked">Kurzcode</IonLabel>
                      <IonInput
                        value={unitShortCode}
                        placeholder="Kis"
                        onIonInput={(event) => setUnitShortCode(String(event.detail.value ?? ""))}
                      />
                    </IonItem>
                    <IonItem className="field">
                      <IonLabel position="stacked">Beschreibung</IonLabel>
                      <IonInput
                        value={unitDescription}
                        placeholder="optional"
                        onIonInput={(event) => setUnitDescription(String(event.detail.value ?? ""))}
                      />
                    </IonItem>
                  </div>
                  <IonButton expand="block" className="hero-button" onClick={saveUnitType}>
                    Einheit speichern
                  </IonButton>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Einheiten</h2>
                    </div>
                    <IonChip className="signal-chip">
                      <IonIcon icon={layersOutline} />
                      <IonLabel>{unitTypes.length} aktiv</IonLabel>
                    </IonChip>
                  </div>
                  <div className="unit-grid">
                    {unitTypes.map((unitType) => (
                      <IonCard key={unitType.id} className="unit-card">
                        <IonCardContent>
                          <div className="unit-heading">
                            <h3>{unitType.name}</h3>
                            <IonBadge color="medium">{unitType.shortCode}</IonBadge>
                          </div>
                          <p>{unitType.description}</p>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}

            {activeView === "analytics" ? (
              <div className="view-grid">
                <section className="stats-grid">
                  {analyticsMetrics.map((card) => (
                    <IonCard key={card.id} className="stat-card stat-card--neutral">
                      <IonCardContent>
                        <p>{card.title}</p>
                        <strong>{card.value}</strong>
                        <span>{card.detail}</span>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </section>
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Relevante Kennzahlen</h2>
                    </div>
                    <IonChip className="signal-chip">
                      <IonIcon icon={analyticsOutline} />
                      <IonLabel>Test-Dashboard</IonLabel>
                    </IonChip>
                  </div>
                  <div className="analytics-preview">
                    <article>
                      <h3>Fuer den Alltag</h3>
                      <ul>
                        <li>Kritische Chargen</li>
                        <li>Bald ablaufend im Zeitraum</li>
                        <li>Niedrige Bestaende</li>
                        <li>Bewegungen und Scans heute</li>
                      </ul>
                    </article>
                    <article>
                      <h3>Fuer Leitung und Planung</h3>
                      <ul>
                        <li>Aktivster Ort</li>
                        <li>Hohe Auslastung</li>
                        <li>Trend bei Umbuchungen</li>
                        <li>Offene Sync-Themen</li>
                      </ul>
                    </article>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </IonContent>

        <IonFooter translucent>
          <IonToolbar className="footer-bar">
            <div className="footer-metrics">
              <span>Warnung {warningWindowDays} Tage vorher</span>
              <span>Wiedervorlage {reminderRepeatDays} Tage</span>
              <span>Filter {expiryFilterDays} Tage</span>
            </div>
          </IonToolbar>
        </IonFooter>
      </IonPage>
    </IonApp>
  );
}

export default App;
