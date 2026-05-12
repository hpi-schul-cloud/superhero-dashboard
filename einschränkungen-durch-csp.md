# Ziel der Analyse

Diese Analyse beschreibt, welche Bereiche nach Aktivierung von `default-src 'self'` voraussichtlich nicht mehr funktionieren oder sich sichtbar anders verhalten.

# Zusammenfassung

Die größte Auswirkung entsteht in diesem Repository nicht beim Laden lokaler Dateien, sondern durch folgende Muster:

- Inline-Skripte
- Inline-Event-Handler wie `onclick`
- Inline-Styles über `style=""`
- `data:`-Assets in CSS
- Vendor-Code mit `unsafe-eval`-ähnlichem Verhalten
- Potenziell externe Bildquellen aus Konfigurations- oder Nutzdaten

# Aufgliederung nach Risikobereichen

## 1. Inline-Skripte

### Beschreibung

Inline-Skripte werden unter einer reinen CSP mit `default-src 'self'` blockiert.

### Betroffene Stellen

- `views/lib/loggedin.hbs` - done
- `views/users/jwt.hbs`

### Mögliche Auswirkungen

- Initialisierung von UI-Verhalten in der Logged-in-Ansicht fällt aus
- `setupFirebasePush()` wird nicht mehr aufgerufen
- Clipboard-Funktion auf der JWT-Seite funktioniert nicht mehr

### Priorität

Hoch

## 2. Inline-Event-Handler

### Beschreibung

Direkte Event-Handler im HTML wie `onclick` werden blockiert.

### Betroffene Stellen

- `views/users/jwt.hbs`
- `views/lib/components/sc-card.hbs`
- `views/lib/components/modal-cancel.hbs`
- `views/lib/error.hbs`

### Mögliche Auswirkungen

- Copy-to-Clipboard-Button funktioniert nicht
- Kartenaktionen mit `window.open(...)` funktionieren nicht mehr
- Zurück-Navigation in Modal und Fehleransicht funktioniert nicht mehr

### Priorität

Hoch

## 3. Inline-Styles in Templates

### Beschreibung

Viele Views verwenden `style=""` direkt im Markup. Diese Styles werden ohne zusätzliche CSP-Ausnahme nicht angewendet.

### Betroffene Stellen

- `views/lib/components/sc-card.hbs`
- `views/statistic/plottedStat.hbs`
- `views/lib/components/table.hbs`
- `views/batch-deletion/forms/batch-deletion-upload.hbs`
- `views/users/preselect.hbs`
- `views/ctltools/forms/add-ctl-tool.hbs`
- `views/schools/forms/add-school.hbs`
- `views/storageproviders/forms/add-storageprovider.hbs`

### Mögliche Auswirkungen

- Sichtbare Layoutfehler
- Ein-/Ausblendelogik über `display: none` funktioniert nicht mehr wie erwartet
- Formulare, Tabellen und Statistikseiten verlieren Struktur oder Abstände
- Dynamische Hintergrunddarstellungen entfallen

### Priorität

Hoch

## 4. `unsafe-eval`-Risiko in Vendor-Code

### Beschreibung

Mindestens ein eingebundenes Vendor-Skript nutzt `new Function(...)`. Das wird unter einer restriktiven CSP ohne `unsafe-eval` blockiert.

### Betroffene Stellen

- `static/scripts/bootstrap/bootstrap.min.js`

### Mögliche Auswirkungen

- Bootstrap-Interaktionen können brechen
- Betroffen sein können unter anderem Modal, Collapse, Tooltip, Popover und Carousel
- Indirekte Fehler in Views mit `data-toggle`-Mechanik sind möglich

### Priorität

Hoch

## 5. `data:`-Assets in CSS

### Beschreibung

Mehrere Stylesheets enthalten eingebettete Bilder als `data:image/...`. Diese werden ohne passende Ausnahme nicht geladen.

### Betroffene Stellen

- `static/styles/lib/spectrum/spectrum.css`
- `static/vendor/jquery/jquery-ui.css`
- `static/styles/lib/bootstrap-flex.css`

### Mögliche Auswirkungen

- Icons oder Marker in UI-Komponenten fehlen
- Visuelle Rückmeldungen in Widgets werden unvollständig dargestellt

### Priorität

Mittel

## 6. Externe Bildquellen aus Datenmodellen

### Beschreibung

Einige Bilder werden nicht statisch aus dem Repository geladen, sondern aus Datenfeldern oder Admin-Konfigurationen übernommen.

### Betroffene Stellen

- `views/lib/components/table.hbs`
- `controllers/federalstates.js`
- `views/ctltools/forms/add-ctl-tool.hbs`
- `views/federalstates/forms/add-federalstate.hbs`

### Mögliche Auswirkungen

- Externe Logos oder Vorschaubilder werden nicht angezeigt
- Darstellungen in Verwaltungsansichten sind unvollständig

### Priorität

Mittel

## 7. Statistikansicht mit HTML Imports und Webcomponents

### Beschreibung

Die Statistikseite bindet lokale Webcomponents-Ressourcen ein. Same-Origin ist hier grundsätzlich unkritisch, aber die View verwendet zusätzlich Inline-Styles.

### Betroffene Stellen

- `views/statistic/plottedStat.hbs`

### Mögliche Auswirkungen

- Kein primärer CSP-Bruch durch externe Herkunft
- Sichtbare Fehler durch blockierte Inline-Styles
- Mögliches Zusatzrisiko je nach Browserverhalten bei HTML Imports

### Priorität

Mittel

# Bereiche mit geringerem Risiko

## Lokale Skripte und Styles von derselben Origin

Die Standard-Assets werden lokal geladen und sollten durch `default-src 'self'` grundsätzlich weiter funktionieren.

### Relevante Stellen

- `views/lib/default.hbs`

## Relative API-Aufrufe

Relative `fetch`-Aufrufe auf derselben Origin sind voraussichtlich nicht betroffen.

### Relevante Stellen

- `static/scripts/batch-deletion/batch-deletion.js`

# Gesamtbewertung

Die Policy `default-src 'self'` ist als Sicherheitsmaßnahme sinnvoll, aber in der aktuellen Form für dieses Repository voraussichtlich zu restriktiv.

Am stärksten betroffen wären:

- Zentrale Layout-Initialisierung
- UI-Aktionen über Buttons und Karten
- Formulare mit Inline-Layout
- Bootstrap-basierte Interaktionen
- Darstellungen mit eingebetteten CSS-Assets

# Empfehlung

Vor einer harten Aktivierung sollte mindestens Folgendes vorbereitet werden:

- Inline-Skripte entfernen
- Inline-Event-Handler entfernen
- Inline-Styles reduzieren oder auslagern
- Vendor-Abhängigkeiten auf `unsafe-eval` prüfen
- `data:`-Assets und externe Bildquellen bewusst in der CSP berücksichtigen

# Fazit

Mit der aktuellen Implementierung in `app.js` ist mit funktionalen und visuellen Regressionen zu rechnen. Die Einführung einer restriktiven CSP ist möglich, erfordert in diesem Repository aber vorbereitende Bereinigungen in Templates und Vendor-Code.