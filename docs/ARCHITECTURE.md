# Architekturvorschlag

## Empfehlung

Die aktuelle Implementierung ist eine installierbare PWA mit lokalem Offline-Speicher, Repository-Schicht und vorbereitetem CouchDB-Sync.

Empfohlener Open-Source-Stack:

- `React` + `TypeScript`
- `Vite`
- `Ionic` fuer mobile, schnelle UI-Bausteine
- `Dexie` auf `IndexedDB` fuer lokale Offline-Daten
- Repository-Schicht als Trennung zwischen UI und Speicherung
- CouchDB-Sync-Adapter fuer Mehrgeraete-Synchronisation
- `ZXing` oder `BarcodeDetector` fuer Barcode- und QR-Scan
- `Workbox` fuer Offline-Caching
- `Vitest` + `Testing Library`

## Warum diese Wahl

- kostenlos und Open Source
- direkt auf Handy und Tablet installierbar
- sehr schnelle Iteration
- offline schon heute ohne Zusatzinfrastruktur
- klarer Offline-Betrieb mit optionalem CouchDB-Sync
- spaeter per `Capacitor` als native Android-App verpackbar
- Scan ist im Web-Stack realistisch umsetzbar

## Alternative Optionen

### Aktueller Stand

Die App speichert lokal in `IndexedDB`. Mehrgeraete-Sync ist ueber CouchDB vorbereitet und muss fuer den echten Betrieb mit einer erreichbaren CouchDB-Instanz getestet werden.

### Naechste Architekturentscheidung

Vor produktiver Mehrgeraete-Nutzung muss entschieden werden, welche CouchDB-Instanz betrieben wird und wie Backup, Benutzer und Zugriffsrechte organisiert werden.

### Option C: Flutter

Technisch stark, aber fuer den schnellen Open-Source-Start schwerer und langsamer als eine gute PWA.

## Datenmodell fuer MVP

- `Location`: Ort wie `Teelager`
- `StorageSlot`: Regal oder Lade mit Nummer innerhalb eines Orts
- `Item`: Produkt, Gebinde oder Material
- `UnitType`: frei definierbare Einheit
- `Batch`: Charge und Ablaufdatum
- `Movement`: Zugang, Abgang, Umbuchung, Korrektur
- `AppSettings`: Warnfenster und Wiedervorlage

## Wichtige Architekturentscheidung

Bestand wird aus Bewegungen abgeleitet und nicht als direkter Gesamtwert gepflegt. Das ist fuer Audit, spaetere Konfliktbehandlung, Inventur und Mehrgeraete-Sync deutlich robuster.

## UX-Prinzipien

- Erfassung mit moeglichst wenig Taps
- grosse Touch-Ziele
- letzte Werte und Favoriten wiederverwendbar
- Suche immer sichtbar
- Mengenbuchung ohne komplexe Formulare
- schneller Scan-Einstieg direkt aus Startseite und Ortssicht
