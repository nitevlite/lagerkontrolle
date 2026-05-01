# UX Notes

## Dinge, die wir zwingend beachten sollten

- Die haeufigste Aktion muss in wenigen Taps funktionieren: Ort waehlen, Artikel waehlen oder scannen, Menge buchen.
- Dashboard darf nicht nur schoen sein, sondern muss Entscheidungen beschleunigen: kritische Ablaufdaten, niedrige Bestaende, letzte Bewegungen, aktivste Orte.
- Warnungen vor Ablauf muessen vor dem eigentlichen Verfall sichtbar werden, nicht erst am Stichtag. Standard ist `10 Tage vorher`.
- Nach einer Warnung braucht es eine Wiedervorlage in `X Tagen`, damit kritische Ware nicht einmal aufpoppt und dann vergessen wird.
- Einheitentypen duerfen nicht hart codiert sein. Neue Typen wie `Sack`, `Dose` oder `Tray` muessen direkt anlegbar sein.
- Einheitentypen brauchen eine eigenstaendige, gut scanbare Liste statt einer engen Verwaltungsansicht.
- Die Buchung bleibt bewusst kurz: keine Chargenauswahl, keine Chargencode-Umschaltung, keine redundante Zusammenfassung unter der Menge, Bestand klar vor den Buchungsdaten, Menge vor Ort und optionalem Slot.
- Administrative Funktionen wie Sync, lokale Daten, Backup, Restore und Export gehoeren in `Einstellungen`, nicht ins operative Dashboard.
- Im Ort-Editor soll `Slot hinzufuegen` als klare Aktion neben dem Speichern stehen; `Ort loeschen` gehoert ans Seitenende.
- Scan braucht immer einen Fallback, falls Kamera, Licht oder Barcode schlecht sind.
- Der Scanner soll die Rueckkamera und verfuegbare Fokusoptionen bevorzugen, damit Barcodes am Handy scharf erkannt werden.
- Sync muss auch bei schwacher Verbindung robust bleiben und dem Nutzer klar zeigen, ob Daten sicher uebertragen wurden.
- Listenansichten brauchen starke Suche, grosse Touch-Ziele und klar getrennte Kennzahlen. Handy-Bedienung ist kein verkleinerter Desktop.
- Im Frontend keine Erklaertexte an jede Ecke haengen. Die Oberflaeche muss auch ohne lange Hinweise klar bedienbar sein.
- Excel-Import erst umsetzen, wenn echte Beispieldateien da sind. Sonst bauen wir blind am falschen Schema.

## Sinnvolle Dashboard-Bausteine

- kritische Chargen mit Resttagen
- Chargen im Filterzeitraum, z. B. `naechste 10 Tage` oder `naechste 30 Tage`
- heute gebuchte Bewegungen
- Scans heute
- Bestand pro Ort
- zuletzt geaenderte Artikel
- stark ausgelastete Orte oder Regale
- offene Sync-Hinweise
- spaeter: Verbrauchstrends und Inventurabweichungen
