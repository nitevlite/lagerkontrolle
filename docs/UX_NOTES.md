# UX Notes

## Dinge, die wir zwingend beachten sollten

- Die haeufigste Aktion muss in wenigen Taps funktionieren: Ort waehlen, Artikel waehlen oder scannen, Menge buchen.
- Dashboard darf nicht nur schoen sein, sondern muss Entscheidungen beschleunigen: kritische Ablaufdaten, niedrige Bestaende und aktivste Orte.
- Warnungen vor Ablauf muessen vor dem eigentlichen Verfall sichtbar werden, nicht erst am Stichtag. Standard ist `31 Tage vorher`.
- Nach einer Warnung braucht es eine Wiedervorlage in `14 Tagen`, damit kritische Ware nicht einmal aufpoppt und dann vergessen wird.
- Einheitentypen duerfen nicht hart codiert sein. Neue Typen wie `Sack`, `Dose` oder `Tray` muessen direkt anlegbar sein.
- Einheitentypen brauchen eine eigenstaendige, kompakte Liste ohne grosse Badges; Loeschen gehoert als kleines Icon rechts neben den Namen.
- Die Buchung bleibt bewusst kurz: keine Chargenauswahl, keine Chargencode-Umschaltung, kein Ablauf-Schalter beim schnellen neuen Artikel, keine redundante Zusammenfassung unter der Menge, Bestand klar vor den Buchungsdaten. Beim schnellen neuen Artikel gilt die Reihenfolge Name, Menge, Einheit, Ablaufdatum, Barcode; Ort, Slot und Charge gehoeren in `Weitere Einstellungen`.
- Im Dashboard stehen Ablauf-Filter und niedrige Bestaende vor den weiteren Kennzahlen, weil sie die dringendsten operativen Entscheidungen steuern.
- Administrative Funktionen wie Sync, lokale Daten, Backup, Restore und Export gehoeren in `Einstellungen`, nicht ins operative Dashboard.
- Verwaltungslisten in `Einstellungen`, besonders Slot-Typen, muessen dichter sein als operative Kartenlisten.
- Im Ort-Editor stehen Scan-Aktionen zuerst; `Slot hinzufuegen` gehoert in den Slots-Bereich und `Ort loeschen` ans Seitenende.
- Scan braucht immer einen Fallback, falls Kamera, Licht oder Barcode schlecht sind.
- Der Scanner soll QR-Codes, typische Barcode-Formate, die Rueckkamera, leichten Zoom und verfuegbare Fokusoptionen bevorzugen, damit Barcodes am Handy scharf erkannt werden.
- Sync muss auch bei schwacher Verbindung robust bleiben und dem Nutzer klar zeigen, ob Daten sicher uebertragen wurden.
- Listenansichten brauchen starke Suche, grosse Touch-Ziele und klar getrennte Kennzahlen. Handy-Bedienung ist kein verkleinerter Desktop.
- Im Frontend keine Erklaertexte an jede Ecke haengen. Die Oberflaeche muss auch ohne lange Hinweise klar bedienbar sein.
- Excel-Import erst umsetzen, wenn echte Beispieldateien da sind. Sonst bauen wir blind am falschen Schema.

## Sinnvolle Dashboard-Bausteine

- kritische Chargen mit Resttagen
- Chargen im Filterzeitraum, z. B. `naechste 10 Tage` oder `naechste 30 Tage`
- Bestand pro Ort
- zuletzt geaenderte Artikel
- stark ausgelastete Orte oder Regale
- offene Sync-Hinweise
- spaeter: Verbrauchstrends und Inventurabweichungen
