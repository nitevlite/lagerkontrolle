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

## Lokale Daten zurücksetzen

In der App kann unter `Dashboard -> Lokale Daten -> Lokale Daten löschen` der lokale Bestand dieses Geräts gelöscht werden. Dabei werden Orte, Slots, Artikel, Chargen und Bewegungen entfernt. Standard-Einheiten und Slot-Typen werden neu angelegt.

Ein normales App-Update löscht lokale Daten nicht automatisch. Bereits weitergegebene Handys behalten ihren lokalen Datenstand, bis er dort manuell gelöscht wird.

Unter `Dashboard -> Lokale Daten` kann außerdem ein JSON-Backup exportiert und wieder importiert werden. Der CSV-Export ist für den aktuellen Bestand gedacht und nicht als Wiederherstellungsformat.

## Aktueller Sync-Stand

Mehrgeräte-Synchronisation ist jetzt für `CouchDB` vorbereitet. Dafür wird ein zentraler Server benötigt, und jedes Gerät synchronisiert seine lokalen Daten per Pull/Push. Ohne konfigurierte CouchDB bleibt die App weiter rein lokal.
