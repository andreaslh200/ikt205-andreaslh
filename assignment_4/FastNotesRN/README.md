# FastNotes - Production Ready (Assignment 4)

Notat-app med testing, optimalisering og build for IKT205.

## Sourcecode

https://github.com/andreaslh200/ikt205-andreaslh

## Krav

### Testing Suite
- [x] **(10%) Unit Test** - Tester at opprettelse av notat navigerer tilbake til hovedskjermen
- [x] **(15%) Integration Test** - Mocker Supabase og verifiserer laste-indikator som forsvinner når data er hentet
- [x] **(10%) Auth Guard Test** - Sjekker at login-skjermen vises når bruker ikke er innlogget

Kjør testene med:
```bash
npm test
```

### Production Readiness & Optimalisering
- [x] **(10%) Log Cleanup** - Ingen `console.log`-setninger i koden
- [x] **(10%) Resource Management** - Bruker `useIsFocused()` for å hindre kamera-funksjoner når skjermen ikke er i fokus
- [x] **(10%) Pagination (5 notater)** - Henter kun 5 notater om gangen med `.range()`
- [x] **(10%) Last mer-knapp** - "Load more"-knapp for å hente neste 5 notater

### Build & Distribusjon
- [x] **(10%) App-fil** - `.apk`-fil vedlagt i zip-leveransen
- [x] **(15%) Byggeinstruksjoner** - Se under

## Kjøre appen

### APK-fil

Den vedlagte `.apk`-filen kan installeres direkte på en Android-emulator eller fysisk enhet:

```bash
adb install FastNotesRN.apk
```

Eller dra og slipp `.apk`-filen inn i Android Emulator-vinduet.

### Fra kildekoden

```bash
npm install
npx expo start
```

Trenger `.env` fil med:
```
EXPO_PUBLIC_SUPABASE_URL=<din supabase url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<din anon key>
```

## Tech Stack

- React Native (Expo)
- TypeScript
- Supabase (Auth + Database + Storage)
- React Navigation
- Jest + React Native Testing Library
- EAS Build
