# MVP Backlog

## P0

- Projektgeruest fuer PWA aufsetzen
- klickbares mobiles Frontend auf echte lokale Daten umstellen
- Datenmodell fuer Ort, Regal oder Lade, Artikel, Bestand und Bewegung anlegen
- Einheitentypen anlegen und verwalten
- Ort anlegen und bearbeiten
- Regal oder Lade pro Ort anlegen und nummerieren
- Artikel anlegen und bearbeiten
- Bestandsbewegung `+` und `-`
- Umbuchung zwischen Orten
- Synchronisation zwischen mehreren Geraeten
- Barcode- oder QR-Scan
- Ablaufdaten und Chargen
- Ablaufwarnungen vor Verfall
- Dashboard mit wichtigsten Kennzahlen und Warnlisten
- Suche und Filter
- Offline-Speicherung

## P1

- Favoriten und letzte Eingaben
- Warnliste fuer kritische Ablaufdaten
- CSV-Export fuer aktuellen Bestand
- Startbildschirm mit wichtigsten Orten
- Konfliktanzeige oder Konfliktloesung fuer Sync
- Charts fuer Analyse und Trends
- JSON-Backup-Export und Restore im UI

## P2

- einfache Benutzerverwaltung
- Inventurmodus
- Excel-Import
- QR-Code-Druck fuer Orte und Slots

## Umgesetzt

- Buchungsmaske ohne Chargenauswahl und ohne Mengen-Zusammenfassung gestrafft
- Bestand als eigene Section oberhalb der Buchungsdaten angezeigt
- Ort-Editor mit `Slot hinzufuegen` statt dauerhaft sichtbarer Slot-Typ-Verwaltung umgesetzt
- Sync, lokale Daten, Backup, Restore und Export in eigenen Tab `Einstellungen` verschoben
- Scanner-Fokus fuer Handy-Kameras verbessert
- Einheitenliste visuell neu und besser scanbar gestaltet
- Slot-Karten im Ort-Editor und Artikelliste fuer Handy-Ansicht verbessert
- Chargencode-Umschaltung aus den Buchungsdaten entfernt
- Buchungsdaten weiter verdichtet: Mindestbestand beim schnellen neuen Artikel entfernt, Orts- und Slot-Auswahl unter die Menge geschoben und kompakter gestaltet
- Einheitenliste ohne linke Badges mit kleinem Loesch-Icon rechts umgesetzt, Bewegungen in Analyse als horizontale Balken dargestellt und Slot-Typen kompakter gemacht
- Buchungsdaten erneut sortiert: Barcode steht beim schnellen neuen Artikel direkt unter dem Namen, Chargencode und optionales Ablaufdatum stehen unter Slot optional, ein leeres Ablaufdatum speichert neue Artikel ohne Ablauf, und das Dashboard priorisiert Ablauf-Filter vor niedrigen Bestaenden.
