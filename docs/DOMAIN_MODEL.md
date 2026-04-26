# Domain Model

## Struktur

- `Location`: ein Ort wie `Teelager`
- `StorageSlot`: ein nummeriertes Regal oder eine Lade innerhalb eines Orts
- `Item`: ein Artikel, Gebinde, Gefaess oder Verbrauchsmaterial
- `UnitType`: frei definierbare Einheit wie `Stk`, `Kiste`, `Flasche`
- `Batch`: Charge mit Ablaufdatum
- `Movement`: Zugang, Abgang, Umbuchung oder Korrektur
- `StockSnapshot`: abgeleiteter aktueller Bestand je Slot, Artikel und Charge

## Wichtige Regeln

- Ein `StorageSlot` gehoert genau zu einem `Location`
- Ein `Item` kann an mehreren Slots liegen
- Jedes `Item` referenziert genau einen `UnitType`
- Ablaufdatum und Charge sind fuer fast alle Artikel relevant
- Bestand wird bevorzugt aus `Movement` berechnet
- Umbuchung ist fachlich zwei Bewegungen mit gemeinsamer Referenz

## Beispiel

Ort: `Teelager`  
Slot: `Regal 3`  
Artikel: `Kamillentee 20er`  
Charge: `KT-2026-04`  
Ablaufdatum: `2027-04-30`

Moegliche Bewegungen:

- `+24 Packungen`
- `-3 Packungen`
- `Umbuchung nach Lade 2`
