# Lagerkontrolle

Offline-first Lager- und Standortverwaltung fuer Handy und Tablet. Die App soll Lagerorte, Regale oder Laden, variable Bestandsarten, Ablaufdaten, Scans und schnelle Bestandsbewegungen ohne komplizierte Eingabemasken abbilden.

## Produktziel

Mitarbeitende sollen in wenigen Sekunden sehen und erfassen koennen:

- In welchem Ort und in welchem Regal oder in welcher Lade etwas liegt
- Was dort liegt
- Wie viel davon vorhanden ist
- Welche Chargen oder Ablaufdaten kritisch werden

## Empfohlener Ansatz

Empfehlung fuer das MVP:

- Installierbare Progressive Web App (PWA)
- Lokal-first Datenhaltung mit direkter Mehrgeraete-Synchronisation
- Spaeter optional als Android-App per Capacitor verpacken

Warum das sinnvoll ist:

- komplett kostenlos und Open Source umsetzbar
- laeuft auf Handy und Tablet
- offline faehig
- schneller sichtbarer Frontend-Stand fuer fruehe Tests
- schnelle Weiterentwicklung ohne App-Store-Zwang

## Kernfunktionen fuer MVP

- Orte anlegen, z. B. `Teelager`
- Regale oder Laden pro Ort nummerieren, z. B. `Regal 1`, `Lade 4`
- Artikel, Behaelter, Gebinde und Verbrauchsmaterial erfassen
- freie Einheitentypen wie `Stk`, `Packung`, `Kiste`, `Flasche` anlegen
- pro Artikel einen Mindestbestand definieren
- Mengen schnell buchen: `+`, `-`, Umbuchung
- Ablaufdaten und Chargen fuer fast alle Artikel verwalten
- Vorwarnungen vor Ablauf anzeigen, Standard `10 Tage vorher`
- Wiedervorlage nach Warnung in `X Tagen`
- Ablauf im frei waehlbaren Zeitraum filtern
- Barcode- oder QR-Scan direkt im MVP
- Mehrgeraete-Sync direkt im MVP
- Dashboard mit Status, Warnungen und Auswertung
- spaeter zusaetzlich Analyse-Charts fuer Trends und Verteilungen
- Favoriten, letzte Eintraege und schnelle Wiederholung
- Suche und Filter nach Ort, Artikel, Status

## Dokumente in diesem Repo

- `PLAN.md`: Phasenplan
- `QUESTIONS.md`: offene Fachfragen
- `docs/PRODUCT_REQUIREMENTS.md`: Anforderungen
- `docs/ARCHITECTURE.md`: Technikvorschlag
- `docs/BACKLOG.md`: priorisierte MVP-Arbeit
- `docs/IMPLEMENTATION_PLAN.md`: Umsetzungsreihenfolge
- `docs/DOMAIN_MODEL.md`: fachliches Datenmodell
- `docs/UX_NOTES.md`: wichtige Produkt- und Bedienprinzipien
- `docs/INSTALLATION_GUIDE.md`: Weitergabe und Installation auf anderen Geraeten
- `docs/DATA_STORAGE.md`: wo Daten liegen und was lokal bleibt
- `docs/PILOT_CHECKLIST.md`: Pilotfreigabe und Testbetrieb
- `docs/IMPORT_FORMAT.md`: Zielstruktur fuer spaetere Excel-Dateien
- `docs/SYNC_SETUP.md`: CouchDB-Einrichtung und Mehrgeraete-Sync

## Entwicklung

```sh
npm install
npm run dev
npm run build
```

- `npm run dev`: startet die mobile PWA lokal
- `npm run build`: prueft TypeScript und baut das Produktionsbundle

## Verteilung

- Lokaler WLAN-Test: `http://<deine-lan-ip>:5174/`
- HTTPS-Verteilung an andere Geraete: GitHub Pages ueber `.github/workflows/deploy-pages.yml`
- genaue Schritte stehen in `docs/INSTALLATION_GUIDE.md`

## Aktueller Stand

- modernes mobiles Frontend mit kompakter Navigation ohne Hero-Header
- Orte und Artikel sind als Listen mit Filtersuche und separatem Detailscreen aufgebaut
- Orte, Slots und freie Slot-Typen koennen lokal angelegt, umbenannt und leere Eintraege geloescht werden
- Artikel mit Einheit, Barcode, Ablaufpflicht und bevorzugtem Ort koennen angelegt und bearbeitet werden
- Chargen mit Ablaufdatum koennen pro Artikel gepflegt werden
- Buchung speichert jetzt echte lokale Bewegungen fuer Zugang, Abgang, Umbuchung und Korrektur
- Buchung fuehrt mobil direkt ueber Buchungsdaten mit Artikel-Dropdown, Ort-Dropdown, Slot, Charge und Menge
- im Zugang kann direkt ein neuer Artikel mit Minimalstammdaten angelegt und sofort eingebucht werden
- Scan ist im Buchungsflow und im Artikel-Barcodefeld aktiv, mit manueller Eingabe als Fallback falls Live-Scan nicht verfuegbar ist
- Favoriten fuer Orte und Artikel bleiben lokal gespeichert
- Buchung und Dashboard priorisieren Favoriten und zuletzt genutzte Eintraege
- Analyse zeigt mobile Charts fuer Bewegungen, Ablauf-Verteilung, Top-Orte und Top-Artikel plus priorisierte Risiko-Liste
- Dashboard zeigt Ablaufwarnungen und niedrige Bestaende getrennt
- mobile Listen und Analysekarten sind fuer Handy dichter und lesbarer nachgezogen
- echtes Domain-Modell fuer `Location`, `StorageSlot`, `UnitType`, `Item`, `Batch`, `Movement`, `AppSettings`
- lokale Offline-Persistenz ueber `IndexedDB` mit `Dexie`
- Bestandsableitung aus Bewegungen statt aus fixen Direktwerten
- erste Pilot-Haertung gestartet: Build-Splitting fuer Storage und UI-Bloecke ist vorbereitet
- GitHub-Pages-Deploy fuer HTTPS-Verteilung und PWA-Installation ist vorbereitet
- CouchDB-Sync-Konfiguration und sichtbarer Sync-Status sind im Dashboard eingebaut

## Naechster technischer Schritt

Frontend, Domain-Modell, lokale Persistenz sowie schnelle Orts-, Artikel- und Buchungsfluesse sind umgesetzt. Als Naechstes folgt Synchronisation zwischen mehreren Geraeten.
