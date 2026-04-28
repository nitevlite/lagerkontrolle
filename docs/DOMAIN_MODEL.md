# Domain Model

## Struktur

- `Location`: ein Ort wie `Teelager`
- `StorageSlot`: optionales nummeriertes Regal, Fach oder eine Lade innerhalb eines Orts
- `StorageSlot.kind`: frei definierbarer Slot-Typ wie `Regal`, `Lade`, `Kiste`
- `Item`: ein Artikel, Gebinde, Gefaess oder Verbrauchsmaterial
- `Item.preferredLocationId`: bevorzugter Standard-Ort fuer schnellere Buchung
- `Item.lowStockThreshold`: Schwellwert, ab dem der Bestand als niedrig gilt
- `UnitType`: frei definierbare Einheit wie `Stk`, `Kiste`, `Flasche`
- `Batch`: Charge mit Ablaufdatum; falls kein Chargencode vorhanden ist, wird intern `Keine Charge` verwendet
- `Movement`: Zugang, Abgang, Umbuchung oder Korrektur
- `StockSnapshot`: abgeleiteter aktueller Bestand je Ort, optionalem Slot, Artikel und Charge
- `AppSettings`: globale Warnfenster, Wiedervorlage, Favoriten und freie Slot-Typen

## Wichtige Regeln

- Ein `StorageSlot` gehoert genau zu einem `Location`, ist fuer Buchungen aber optional
- Slot-Typen sind nicht fest verdrahtet, sondern ueber Einstellungen pflegbar
- Ein `Item` kann direkt an einem Ort oder genauer in mehreren Slots liegen
- Jedes `Item` referenziert genau einen `UnitType`
- Ein `Item` kann einen bevorzugten Ort fuer schnellere Auswahl im Buchungsflow haben
- Ein `Item` kann einen eigenen Mindestbestand fuer Warnungen haben
- Ablaufdatum und Charge sind fuer fast alle Artikel relevant; der Chargencode kann bewusst als nicht vorhanden markiert werden
- Bestand wird bevorzugt aus `Movement` berechnet
- Umbuchung ist fachlich zwei Bewegungen mit gemeinsamer Referenz
- Warnungen vor Ablauf nutzen ein globales Standardfenster und eine globale Wiedervorlage

## Beispiel

Ort: `Teelager`  
Slot: `Regal 3` oder `Ohne Slot`  
Artikel: `Kamillentee 20er`  
Charge: `KT-2026-04` oder `Keine Charge`  
Ablaufdatum: `2027-04-30`

Moegliche Bewegungen:

- `+24 Packungen`
- `-3 Packungen`
- `Umbuchung nach Lade 2` oder direkt zu einem anderen Ort
