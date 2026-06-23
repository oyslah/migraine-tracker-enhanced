# Migraine Tracker Enhanced

A privacy-first, offline-capable migraine tracking PWA with life changes correlation,
medication overuse headache (MOH) monitoring, and customizable notifications.

Built for F-Droid deployment.

## Features

- **Attack Logging** — severity, symptoms, custom symptom support
- **Medication Tracking** — acute + preventative, effectiveness ratings, MOH risk gauges
- **Trigger Correlation** — daily check-in with analytics showing trigger→attack probability
- **Life Changes** — track new meds, lifestyle changes, and overlay on all graphs
- **Notifications** — customizable preventative reminders, attack check-ins, trigger log nudges
- **Full Analytics** — migraine days, attack frequency, severity trends, medication effectiveness, trigger correlation, symptom frequency, weekly/time-of-day patterns
- **Dark mode only** — designed for light-sensitive users
- **100% local** — all data in IndexedDB, no accounts, no cloud

## Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

## Android Build (F-Droid)

```bash
npm run build
npx cap sync android
npx cap open android
```

Then build APK/AAB from Android Studio.

## License

MIT — fully open source.
