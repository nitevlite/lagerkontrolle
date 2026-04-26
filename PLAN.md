# Umsetzungsplan Lagerkontrolle

## Zielbild

Wir bauen zuerst ein extrem schnelles MVP fuer mobile Erfassung. Prioritaet haben Bediengeschwindigkeit, Offline-Faehigkeit, klare Lagerorte mit Regalen oder Laden, Scan-Unterstuetzung, Ablaufdaten und direkte Synchronisation zwischen mehreren Geraeten.

## Phase 1: Sichtbares Frontend und Grundnavigation

- PWA-Grundgeruest mit mobiler UI aufsetzen
- Startseite, Ortsliste und Artikelliste klickbar machen
- Demo-Daten anzeigen, damit du frueh am Handy testen kannst
- Installierbarkeit und Offline-Start pruefen

## Phase 2: Fachliches Modell und lokale Daten

- Datenmodell fuer Ort, Regal oder Lade, Artikel, Charge und Bewegung festziehen
- Einheitentypen als frei pflegbare Stammdaten modellieren
- lokale Datenbank anbinden
- Orte, Regale oder Laden und Artikel anlegen
- Bestandsbewegungen als Historie statt nur als Direktwert speichern

## Phase 3: Kernworkflows

- schnelle Buchung fuer Zugang, Abgang und Umbuchung
- Ablaufdaten und Chargen erfassen
- Vorwarnungen vor Ablauf konfigurieren und anzeigen
- Suche, Filter, Favoriten und letzte Aktionen einbauen
- Scan-Flow fuer Barcode oder QR integrieren
- Dashboard mit Kennzahlen und kritischen Listen aufbauen

## Phase 4: Synchronisation im MVP

- self-hosted Sync-Schicht anbinden
- Nutzerkennung und Konfliktstrategie definieren
- Datenaustausch zwischen zwei Geraeten pruefen
- Offline-Aenderungen spaeter sauber zusammenfuehren

## Phase 5: Praxistest im Betrieb

- echte Lagerorte erfassen
- erste echte Artikelstammdaten uebernehmen
- 3 bis 5 typische Arbeitsablaeufe testen
- Eingabeschritte kuerzen und Fehlerquellen beseitigen

## Phase 6: Erweiterungen

- Excel-Import, sobald echte Quelldateien vorliegen
- Warnungen fuer Mindestbestand und Ablaufdatum
- Inventurmodus
- Export und Auswertungen

## Erfolgsmetriken

- Standardbuchung in unter 10 Sekunden
- Neue Position in unter 20 Sekunden anlegbar
- volle Nutzbarkeit ohne Internet
- Scan zu Treffer in wenigen Sekunden
- Aenderungen zwischen mehreren Geraeten synchronisiert
- klare Sicht auf kritische Ablaufdaten und Fehlbestaende
