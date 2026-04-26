import { useState } from "react";
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
  pulseOutline,
  repeatOutline,
  warningOutline
} from "ionicons/icons";
import {
  analyticsCards,
  dashboardStats,
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

function getAlertTone(daysUntilExpiry: number) {
  if (daysUntilExpiry <= 7) {
    return "critical";
  }
  if (daysUntilExpiry <= 21) {
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
                <IonIcon icon={checkmarkCircleOutline} />
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
                <p className="eyebrow">Ticket #6 umgesetzt als klickbarer Frontend-Stand</p>
                <h1>{viewTitles[activeView]}</h1>
                <p className="hero-copy">
                  Erste mobile PWA-Ansicht mit Dashboard, Ablaufwarnungen, freien Einheitentypen,
                  Ortsstruktur und vorbereiteter Schnellbuchung.
                </p>
              </div>
              <div className="hero-actions">
                <IonButton shape="round" className="hero-button">
                  Demo-Daten zuruecksetzen
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
                      <h2>Ablaufwarnungen vor Verfall</h2>
                      <p>Fruehwarnung sichtbar, bevor Ware wirklich ablaeuft.</p>
                    </div>
                    <IonChip className="signal-chip signal-chip--critical">
                      <IonIcon icon={warningOutline} />
                      <IonLabel>Warnfenster 30 Tage</IonLabel>
                    </IonChip>
                  </div>
                  <div className="alert-list">
                    {expiryAlerts.map((alert) => {
                      const tone = getAlertTone(alert.daysUntilExpiry);
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
                            <IonBadge color={tone === "critical" ? "danger" : "warning"}>
                              {alert.daysUntilExpiry} Tage
                            </IonBadge>
                            <strong>
                              {alert.quantity} {alert.unitShortCode}
                            </strong>
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
                      <p>Bewegungsjournal als Basis fuer spaeteren Sync und Nachvollziehbarkeit.</p>
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
                      <h2>Orte und Regale/Laden</h2>
                      <p>Struktur: Ort mit nummerierten Regalen oder Laden.</p>
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
                        {currentLocation.itemCount} Artikel · letzte Bewegung {currentLocation.lastMovementLabel}
                      </p>
                    </div>
                    <IonChip className="signal-chip">
                      <IonIcon icon={archiveOutline} />
                      <IonLabel>{currentLocation.occupancyPercent}% belegt</IonLabel>
                    </IonChip>
                  </div>
                  <div className="slot-grid">
                    {slotStocks.map((stock) => (
                      <IonCard key={stock.id} className={`slot-card slot-card--${stock.status}`}>
                        <IonCardContent>
                          <div className="slot-topline">
                            <span>{stock.slotName}</span>
                            <IonBadge color={stock.status === "critical" ? "danger" : stock.status === "warning" ? "warning" : "success"}>
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
                      <p>Der Standardflow soll spaeter in wenigen Taps abgeschlossen sein.</p>
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
                        <h3>Ort und Slot waehlen</h3>
                        <p>Beispiel: `Teelager / Regal 3`</p>
                      </div>
                    </article>
                    <article className="booking-step">
                      <span>2</span>
                      <div>
                        <h3>Artikel scannen oder suchen</h3>
                        <p>Barcode-Flow ist sichtbar vorbereitet.</p>
                      </div>
                    </article>
                    <article className="booking-step">
                      <span>3</span>
                      <div>
                        <h3>Menge und Charge erfassen</h3>
                        <p>Plus, Minus und Umbuchung bleiben einheitlich.</p>
                      </div>
                    </article>
                  </div>

                  <div className="booking-preview">
                    <IonChip className="status-chip status-chip--warning">
                      <IonIcon icon={warningOutline} />
                      <IonLabel>Warnung 16 Tage vor Ablauf</IonLabel>
                    </IonChip>
                    <IonChip className="status-chip">
                      <IonIcon icon={cubeOutline} />
                      <IonLabel>Einheitstyp: Packung</IonLabel>
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
                      <h2>Neue Einheitentypen</h2>
                      <p>Einheiten sind frei anlegbar und nicht hart codiert.</p>
                    </div>
                  </div>
                  <div className="form-grid">
                    <IonItem className="field">
                      <IonLabel position="stacked">Name</IonLabel>
                      <IonInput
                        value={unitName}
                        placeholder="z. B. Kiste"
                        onIonInput={(event) => setUnitName(String(event.detail.value ?? ""))}
                      />
                    </IonItem>
                    <IonItem className="field">
                      <IonLabel position="stacked">Kurzcode</IonLabel>
                      <IonInput
                        value={unitShortCode}
                        placeholder="z. B. Kis"
                        onIonInput={(event) => setUnitShortCode(String(event.detail.value ?? ""))}
                      />
                    </IonItem>
                    <IonItem className="field">
                      <IonLabel position="stacked">Beschreibung</IonLabel>
                      <IonInput
                        value={unitDescription}
                        placeholder="Wofuer wird die Einheit genutzt?"
                        onIonInput={(event) => setUnitDescription(String(event.detail.value ?? ""))}
                      />
                    </IonItem>
                  </div>
                  <IonButton expand="block" className="hero-button" onClick={saveUnitType}>
                    Einheitentyp anlegen
                  </IonButton>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Aktive Einheiten</h2>
                      <p>Diese Demo ist schon interaktiv und fuegt neue Einheitstypen lokal hinzu.</p>
                    </div>
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
                  {analyticsCards.map((card) => (
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
                      <h2>Dashboard-Auswertung</h2>
                      <p>Hier folgt spaeter die echte Verdichtung aus Bewegungen, Resttagen und Trends.</p>
                    </div>
                    <IonChip className="signal-chip">
                      <IonIcon icon={analyticsOutline} />
                      <IonLabel>Pilot-ready Layout</IonLabel>
                    </IonChip>
                  </div>
                  <div className="analytics-preview">
                    <article>
                      <h3>Was bereits sichtbar ist</h3>
                      <ul>
                        <li>Kritische Chargen und Fruehwarnungen</li>
                        <li>Bewegungen pro Tag</li>
                        <li>Aktivitaet pro Ort</li>
                        <li>Freie Einheitentypen als Stammdaten</li>
                      </ul>
                    </article>
                    <article>
                      <h3>Was spaeter ausgebaut wird</h3>
                      <ul>
                        <li>Verbrauchstrends pro Artikel</li>
                        <li>Excel-Import nach Vorliegen der Quelldateien</li>
                        <li>Inventurabweichungen</li>
                        <li>Mindestbestandswarnungen</li>
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
              <span>Offline-Start vorbereitet</span>
              <span>Sync-Ansicht vorbereitet</span>
              <span>Scan-Einstieg sichtbar</span>
            </div>
          </IonToolbar>
        </IonFooter>
      </IonPage>
    </IonApp>
  );
}

export default App;
