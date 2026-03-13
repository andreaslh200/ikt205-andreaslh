# FastNotes - Native Functions (Assignment 3)

Notat-app med kamera, bildeopplasting og notifikasjoner for IKT205.

## Sourcecode

https://github.com/andreaslh200/ikt205-andreaslh

## Krav

### Kamera-integrasjon
- [x] **(5%) Permissions** - Ber om tilgang til kamera og bildegalleri
- [x] **(10%) Capture & Pick** - Bruker kan ta bilde med kamera eller velge fra galleri
- [x] **(5%) Preview** - Bildet vises i notatvinduet før lagring/opplasting

### Storage & Validering
- [x] **(10%) Client-side Validation** - Sjekker at filen er under 15MB og i JPG, PNG eller WebP
- [x] **(10%) Supabase Upload** - Bilder lastes opp til Supabase Storage med unike filnavn
- [x] **(5%) DB Linking** - Bilde-URL lagres i notat-tabellen

### UI/UX (Bilde & Feedback)
- [x] **(10%) Loading States** - Spinner vises under opplasting, lagre-knappen deaktiveres
- [x] **(10%) Aspect Ratio Handling** - Bilder vises i notatlisten uten å strekkes
- [x] **(10%) Error Messaging** - Feilmeldinger ved for stort bilde, feil format eller mislykket opplasting

### Notifikasjoner
- [x] **(5%) System Permissions** - Ber om tillatelse til å sende notifikasjoner
- [x] **(5/15%) Lokal Trigger** - Notifikasjon sendes til brukeren etter vellykket lagring
- [x] **(5%) Content Injection** - Notifikasjonen inneholder tittelen på notatet

## Tech Stack

- React Native (Expo)
- TypeScript
- Supabase (Auth + Database + Storage)
- React Navigation
- expo-image-picker
- expo-notifications

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
