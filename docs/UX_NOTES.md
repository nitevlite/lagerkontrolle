# UX Notes

## Dinge, die wir zwingend beachten sollten

- Die haeufigste Aktion muss in wenigen Taps funktionieren: Ort waehlen, Artikel waehlen oder scannen, Menge buchen.
- Dashboard darf nicht nur schoen sein, sondern muss Entscheidungen beschleunigen: kritische Ablaufdaten, niedrige Bestaende, letzte Bewegungen, aktivste Orte.
- Warnungen vor Ablauf muessen vor dem eigentlichen Verfall sichtbar werden, nicht erst am Stichtag.
- Einheitentypen duerfen nicht hart codiert sein. Neue Typen wie `Sack`, `Dose` oder `Tray` muessen direkt anlegbar sein.
- Scan braucht immer einen Fallback, falls Kamera, Licht oder Barcode schlecht sind.
- Sync muss auch bei schwacher Verbindung robust bleiben und dem Nutzer klar zeigen, ob Daten sicher uebertragen wurden.
- Listenansichten brauchen starke Suche und grosse Touch-Ziele. Handy-Bedienung ist kein verkleinerter Desktop.
- Excel-Import erst umsetzen, wenn echte Beispieldateien da sind. Sonst bauen wir blind am falschen Schema.

## Sinnvolle Dashboard-Bausteine

- kritische Chargen mit Resttagen
- heute gebuchte Bewegungen
- Bestand pro Ort
- zuletzt geaenderte Artikel
- offene Sync-Hinweise
- spaeter: Verbrauchstrends und Inventurabweichungen
