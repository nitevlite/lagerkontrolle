# Architekturvorschlag

## Empfehlung

Fuer das MVP empfehle ich eine installierbare PWA mit lokalem Offline-Speicher.

Empfohlener Open-Source-Stack:

- `React` + `TypeScript`
- `Vite`
- `Ionic` fuer mobile, schnelle UI-Bausteine
- `Dexie` auf `IndexedDB` fuer lokale Daten
- `Workbox` fuer Offline-Caching
- `Vitest` + `Testing Library`

## Warum diese Wahl

- kostenlos und Open Source
- direkt auf Handy und Tablet installierbar
- sehr schnelle Iteration
- offline ohne Sonderinfrastruktur
- spaeter per `Capacitor` als native Android-App verpackbar

## Alternative Optionen

### Option A: PWA plus spaeterer Sync

Beste Wahl fuer schnellen Start. Daten bleiben zuerst lokal auf dem Geraet. Spaeter kann ein Sync-Service ergaenzt werden.

### Option B: PWA plus self-hosted Sync

Wenn mehrere Nutzer gleichzeitig mit denselben Daten arbeiten, ist ein self-hosted Sync sinnvoll, zum Beispiel mit:

- eigenem API-Server
- `CouchDB`-kompatibler Synchronisation
- spaeterem Rollen- und Rechtemodell

### Option C: Flutter

Technisch stark, aber fuer den schnellen Open-Source-Start schwerer und langsamer als eine gute PWA.

## Datenmodell fuer MVP

- `Location`: Ort oder Unterort
- `Item`: Produkt, Gebinde oder Material
- `StockEntry`: Menge eines Artikels an einem Ort
- `Batch`: Charge und Ablaufdatum
- `Movement`: Zugang, Abgang, Umbuchung, Korrektur

## UX-Prinzipien

- Erfassung mit moeglichst wenig Taps
- grosse Touch-Ziele
- letzte Werte und Favoriten wiederverwendbar
- Suche immer sichtbar
- Mengenbuchung ohne komplexe Formulare
