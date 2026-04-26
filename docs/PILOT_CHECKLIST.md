# Pilot-Checkliste

## Vor dem Testbetrieb

- `npm run build` läuft fehlerfrei
- GitHub Pages oder ein anderer HTTPS-Host ist eingerichtet
- Testorte, Slot-Typen, Artikel und Einheiten sind angelegt
- Ablaufwarnung und Wiedervorlage sind fachlich gesetzt
- Mindestbestände pro kritischem Artikel sind gepflegt

## Auf Testgeräten prüfen

- Handy und Tablet öffnen die App korrekt
- Navigation blendet beim Scrollen sinnvoll aus und wieder ein
- Buchung für Zugang, Abgang, Umbuchung und Korrektur funktioniert
- Kamera-Scan funktioniert auf Zielgeräten oder der manuelle Fallback ist akzeptabel
- Dashboard, Orte, Artikel und Analyse sind mobil lesbar

## Betriebsrisiken aktuell

- Kein Geräte-Sync zwischen mehreren Handys
- Kein echter Backup-/Restore-Flow im UI
- Kein Excel-Import im Produktivfluss
- Lokale Daten hängen am jeweiligen Browser-Speicher

## Go-Live nur für Pilot

Aktueller Stand ist geeignet für Einzelgerät- oder kontrollierte Testläufe. Für echten Mehrnutzerbetrieb muss zuerst Ticket `#8` umgesetzt werden.
