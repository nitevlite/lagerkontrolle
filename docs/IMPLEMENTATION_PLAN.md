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
- `#2` ist weitgehend umgesetzt und muss nur noch gegen echte Buchungen verifiziert werden
- `#3` ist im Frontend gestartet: Artikel bearbeiten und Chargen pflegen sind bereits drin
- `#1` ist deutlich weiter: Aktion, Artikel, Ort, Slot, Charge und Menge sind als echter Flow sichtbar und speichern lokale Bewegungen
- der UX-Kurs ist jetzt klar: Listen mit Filter plus separater Detailscreen statt ueberladener Sammelseiten
- `#7` ist gestartet: Favoriten sind persistent, zuletzt genutzte Elemente werden fuer Dashboard und Buchung priorisiert
- `#11` ist als eigenes Analyse-Ticket angelegt
