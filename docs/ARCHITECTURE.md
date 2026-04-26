# Architekturvorschlag

## Empfehlung

Die aktuelle Implementierung ist eine installierbare PWA mit lokalem Offline-Speicher und vorbereiteter Repository-Schicht fuer spaetere Synchronisation.

Empfohlener Open-Source-Stack:

- `React` + `TypeScript`
- `Vite`
- `Ionic` fuer mobile, schnelle UI-Bausteine
- `Dexie` auf `IndexedDB` fuer lokale Offline-Daten
- Repository-Schicht als Trennung zwischen UI und Speicherung
- spaeterer Sync-Adapter fuer Mehrgeraete-Synchronisation
- `ZXing` oder `BarcodeDetector` fuer Barcode- und QR-Scan
- `Workbox` fuer Offline-Caching
- `Vitest` + `Testing Library`

## Warum diese Wahl

- kostenlos und Open Source
- direkt auf Handy und Tablet installierbar
- sehr schnelle Iteration
- offline schon heute ohne Zusatzinfrastruktur
- klarer Migrationspfad zu spaeterem Sync durch getrennte Repository-Schicht
- spaeter per `Capacitor` als native Android-App verpackbar
- Scan ist im Web-Stack realistisch umsetzbar

## Alternative Optionen

### Aktueller Stand

Die App speichert derzeit lokal in `IndexedDB`. Der aktuelle Fokus liegt bewusst auf Bedienung, Datenmodell und robuster Offline-Nutzung. Synchronisation ist weiter geplant, aber noch nicht implementiert.

### Naechste Architekturentscheidung

Vor Ticket `#8` muss entschieden werden, ob der Sync ueber:

- einen eigenen API-Dienst
- `CouchDB`-kompatible Replikation
- oder einen anderen self-hosted Sync-Ansatz

laufen soll.

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
