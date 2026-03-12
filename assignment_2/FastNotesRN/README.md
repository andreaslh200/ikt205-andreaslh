# FastNotes - Cloud Notes (Assignment 2)

Notat-app med Supabase backend for IKT205.

## Sourcecode

https://github.com/andreaslh200/ikt205-andreaslh

## Krav

### Autentisering
- [x] **(10%) Sign-up** - Bruker kan opprette konto med e-post/passord
- [x] **(10%) Email template** - Tilpasset e-postmal i Supabase for bekreftelse ved registrering
- [x] **(10%) Login/Logout** - Bruker må logge inn for å bruke appen, kan logge ut
- [x] **(5%) Credentials** - Innlogget bruker forblir innlogget, credentials lagret kryptert via AsyncStorage

### Database
- [x] **(5%) Auth-kobling** - RLS-policyer sikrer at kun innloggede brukere har tilgang til databasen
- [x] **(10%) Create** - Lagre nytt notat med tittel, tekst, bruker og tidspunkt
- [x] **(10%) Read** - "Work Notes"-skjerm viser alle notater fra alle brukere
- [x] **(10%) Update** - Brukere kan oppdatere notater
- [x] **(10%) Delete** - Brukere kan slette notater med bekreftelsesdialog

### Validering
- [x] **(5%) Ingen tomme felter i notater** - Tittel og innhold valideres før lagring
- [x] **(5%) Ingen tomme felter i brukernavn og passord** - E-post og passord valideres ved innlogging/registrering
- [x] **(5%) Success** - Brukeren får tilbakemelding (Alert) etter operasjoner

### Visualisering
- [x] **(5%) ER-Diagram** - Se ER-Diagram.png
- [x] **(5%) Sekvensdiagram** - Se Sekvens-Diagram.png

## Tech Stack

- React Native (Expo)
- TypeScript
- Supabase (Auth + Database)
- React Navigation

## Kjøre prosjektet

```bash
npm install
npx expo start
```

Trenger `.env` fil med:
```
EXPO_PUBLIC_SUPABASE_URL=<din supabase url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<din anon key>
```
