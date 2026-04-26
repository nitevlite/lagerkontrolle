# Datenspeicherung

## Wo die Daten liegen

Die App speichert aktuell alles lokal im Browser des jeweiligen Geräts in `IndexedDB` über `Dexie`.

Betroffen sind unter anderem:

- Orte
- Slots
- Artikel
- Chargen
- Bewegungen
- Einstellungen, Favoriten und Warnwerte

## Was das praktisch bedeutet

- Jedes Handy, Tablet oder jeder Browser hat seinen eigenen Datenstand.
- Ein zweites Handy sieht nicht automatisch die Daten vom ersten Handy.
- Eine installierte PWA nutzt denselben lokalen Speicher wie die Website in diesem Browser-Kontext.

## Wann Daten verloren gehen können

Die lokalen Daten können verschwinden, wenn:

- Browser-Sitedaten gelöscht werden
- der Browser komplett zurückgesetzt wird
- die App in einem anderen Browser geöffnet wird
- ein anderes Gerät verwendet wird

## Aktueller Sync-Stand

Mehrgeräte-Synchronisation ist noch offen. Dafür ist ein zentraler Server nötig, zum Beispiel `CouchDB`, plus Replikation zwischen Geräten. Bis das eingebaut ist, ist die App technisch `offline-first`, aber noch nicht `shared-data-first`.
