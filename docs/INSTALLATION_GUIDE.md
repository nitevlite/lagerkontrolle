# Installationsanleitung

## 1. Schnelltest im gleichen WLAN

1. Auf dem Rechner im Repo `npm install` und danach `npm run dev` starten.
2. Die lokale IP des Rechners verwenden, zum Beispiel `http://192.168.1.105:5174/`.
3. Auf dem zweiten Handy genau diese `http://`-Adresse im Browser öffnen.
4. Das ist nur ein Testmodus. Die App wird dabei nicht sauber verteilt und die Daten bleiben nur auf diesem Gerät.

## 2. Saubere Installation auf einem anderen Handy

Empfohlen ist GitHub Pages, weil die App dann über `https` läuft und als PWA installierbar ist.

1. Im GitHub-Repo unter `Settings -> Pages` als Quelle `GitHub Actions` wählen.
2. Auf `main` pushen. Der Workflow `.github/workflows/deploy-pages.yml` baut und veröffentlicht die App automatisch.
3. Danach ist die App unter `https://nitevlite.github.io/lagerkontrolle/` erreichbar.
4. Auf dem anderen Handy diese URL in Chrome oder Safari öffnen.
5. Android: Browser-Menü -> `Zum Startbildschirm hinzufügen` oder `App installieren`.
6. iPhone/iPad: Teilen -> `Zum Home-Bildschirm`.

## 3. Update auf anderen Geräten

- Bei jedem Push auf `main` wird GitHub Pages neu gebaut.
- Die PWA lädt den neuen Stand beim nächsten Öffnen oder Reload.
- Wenn ein Gerät einen alten Stand zeigt: Browser-Tab schließen und die App neu öffnen.
- Ein Update löscht lokale Daten auf dem Handy nicht automatisch.
- Testdaten aus einer alten Installation können in der App unter `Dashboard -> Lokale Daten -> Lokale Daten löschen` entfernt werden. Standard-Einheiten und Slot-Typen bleiben danach erhalten.

## 4. Wichtiger Hinweis

Mehrgeräte-Sync kann über CouchDB eingerichtet werden. Die genaue Einrichtung steht in `docs/SYNC_SETUP.md`. Ohne CouchDB bleibt jedes Gerät weiterhin lokal für sich.
