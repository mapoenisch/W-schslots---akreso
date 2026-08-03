# Wasch-App

Eine Full-Stack-Webanwendung zur einfachen und fairen Buchung von Waschmaschinen in einem Gemeinschaftswaschkeller. 

## Features

- **Buchungssystem**: Übersichtliche Anzeige freier Zeiten für die Waschmaschinen.
- **Trockner-Option**: Optionale Hinzubuchung des Trockners, sofern zeitlich möglich.
- **Fairness**: Begrenzung auf maximal 2 Buchungen pro Nutzer und Kalenderwoche.
- **Tauschbörse**: Gebuchte Termine können anonym zum Tausch angeboten und von anderen Nutzern übernommen werden.
- **Flexibilität**: Buchungen können jederzeit storniert werden.
- **Erinnerungen**: System-Erinnerungen (aktuell als Mock-Service implementiert), wenn die Wäsche fertig ist.
- **Bezahlung**: Einfacher Hinweis, dass die Bezahlung vor Ort in bar erfolgt.
- **Admin-Bereich**: Verwaltung von Nutzern und Blockierung von Zeiten (z.B. für Wartung).

## Tech Stack

- **Frontend**: React (18+), Vite, Tailwind CSS, Lucide Icons, Date-fns
- **Backend**: Node.js, Express, TypeScript
- **Datenbank**: SQLite (via `better-sqlite3`)
- **Authentifizierung**: JWT (JSON Web Tokens) & bcryptjs

## Struktur

- `src/components/` - React Komponenten (Booking, Exchange, MyBookings, Admin, Auth, etc.)
- `src/db.ts` - Datenbank-Schema und Initialisierung
- `server.ts` - Express Server, API Endpunkte und Geschäftslogik
- `dist/` - Kompilierte Build-Dateien

## Lokale Entwicklung

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```
   Der Server läuft standardmäßig auf Port 3000 und startet sowohl die API als auch das Vite Frontend im Middleware-Modus.

3. **Produktions-Build:**
   ```bash
   npm run build
   npm start
   ```

## API Endpunkte (Auszug)

- `POST /api/register` - Neuen Nutzer registrieren
- `POST /api/login` - Anmelden & JWT erhalten
- `GET /api/slots` - Verfügbare Zeiten für einen bestimmten Tag abrufen
- `POST /api/bookings` - Neue Buchung erstellen
- `GET /api/my-bookings` - Eigene Buchungen abrufen
- `DELETE /api/bookings/:id` - Buchung stornieren
- `POST /api/bookings/:id/exchange` - Buchung in die Tauschbörse stellen
- `GET /api/exchanges` - Tauschbörse abrufen
- `POST /api/exchanges/:id/accept` - Termin aus Tauschbörse übernehmen
