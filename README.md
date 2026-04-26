# Lagerkontrolle

Offline-first Lager- und Standortverwaltung fuer Handy und Tablet. Die App soll Lagerorte, variable Bestandsarten, Ablaufdaten und schnelle Bestandsbewegungen ohne komplizierte Eingabemasken abbilden.

## Produktziel

Mitarbeitende sollen in wenigen Sekunden sehen und erfassen koennen:

- Wo etwas liegt
- Was dort liegt
- Wie viel davon vorhanden ist
- Welche Chargen oder Ablaufdaten kritisch werden

## Empfohlener Ansatz

Empfehlung fuer das MVP:

- Installierbare Progressive Web App (PWA)
- Lokal-first Datenhaltung fuer Offline-Nutzung
- Spaeter optional als Android-App per Capacitor verpacken

Warum das sinnvoll ist:

- komplett kostenlos und Open Source umsetzbar
- laeuft auf Handy und Tablet
- offline faehig
- schnelle Weiterentwicklung ohne App-Store-Zwang

## Kernfunktionen fuer MVP

- Orte und Unterorte anlegen
- Artikel, Behaelter, Gebinde und Verbrauchsmaterial erfassen
- Mengen schnell buchen: `+`, `-`, Umbuchung
- Ablaufdaten und Chargen verwalten
- Favoriten, letzte Eintraege und schnelle Wiederholung
- Suche und Filter nach Ort, Artikel, Status

## Dokumente in diesem Repo

- `PLAN.md`: Phasenplan
- `QUESTIONS.md`: offene Fachfragen
- `docs/PRODUCT_REQUIREMENTS.md`: Anforderungen
- `docs/ARCHITECTURE.md`: Technikvorschlag
- `docs/BACKLOG.md`: priorisierte MVP-Arbeit

## Naechster technischer Schritt

Nach Klaerung der offenen Fachfragen wird das Grundgeruest fuer die PWA aufgesetzt: UI, Offline-Speicher, Standortmodell und schnelle Bewegungsbuchung.
