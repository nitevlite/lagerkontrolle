# Import-Zielformat

## Zweck

Sobald die ersten Excel-Dateien vorliegen, sollen sie auf ein klares Zielschema abgebildet werden. Dieses Dokument definiert das Format vorab.

## Empfohlene Spalten

Pflicht:

- `ort_name`
- `slot_typ`
- `slot_nummer`
- `artikel_name`
- `einheit_name`
- `einheit_code`
- `menge`

Optional:

- `barcode`
- `charge_code`
- `ablaufdatum`
- `mindestbestand`
- `bevorzugter_ort`

## Regeln

- `ablaufdatum` im Format `YYYY-MM-DD`
- `menge` als Zahl ohne Einheit im Feld
- `slot_typ` frei, aber konsistent, z. B. `Regal`, `Lade`
- `mindestbestand` als Zahl pro Artikel
- gleiche Artikelnamen sollen auch gleiche Einheiten meinen

## Beispiel

```text
ort_name,slot_typ,slot_nummer,artikel_name,einheit_name,einheit_code,menge,barcode,charge_code,ablaufdatum,mindestbestand
Teelager,Regal,3,Kamillentee 20er,Packung,Pkg,24,900001,KT-2027-04,2027-04-30,10
```
