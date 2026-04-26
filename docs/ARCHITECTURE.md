# Architekturvorschlag

## Empfehlung

Fuer das MVP empfehle ich eine installierbare PWA mit lokalem Offline-Speicher und self-hosted Synchronisation.

Empfohlener Open-Source-Stack:

- `React` + `TypeScript`
- `Vite`
- `Ionic` fuer mobile, schnelle UI-Bausteine
- `PouchDB` im Geraet fuer lokale Daten und Replikation
- `Apache CouchDB` self-hosted fuer Mehrgeraete-Sync
- `ZXing` oder `BarcodeDetector` fuer Barcode- und QR-Scan
- `Workbox` fuer Offline-Caching
- `Vitest` + `Testing Library`

## Warum diese Wahl

- kostenlos und Open Source
- direkt auf Handy und Tablet installierbar
- sehr schnelle Iteration
- offline mit spaeterer automatischer Replikation
- spaeter per `Capacitor` als native Android-App verpackbar
- Scan ist im Web-Stack realistisch umsetzbar

## Alternative Optionen

### Option A: PWA mit CouchDB-Sync

Beste Wahl fuer diesen Anwendungsfall. Daten liegen lokal auf dem Geraet und werden bei Verbindung mit einem self-hosted Server abgeglichen.

### Option B: PWA nur lokal ohne Sync

Fuer Einzelnutzung waere das einfacher, passt aber nicht mehr zu den aktuellen Anforderungen.

### Option C: Flutter

Technisch stark, aber fuer den schnellen Open-Source-Start schwerer und langsamer als eine gute PWA.

## Datenmodell fuer MVP

- `Location`: Ort wie `Teelager`
- `StorageSlot`: Regal oder Lade mit Nummer innerhalb eines Orts
- `Item`: Produkt, Gebinde oder Material
- `StockEntry`: aktuelle Menge eines Artikels an einem Slot
- `Batch`: Charge und Ablaufdatum
- `Movement`: Zugang, Abgang, Umbuchung, Korrektur
- `UserDevice`: Nutzer oder Geraet fuer Sync-Nachvollziehbarkeit

## Wichtige Architekturentscheidung

Bestand sollte aus Bewegungen ableitbar sein und nicht nur als direkter Gesamtwert gepflegt werden. Das ist fuer Audit, Konfliktbehandlung, Inventur und Mehrgeraete-Sync deutlich robuster.

## UX-Prinzipien

- Erfassung mit moeglichst wenig Taps
- grosse Touch-Ziele
- letzte Werte und Favoriten wiederverwendbar
- Suche immer sichtbar
- Mengenbuchung ohne komplexe Formulare
- schneller Scan-Einstieg direkt aus Startseite und Ortssicht
