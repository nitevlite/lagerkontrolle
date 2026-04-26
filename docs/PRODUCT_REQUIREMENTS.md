# Produktanforderungen

## Problem

Material und Produkte liegen an vielen Orten. Der aktuelle Bestand ist schwer sichtbar, Aenderungen gehen schnell verloren, und Ablaufdaten werden zu spaet bemerkt.

## Ziel

Eine mobile App, mit der Mitarbeitende Lagerorte und Inhalte in Sekunden pflegen koennen, auch ohne Internet, und die Aenderungen spaeter zwischen mehreren Geraeten synchronisiert.

## Hauptobjekte

- Ort
- Regal oder Lade
- Artikel
- Einheitentyp
- Charge
- Bestand
- Bestandsbewegung
- Ablaufdatum

## Muss-Anforderungen fuer MVP

- Orte anlegen und bearbeiten
- Regale oder Laden je Ort nummeriert anlegen und bearbeiten
- Artikel frei und schnell anlegen
- neue Einheitentypen frei anlegen und verwenden
- Mengen je Ort verwalten
- Zu- und Abgaenge buchen
- Umbuchungen zwischen Orten buchen
- Ablaufdatum und Charge fuer fast alle Artikel pflegen
- Vorwarnung vor Ablauf vor dem eigentlichen Ablaufdatum, Standard `10 Tage vorher`
- Wiedervorlage nach Warnung in konfigurierbarem Abstand
- Filter auf Artikel oder Chargen, die in einem Zeitraum ablaufen
- Suche ueber Orte und Artikel
- offline nutzbar
- Barcode- oder QR-Scan
- Synchronisation zwischen mehreren Geraeten
- frueh testbares mobiles Frontend
- Dashboard mit Warnungen und Auswertung

## Soll-Anforderungen

- Favoriten und letzte Eingaben
- konfigurierbare Warnhinweise fuer kritische Ablaufdaten
- Export als CSV
- einfache Inventuransicht
- Excel-Import vorhandener Listen

## Nicht-Ziele fuer den Start

- ERP-Ersatz
- komplexe Einkaufslogik
- tiefe Rollenmodelle
- aufwendige Freigabeprozesse
