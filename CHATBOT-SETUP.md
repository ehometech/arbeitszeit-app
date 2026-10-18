# ANVOLT KI-Chatbot – Einrichtung

Die UI wird für angemeldete PIN-App-Nutzer angezeigt. **Chat-Anfragen sind absichtlich blockiert**, bis eine sichere Firebase-Auth-Anmeldung eingerichtet ist. Die vorhandene clientseitige PIN darf niemals als vertrauenswürdiger Server-Nachweis gelten.

## Backend
1. Dieses Repository zusätzlich als Vercel-Projekt bereitstellen (GitHub Pages bleibt für die Oberfläche zuständig).
2. Vercel-Umgebungsvariablen: `OPENAI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON` (Service-Account-JSON als Secret), `CHAT_ALLOWED_ORIGIN=https://ehometech.github.io`, optional `OPENAI_MODEL`.
3. In `anvolt-chatbot.js` die API_URL durch die Vercel-Domain ersetzen.
4. Sichere Firebase Auth mit individuellen Mitarbeitenden-Konten einrichten, Firebase Auth SDK hinzufügen und die PIN-Sitzungen den serverseitig authentifizierten Mitarbeitenden zuordnen. Eine reine anonyme Anmeldung oder ein vom Browser gesendeter Mitarbeitername genügt NICHT.
5. Vor Produktivbetrieb: pro Nutzer serverseitige Autorisierung (aktive Mitarbeiter), Rate-Limits, Ausgabenlimits, Datenschutzhinweise und Tests ergänzen.

**Status:** Die Oberfläche ist als Vorschau eingebaut; die Live-KI-Suche ist erst nach Schritten 1–5 nutzbar. API-Schlüssel gehören nie in den GitHub-Pages-Code.
