# Migraine Tracker Enhanced — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform the existing migraine tracker PWA into a feature-complete, F-Droid-compatible app with life changes tracking, notification system, enhanced home dashboard, and correct MOH limits.

**Architecture:** React 18 + Vite 6 PWA with Capacitor Android wrapper, Dexie.js IndexedDB for offline-first storage, Chart.js for visualizations. All data stays local — no backend, no accounts.

**Tech Stack:** React 18.3, Vite 6.2, Capacitor 7.4, Dexie 3.2, Chart.js 4.4, TypeScript (type stubs) + vanilla JS, dark-mode-only CSS

---

## Phase 1: Foundation & MOH Fixes (3 tasks)

### Task 1: Fix MOH threshold values

**Objective:** Update medication overuse headache thresholds per IHS guidelines and user specification

**Files:**
- Modify: `constants.js:32-37`

**Step 1: Apply changes**

Change Non-Opioid Analgesics threshold from 14 to 15, and Opioids or Barbiturates from 0 to 9:

```javascript
export const DEFAULT_MOH_RULES = [
    { medicationType: 'Non-Opioid Analgesics', threshold: 15 },
    { medicationType: 'Combination Analgesics with Caffeine', threshold: 9 },
    { medicationType: 'Triptans', threshold: 9 },
    { medicationType: 'Ergotamines', threshold: 9 },
    { medicationType: 'Opioids or Barbiturates', threshold: 9 },
];
```

**Verification:** `grep -n "threshold" constants.js` shows correct values

**Step 2: Commit**

```bash
git add constants.js
git commit -m "fix: correct MOH thresholds (NSAIDs 15, Opioids 9 per IHS guidelines)"
```

---

### Task 2: Update README and app metadata

**Objective:** Replace AI Studio README with proper project documentation

**Files:**
- Modify: `README.md`
- Modify: `manifest.json`
- Modify: `package.json`

**Step 1: Write new README**

```markdown
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
```

**Step 2: Update manifest.json**

- Change `name` to "Migraine Tracker Enhanced"
- Change `short_name` to "MigraineTracker"

**Step 3: Update package.json**

- Change `"name"` to `"migraine-tracker-enhanced"`

**Step 4: Commit**

```bash
git add README.md manifest.json package.json
git commit -m "docs: update project metadata for enhanced tracker"
```

---

### Task 3: Set up project for F-Droid compatibility

**Objective:** Ensure the project structure meets F-Droid inclusion requirements

**Files:**
- Create: `fdroid/metadata.yml`
- Create: `LICENSE`

**Step 1: Add MIT license**

Standard MIT license with "Daniel Morey" as copyright holder.

**Step 2: Create F-Droid metadata stub**

```yaml
# fdroid/metadata.yml
Categories:
  - Health & Fitness
License: MIT
AuthorName: Daniel Morey
SourceCode: https://github.com/oyslah/migraine-tracker-enhanced
IssueTracker: https://github.com/oyslah/migraine-tracker-enhanced/issues

AutoName: Migraine Tracker Enhanced
Summary: Privacy-first migraine tracking with medication overuse monitoring
Description: |
  A fully offline migraine tracker PWA wrapped as an Android app.
  Track attacks, medications, triggers, and life changes.
  Built-in MOH risk gauges and customizable push notifications.
  Dark mode by default for light-sensitive users. No accounts, no cloud.
```

**Verification:** `ls fdroid/` shows `metadata.yml`, `ls LICENSE` exists

**Step 3: Commit**

```bash
git add LICENSE fdroid/ README.md
git commit -m "feat: add F-Droid metadata and MIT license"
```

---

## Phase 2: Home Dashboard Enhancement (3 tasks)

### Task 4: Add 30-day stats card to home page

**Objective:** Show at-a-glance 30-day stats: migraine days, average pain, peak pain

**Files:**
- Create: `components/ThirtyDayStats.js`
- Modify: `components/Dashboard.js:414-443` (insert stats card in dashboard layout)

**Step 1: Create ThirtyDayStats component**

```javascript
// components/ThirtyDayStats.js
import * as React from 'react';
import { Card } from './ui.js';
import { toLocalDateString } from '../services/utils.js';

const ThirtyDayStats = ({ attacks }) => {
  const stats = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recent = attacks.filter(a => new Date(a.startTime) >= thirtyDaysAgo);

    if (recent.length === 0) return null;

    // Count unique migraine days
    const migraineDays = new Set(
      recent.map(a => {
        // Also count days spanned by multi-day attacks
        const days = [];
        const start = new Date(a.startTime);
        const end = a.endTime ? new Date(a.endTime) : start;
        let d = new Date(start);
        d.setHours(0, 0, 0, 0);
        const endDay = new Date(end);
        endDay.setHours(0, 0, 0, 0);
        while (d <= endDay) {
          days.push(toLocalDateString(d));
          d.setDate(d.getDate() + 1);
        }
        return days;
      }).flat()
    ).size;

    const severities = recent.map(a => a.severity).filter(s => s != null);
    const avgPain = severities.length > 0
      ? (severities.reduce((a, b) => a + b, 0) / severities.length).toFixed(1)
      : '—';
    const peakPain = severities.length > 0 ? Math.max(...severities) : '—';

    return { migraineDays, avgPain, peakPain, attackCount: recent.length };
  }, [attacks]);

  if (!stats) return null;

  return React.createElement(Card, { title: "Last 30 Days" },
    React.createElement('div', { className: "grid grid-cols-2 sm:grid-cols-4 gap-4 text-center" },
      React.createElement('div', null,
        React.createElement('p', { className: "text-3xl font-bold text-dark-primary" }, stats.migraineDays),
        React.createElement('p', { className: "text-xs text-dark-text-secondary mt-1" }, "Migraine Days")
      ),
      React.createElement('div', null,
        React.createElement('p', { className: "text-3xl font-bold text-dark-warning" }, stats.attackCount),
        React.createElement('p', { className: "text-xs text-dark-text-secondary mt-1" }, "Attacks")
      ),
      React.createElement('div', null,
        React.createElement('p', { className: "text-3xl font-bold text-dark-text-primary" }, stats.avgPain),
        React.createElement('p', { className: "text-xs text-dark-text-secondary mt-1" }, "Avg Pain /10")
      ),
      React.createElement('div', null,
        React.createElement('p', { className: "text-3xl font-bold text-dark-danger" }, stats.peakPain),
        React.createElement('p', { className: "text-xs text-dark-text-secondary mt-1" }, "Peak Pain /10")
      )
    )
  );
};

export default ThirtyDayStats;
```

**Step 2: Integrate into Dashboard**

In `Dashboard.js`, import ThirtyDayStats and insert it between the header card and the daily check-in card. Pass `attacks={attacks}`.

**Verification:** Home page shows 4 stat boxes with 30-day data

**Step 3: Commit**

```bash
git add components/ThirtyDayStats.js components/Dashboard.js
git commit -m "feat: add 30-day stats card (migraine days, attacks, avg/peak pain)"
```

---

### Task 5: Add MOH risk gauge to home page

**Objective:** Show a compact MOH risk summary on the home page so users see overuse risk at a glance

**Files:**
- Create: `components/MOHGauge.js`
- Modify: `components/Dashboard.js` (insert after ThirtyDayStats)

**Step 1: Create MOHGauge component**

```javascript
// components/MOHGauge.js
import * as React from 'react';
import { Card } from './ui.js';
import { toLocalDateString } from '../services/utils.js';
import { MedicationType } from '../types.js';

const MOHGauge = ({ medicationIntakes, medications, mohRules }) => {
  const gaugeData = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentIntakes = medicationIntakes.filter(i =>
      new Date(i.timestamp) >= thirtyDaysAgo
    );

    const medTypeMap = new Map(medications.map(m => [m.id, m]));
    const abortiveIntakes = recentIntakes.filter(i => {
      const med = medTypeMap.get(i.medicationId);
      return med && (med.type === MedicationType.Abortive || med.type === MedicationType.CGRPInhibitor);
    });

    // Combined days
    const uniqueAbortiveMeds = new Set(abortiveIntakes.map(i => i.medicationId));
    const combinedDays = uniqueAbortiveMeds.size > 1
      ? new Set(abortiveIntakes.map(i => toLocalDateString(i.timestamp))).size
      : 0;

    // Per-category days
    const categories = mohRules.map(rule => {
      const relevantMeds = new Set(
        medications.filter(m => m.mohCategories?.includes(rule.medicationType)).map(m => m.id)
      );
      const days = new Set(
        recentIntakes.filter(i => relevantMeds.has(i.medicationId)).map(i => toLocalDateString(i.timestamp))
      ).size;
      return { name: rule.medicationType, days, threshold: rule.threshold };
    });

    return { combined: { days: combinedDays, threshold: 9 }, categories };
  }, [medicationIntakes, medications, mohRules]);

  const getColor = (days, threshold) => {
    if (threshold === 0) return 'dark-success';
    const pct = days / threshold;
    if (pct >= 1) return 'dark-danger';
    if (pct >= 0.75) return 'dark-warning';
    return 'dark-success';
  };

  const highestRisk = [
    { ...gaugeData.combined, name: 'Combined' },
    ...gaugeData.categories,
  ].reduce((worst, cat) => {
    if (cat.threshold === 0) return worst;
    const pct = cat.days / cat.threshold;
    return pct > worst.pct ? { ...cat, pct } : worst;
  }, { pct: 0 });

  return React.createElement(Card, { title: "MOH Risk (30-Day)" },
    React.createElement('div', { className: "space-y-3" },
      React.createElement('div', { className: "flex items-center justify-between" },
        React.createElement('span', { className: "text-sm text-dark-text-secondary" }, "Highest risk"),
        React.createElement('span', {
          className: `text-sm font-bold text-${getColor(highestRisk.days, highestRisk.threshold)}`
        }, `${highestRisk.name}: ${highestRisk.days}/${highestRisk.threshold} days`)
      ),
      React.createElement('div', { className: "w-full bg-dark-bg rounded-full h-2" },
        React.createElement('div', {
          className: `bg-${getColor(highestRisk.days, highestRisk.threshold)} h-2 rounded-full transition-all`,
          style: { width: `${Math.min((highestRisk.days / Math.max(highestRisk.threshold, 1)) * 100, 100)}%` }
        })
      ),
      gaugeData.combined.days >= gaugeData.combined.threshold && React.createElement('p', {
        className: "text-xs text-dark-danger"
      }, '⚠️ Combined medication use threshold reached')
    )
  );
};

export default MOHGauge;
```

**Verification:** Home page shows MOH risk bar below 30-day stats

**Step 2: Commit**

```bash
git add components/MOHGauge.js components/Dashboard.js
git commit -m "feat: add MOH risk gauge to home dashboard"
```

---

### Task 6: Allow adding new medication from intake modal

**Objective:** Add a "+ New Medication" flow inline in the medication intake modal

**Files:**
- Modify: `components/Dashboard.js:7-108` (MedicationLogModal)

**Step 1: Add inline medication creation**

In `MedicationLogModal`, add a "+ Add New Medication" button that reveals inline name/dose/type/category fields. On save, it calls a new prop `onAddMedication` that persists to DB and returns the new medication ID, then auto-selects it.

Key changes:
- Add `showAddMed` state, toggle with button
- When toggled, show name/dose/type/MOH category inputs
- On save, call `onAddMedication({name, type, dose, mohCategories})` which returns the new med
- Auto-select the new medication in the dropdown
- Reuse `MOH_CATEGORIES` from constants for category selection

**Verification:** Can add a new acute medication directly from the "Log Medication" modal without leaving the screen

**Step 2: Commit**

```bash
git add components/Dashboard.js
git commit -m "feat: inline medication creation from intake modal"
```

---

## Phase 3: Life Changes Tracking (4 tasks)

### Task 7: Add lifeChanges table to IndexedDB

**Objective:** Create the database schema for life change events

**Files:**
- Modify: `services/db.js`

**Step 1: Add table to Dexie schema**

```javascript
db.version(3).stores({
  attacks: 'id, startTime, endTime',
  medications: 'id',
  medicationIntakes: 'id, medicationId, timestamp',
  triggers: 'id',
  symptoms: 'id',
  triggerLogs: 'date',
  mohRules: 'medicationType',
  disabilityLogs: 'date',
  lifeChanges: 'id, date',  // NEW
});
```

**Verification:** App loads without migration errors (Dexie handles version upgrades)

**Step 2: Commit**

```bash
git add services/db.js
git commit -m "feat: add lifeChanges table to IndexedDB schema"
```

---

### Task 8: Create Life Changes management UI

**Objective:** Build a page/section where users can add, edit, delete life change events

**Files:**
- Create: `components/LifeChanges.js`

**Step 1: Build LifeChanges component**

Features:
- List existing life changes with date and description
- "Add Life Change" button opens inline form
- Form: date picker, description text input, category select (New Preventative, Started Workout, Moved, Diet Change, Other)
- Edit/delete existing entries
- Props: `lifeChanges`, `onAdd`, `onUpdate`, `onDelete`

The data model:
```javascript
{
  id: 'lc-{timestamp}',
  date: 'YYYY-MM-DD',
  description: 'Started Emgality',
  category: 'new_preventative' | 'workout' | 'moved' | 'diet' | 'other'
}
```

**Verification:** Can add a life change with date "2026-01-15", category "New Preventative", description "Started Emgality"

**Step 2: Commit**

```bash
git add components/LifeChanges.js
git commit -m "feat: life changes management UI (add/edit/delete)"
```

---

### Task 9: Wire life changes into App.js state management

**Objective:** Add lifeChanges state, CRUD handlers, and pass to components

**Files:**
- Modify: `App.js`

**Step 1: Add state and handlers**

```javascript
// State
const [lifeChanges, setLifeChanges] = React.useState([]);

// Load from DB in initializeApp
db.lifeChanges.orderBy('date').reverse().toArray()

// Handler
const addLifeChange = async (lc) => {
  await db.lifeChanges.add(lc);
  const all = await db.lifeChanges.orderBy('date').reverse().toArray();
  setLifeChanges(all);
};
// Similar for updateLifeChange, deleteLifeChange
```

**Step 2: Add Life Changes tab to navigation**

Add a 4th nav item: `{ id: 'life_changes', label: 'Life Changes', view: 'life_changes' }`

**Step 3: Render LifeChanges component in the switch**

**Verification:** New "Life Changes" nav tab appears, can add/edit/delete life changes

**Step 4: Commit**

```bash
git add App.js
git commit -m "feat: wire life changes state management into App"
```

---

### Task 10: Overlay life change markers on analytics graphs

**Objective:** Show vertical reference lines on attack/migraine-days/severity graphs where life changes occurred

**Files:**
- Modify: `components/Analytics.js`
- Modify: `components/Chart.js`

**Step 1: Add lifeChanges prop to Analytics**

Accept `lifeChanges` prop from App.js.

**Step 2: Add annotation plugin to Chart.js**

In `Chart.js`, register the Chart.js annotation plugin (or manually draw vertical lines). For simplicity without adding a new dependency, render life change markers as custom HTML elements positioned over the chart using CSS absolute positioning, keyed to the x-axis date.

Alternative: Add `chartjs-plugin-annotation` as a dependency (lighter touch):

```bash
npm install chartjs-plugin-annotation
```

Then in each relevant chart, add annotation config for life change dates that fall within the visible range.

**Step 3: Update chart options with life change markers**

For `migraineDaysData`, `attackFrequencyData`, and `disabilityScoreData` charts, add vertical line annotations at dates where lifeChanges exist.

**Verification:** Adding a life change on "2026-03-15" shows a dashed vertical line on the migraine days chart at that month

**Step 4: Commit**

```bash
npm install chartjs-plugin-annotation
git add package.json package-lock.json components/Analytics.js components/Chart.js
git commit -m "feat: overlay life change markers on analytics graphs"
```

---

## Phase 4: Notifications System (4 tasks)

### Task 11: Add Capacitor Local Notifications plugin

**Objective:** Install and configure the local notifications plugin for Android

**Files:**
- Modify: `package.json`
- Modify: `capacitor.config.json`

**Step 1: Install plugin**

```bash
npm install @capacitor/local-notifications
npx cap sync android
```

**Step 2: Commit**

```bash
git add package.json package-lock.json android/
git commit -m "feat: add Capacitor local notifications plugin"
```

---

### Task 12: Build notification preferences UI

**Objective:** Create a settings page for configuring all three notification types

**Files:**
- Create: `components/NotificationSettings.js`

**Step 1: Build NotificationSettings component**

Three notification types with toggle + configuration:

1. **Preventative Medication Reminder**
   - Toggle on/off
   - Time picker (morning, e.g., 08:00)
   - Time picker (evening, e.g., 20:00)
   - Repeat interval: "Every 5 minutes until confirmed"
   - Show which medications are marked as preventative

2. **Attack Check-in**
   - Toggle on/off
   - Interval: "Every 4 hours during an attack"
   - Custom message: "You've been having a migraine attack for {duration}. Please log if anything has changed."

3. **Daily Trigger Reminder**
   - Toggle on/off
   - Time: 20:00
   - Message: "Don't forget to log your daily triggers!"

Store preferences in localStorage under `migraine_notification_prefs`.

**Verification:** Can toggle each notification type, set times, see preview text

**Step 2: Commit**

```bash
git add components/NotificationSettings.js
git commit -m "feat: notification preferences UI with three notification types"
```

---

### Task 13: Implement notification scheduling logic

**Objective:** Create a service that schedules/cancels notifications based on user preferences

**Files:**
- Create: `services/notifications.js`

**Step 1: Build notification service**

```javascript
// services/notifications.js
import { LocalNotifications } from '@capacitor/local-notifications';

// Request permission
export const requestNotificationPermission = async () => {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
};

// Schedule preventative med reminders
export const schedulePreventativeReminders = async (prefs, medications) => {
  // Cancel existing reminders first
  await cancelByTag('preventative-reminder');

  if (!prefs.preventativeEnabled) return;

  const preventativeMeds = medications.filter(m => m.type === 'preventive');
  const times = [prefs.morningTime, prefs.eveningTime].filter(Boolean);

  for (const time of times) {
    const [hours, minutes] = time.split(':').map(Number);
    await LocalNotifications.schedule({
      notifications: [{
        id: parseInt(`prev${hours}${minutes}`),
        title: 'Medication Reminder',
        body: `Time to take your preventative medication${preventativeMeds.length > 0 ? ': ' + preventativeMeds.map(m => m.name).join(', ') : ''}`,
        schedule: {
          every: 'day',
          at: new Date(2026, 0, 1, hours, minutes),
        },
        extra: { tag: 'preventative-reminder' },
      }],
    });
  }
};
// Similar functions for attackCheckin and triggerReminder
```

**Verification:** Schedule a test notification for 1 minute from now, verify it appears

**Step 2: Commit**

```bash
git add services/notifications.js
git commit -m "feat: notification scheduling service with Capacitor"
```

---

### Task 14: Wire notifications into App and navigation

**Objective:** Integrate notification service with app lifecycle and add Notifications nav tab

**Files:**
- Modify: `App.js`
- Modify: `index.js`

**Step 1: Add notification initialization in App.js**

On mount:
- Request notification permissions
- Load preferences from localStorage
- Schedule notifications based on prefs
- Re-schedule when prefs change

**Step 2: Add Notifications nav tab**

5th nav item: `{ id: 'notifications', label: 'Notifications', icon: BellIcon, view: 'notifications' }`

**Step 3: Add BellIcon to ui.js**

Simple SVG bell icon.

**Verification:** Notifications tab appears, prefs persist across reloads, notifications fire on schedule

**Step 4: Commit**

```bash
git add App.js index.js components/ui.js components/NotificationSettings.js
git commit -m "feat: integrate notifications into app shell and navigation"
```

---

## Phase 5: F-Droid Build & Polish (3 tasks)

### Task 15: Configure Android release build

**Objective:** Set up Capacitor Android project for release APK/AAB generation

**Files:**
- Modify: `capacitor.config.json`
- Modify: `android/app/build.gradle`
- Modify: `android/variables.gradle`

**Step 1: Update capacitor config**

```json
{
  "appId": "com.danielmorey.migrainetracker",
  "appName": "Migraine Tracker",
  "webDir": "dist",
  "plugins": {
    "LocalNotifications": {
      "smallIcon": "ic_launcher",
      "iconColor": "#8DB38B"
    }
  }
}
```

**Step 2: Update Android app name**

In `android/app/src/main/res/values/strings.xml`, set `app_name` to "Migraine Tracker".

**Step 3: Update build.gradle for release**

Ensure `applicationId` matches `com.danielmorey.migrainetracker` in `android/app/build.gradle`.

**Verification:** `npx cap sync android` succeeds, Android project compiles

**Step 4: Commit**

```bash
git add capacitor.config.json android/
git commit -m "chore: configure Android release build for F-Droid"
```

---

### Task 16: Add data export enhancements

**Objective:** Improve the existing data export to include life changes and notification prefs

**Files:**
- Modify: `components/LogAndSettings.js`

**Step 1: Extend export function**

Add `lifeChanges` and notification preferences to the JSON export. Also include app version and export timestamp.

```javascript
const exportData = {
  version: 2,
  exportedAt: new Date().toISOString(),
  attacks,
  medications,
  medicationIntakes,
  triggers,
  symptoms,
  triggerLogs,
  mohRules,
  disabilityLogs,
  lifeChanges,         // NEW
  notificationPrefs,   // NEW
};
```

**Verification:** Export file contains lifeChanges array and notificationPrefs object

**Step 2: Commit**

```bash
git add components/LogAndSettings.js
git commit -m "feat: include life changes and notification prefs in data export"
```

---

### Task 17: Final integration testing & README polish

**Objective:** Verify all features work together, update documentation

**Step 1: Build and test**

```bash
npm run build
npm run preview
```

Manual verification checklist:
- [ ] Home shows 30-day stats and MOH gauge
- [ ] Log attack with custom symptoms works
- [ ] Log medication with inline "add new med" works
- [ ] Life Changes tab: add/edit/delete works
- [ ] Analytics show life change markers
- [ ] Notifications tab: toggle/save prefs works
- [ ] Data export includes all new fields
- [ ] Dark mode enforced everywhere

**Step 2: Update README with final features list and F-Droid build instructions**

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: final README with features and build instructions"
```

---

## Summary

| Phase | Tasks | Features |
|-------|-------|----------|
| 1: Foundation | 1–3 | MOH fix, metadata, F-Droid prep |
| 2: Home Dashboard | 4–6 | 30-day stats, MOH gauge, inline med creation |
| 3: Life Changes | 7–10 | DB schema, management UI, state wiring, graph overlays |
| 4: Notifications | 11–14 | Capacitor plugin, prefs UI, scheduling service, integration |
| 5: Polish | 15–17 | Android release, data export, final testing |

**Total: 17 tasks. Estimated implementation time: 60–90 minutes.**
