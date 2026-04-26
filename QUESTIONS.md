# Offene Fragen

Die Grundrichtung ist geklaert. Diese Detailfragen bleiben noch offen:

1. Sollen Mengen nur ganzzahlig sein oder auch Dezimalwerte wie `1,5` erlauben?
2. Brauchst du Fotos fuer Artikel oder Orte schon im MVP?
3. Soll die App im MVP auch bequem am PC im Browser nutzbar sein?
4. Sind Mindestbestaende schon im MVP wichtig oder erst spaeter?
5. Brauchst du einen Inventurmodus im MVP oder reicht normale Bestandsbuchung?
6. Sollen mehrere Nutzer nur synchronisieren oder auch eigene Rollen und Rechte bekommen?
7. Wie soll ein Artikel identifiziert werden, wenn kein Barcode vorhanden ist?
8. Soll die Ablaufwarnung fix sein oder pro Artikel einstellbar, z. B. `30 Tage vorher`?
9. Welche Kennzahlen willst du im Dashboard sicher sehen, z. B. Gesamtbestand, kritische Chargen, Bewegungen heute?

## Bereits entschieden

- Struktur: `Ort -> Regal oder Lade`
- eine Person zuerst, spaeter mehrere
- Synchronisation direkt im MVP
- Barcode- oder QR-Scan direkt im MVP
- Ablaufdaten fuer fast alle Artikel wichtig
- Excel-Import spaeter vorgesehen
- mobile-first PWA mit frueh sichtbarem Frontend
- Einheitentypen frei anlegbar
- Dashboard und Ablaufwarnungen Teil des Zielbilds
