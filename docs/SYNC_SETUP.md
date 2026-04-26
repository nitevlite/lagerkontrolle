# Sync-Setup mit CouchDB

## Ziel

Mehrere Handys oder Tablets sollen denselben Datenbestand verwenden und Änderungen nach Offline-Phasen wieder zusammenführen.

## Benötigt

- ein erreichbarer `CouchDB`-Server
- eine Datenbank, zum Beispiel `lagerkontrolle`
- CORS für die App-URL

## Minimale CouchDB-Vorbereitung

1. CouchDB installieren oder hosten.
2. Einen Benutzer mit Schreibrechten anlegen.
3. Eine Datenbank `lagerkontrolle` anlegen oder von der App anlegen lassen.
4. In CouchDB CORS aktivieren:
   - `origins`: die App-URL, z. B. `https://nitevlite.github.io`
   - `credentials`: `true`
   - `methods`: `GET, PUT, POST, OPTIONS`
   - `headers`: `accept, authorization, content-type, origin, referer`

## Eintragen in der App

Im `Dashboard` im Block `Sync` eintragen:

- `CouchDB-URL`
- `Datenbank`
- `Benutzer`
- `Passwort`
- `Gerätename`
- `Sync aktiv = Ja`

Dann:

1. `Sync speichern`
2. `Jetzt synchronisieren`

## Konfliktstrategie

- `Movement`-Datensätze sind append-only und werden über ihre ID zusammengeführt.
- Stammdaten wie `Location`, `Slot`, `Item`, `Batch`, `UnitType` und `Settings` nutzen aktuell `Last write wins` über `updatedAt`.
- Löschungen werden als Tombstone synchronisiert.

## Test mit zwei Geräten

1. Gerät A mit CouchDB verbinden und synchronisieren.
2. Gerät B mit denselben CouchDB-Daten verbinden und synchronisieren.
3. Auf Gerät A einen neuen Artikel oder eine Buchung anlegen.
4. Auf Gerät B `Jetzt synchronisieren`.
5. Prüfen, ob Artikel, Chargen oder Bewegungen auftauchen.
6. Danach den Gegenweg wiederholen.

## Grenzen des aktuellen Stands

- Passwort liegt lokal im IndexedDB-Speicher dieses Geräts.
- Die Konfliktregel ist bewusst pragmatisch und noch nicht für komplexe Parallelbearbeitung optimiert.
- Für echten Betrieb mit mehreren Personen sollte CouchDB vorab mit echten Gerätetests geprüft werden.
