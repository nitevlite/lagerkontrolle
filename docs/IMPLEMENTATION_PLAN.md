# Implementierungsplan

## Ziel

Wir liefern zuerst ein testbares mobiles Frontend und bauen darauf das echte Offline- und Sync-Modell auf. So kannst du frueh Bedienung und Geschwindigkeit pruefen, bevor wir uns in technische Tiefe verlieren.

## Reihenfolge

### 1. Sichtbarer Frontend-Stand

- PWA-Projekt aufsetzen
- mobile Navigation und Grundlayout bauen
- Startseite, Dashboard, Ortsliste, Ort-Detail und Schnellbuchung als klickbaren Flow bereitstellen
- Demo-Daten hinterlegen
- Screens fuer Einheitentypen und Ablaufwarnungen sichtbar vorbereiten

Ergebnis: Du kannst die App sofort am Handy oeffnen und UX testen.
Status: erster Shell-Stand ist umgesetzt.

### 2. Fachliches Datenmodell

- Entitaeten fuer Ort, Regal oder Lade, Artikel, Einheitentyp, Charge und Bewegung umsetzen
- Bestandsberechnung aus Bewegungen ableiten
- lokale Speicherung anbinden

Ergebnis: Das Modell ist robust genug fuer Ablaufdaten, Historie und Sync.
Status: umgesetzt.

### 3. Kernworkflows

- Ort anlegen
- Regal oder Lade nummerieren
- Artikel anlegen
- neue Einheitentypen anlegen
- Zugang, Abgang und Umbuchung buchen
- Ablaufdatum und Charge mitfuehren
- Ablaufwarnungen im Alltag sichtbar machen

Ergebnis: Der eigentliche Arbeitsalltag ist digital abbildbar.
Status: Orte, Slots, Artikel und Chargen sind als erste CRUD-Stufe sichtbar; Buchungsflow folgt als Naechstes.

### 4. Scan-Flow

- Kamera-Zugriff integrieren
- Barcode- und QR-Erkennung anbinden
- Scan in Artikelsuche und Buchungsflow einhaengen

Ergebnis: Artikel koennen schneller gefunden oder gebucht werden.

### 5. Mehrgeraete-Sync

- CouchDB-Server anbinden
- Replikation aus dem Geraet konfigurieren
- Konfliktstrategie ueber Bewegungen und Zeitstempel festlegen
- Synchronisation zwischen zwei Testgeraeten pruefen

Ergebnis: Mehrere Nutzer koennen denselben Bestand bearbeiten.

### 6. Pilot-Haertung

- Demo-Daten durch echte Strukturen ersetzen
- Performance, Offline-Verhalten und Scan-Zuverlaessigkeit pruefen
- Formularschritte reduzieren
- Importpfad fuer spaetere Excel-Dateien vorbereiten, sobald Quelldateien vorliegen

Ergebnis: Das MVP ist bereit fuer den echten Einsatz.

## GitHub-Tickets in Umsetzungsreihenfolge

1. `#6` Mobile-first PWA shell and clickable demo frontend
2. `#10` Define domain model for locations, shelves and movement-based stock
3. `#5` Add local offline database and repositories
4. `#2` Implement location and slot management flows
5. `#3` Implement item, batch and expiry management
6. `#1` Build fast stock booking and transfer workflows
7. `#9` Add barcode and QR scanning to search and booking
8. `#7` Add search, filters, favorites and recent actions
9. `#8` Add multi-device sync with self-hosted CouchDB
10. `#4` Pilot hardening, import preparation and production checklist
11. `#11` Add charts to analytics dashboard
12. `#12` UI 01: Dashboard and analytics cleanup
13. `#13` UI 02: Custom slot types and unit cleanup
14. `#14` UI 03: Item list and mobile editor refinement
15. `#15` UI 04: Booking simplification and active scanner

## Technische Leitlinien

- mobile-first statt Desktop-first
- offline zuerst, Sync danach automatisch
- moeglichst wenige Taps pro Buchung
- keine komplizierten Pflichtfelder im Standardflow
- jede Aenderung nachvollziehbar ueber Bewegungen

## Aktueller Status

- `#6` ist umgesetzt
- `#10` ist im Code umgesetzt
- `#5` ist im Code umgesetzt
- `#2` ist umgesetzt: Orte, Slots und freie Slot-Typen sind mobil pflegbar
- `#3` ist umgesetzt: Artikel, bevorzugter Ort, Chargen und Ablaufdaten sind im mobilen Editor drin
- Mindestbestand pro Artikel ist im Datenmodell und Editor enthalten
- `#1` ist umgesetzt: Zugang, Abgang, Umbuchung und Korrektur speichern echte lokale Bewegungen
- der Buchungsflow ist weiter verdichtet: Artikel und Ort werden direkt in den Buchungsdaten ausgewaehlt
- Zugang kann direkt neue Artikel anlegen und ohne Seitensprung einbuchen
- der UX-Kurs ist jetzt klar: Listen mit Filter plus separater Detailscreen statt ueberladener Sammelseiten
- `#7` ist umgesetzt: Favoriten, Suche, Filter und zuletzt genutzte Elemente beschleunigen Dashboard und Buchung
- `#9` ist umgesetzt: Scan ist aktiv, mit manueller Eingabe als Browser-Fallback
- `#11` ist umgesetzt: mobile Charts fuer Bewegungen, Ablauf-Verteilung sowie Top-Orte und Top-Artikel
- `#12` bis `#15` sind umgesetzt: Dashboard und Analyse wurden gestrafft, Slot-Typen und Einheiten pflegbar gemacht, Artikel-Listen verbessert und die Buchung vereinfacht
