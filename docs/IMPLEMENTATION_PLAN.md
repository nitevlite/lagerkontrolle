# Implementierungsplan

## Ziel

Wir liefern zuerst ein testbares mobiles Frontend und bauen darauf das echte Offline- und Sync-Modell auf. So kannst du frueh Bedienung und Geschwindigkeit pruefen, bevor wir uns in technische Tiefe verlieren.

## Reihenfolge

### 1. Sichtbarer Frontend-Stand

- PWA-Projekt aufsetzen
- mobile Navigation und Grundlayout bauen
- Startseite, Ortsliste, Ort-Detail und Schnellbuchung als klickbaren Flow bereitstellen
- Demo-Daten hinterlegen

Ergebnis: Du kannst die App sofort am Handy oeffnen und UX testen.

### 2. Fachliches Datenmodell

- Entitaeten fuer Ort, Regal oder Lade, Artikel, Charge und Bewegung umsetzen
- Bestandsberechnung aus Bewegungen ableiten
- lokale Speicherung anbinden

Ergebnis: Das Modell ist robust genug fuer Ablaufdaten, Historie und Sync.

### 3. Kernworkflows

- Ort anlegen
- Regal oder Lade nummerieren
- Artikel anlegen
- Zugang, Abgang und Umbuchung buchen
- Ablaufdatum und Charge mitfuehren

Ergebnis: Der eigentliche Arbeitsalltag ist digital abbildbar.

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
- Importpfad fuer spaetere Excel-Dateien vorbereiten

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

## Technische Leitlinien

- mobile-first statt Desktop-first
- offline zuerst, Sync danach automatisch
- moeglichst wenige Taps pro Buchung
- keine komplizierten Pflichtfelder im Standardflow
- jede Aenderung nachvollziehbar ueber Bewegungen
