import { LocalNotifications } from '@capacitor/local-notifications';

const PREFS_KEY = 'migraine_notification_prefs';

export const DEFAULT_PREFS = {
  preventativeEnabled: false,
  morningTime: '08:00',
  eveningTime: '20:00',
  attackCheckinEnabled: false,
  attackCheckinInterval: 4, // hours
  attackCheckinMessage: "You've been having a migraine attack for {duration}. Please log if anything has changed.",
  triggerReminderEnabled: false,
  triggerReminderTime: '20:00',
  triggerReminderMessage: "Don't forget to log your daily triggers!",
};

export const loadPrefs = () => {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const savePrefs = (prefs) => {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
};

export const requestPermission = async () => {
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
};

const cancelByTag = async (tag) => {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending && pending.notifications) {
      for (const n of pending.notifications) {
        if (n.extra?.tag === tag) {
          await LocalNotifications.cancel({ notifications: [{ id: n.id }] });
        }
      }
    }
  } catch {
    // Silently fail — notifications are best-effort
  }
};

export const schedulePreventativeReminders = async (prefs, medications) => {
  await cancelByTag('preventative-reminder');

  if (!prefs.preventativeEnabled) return;

  const preventativeMeds = medications.filter(m => m.type === 'preventive');
  const medNames = preventativeMeds.map(m => m.name).join(', ');
  const bodyText = medNames
    ? `Time to take: ${medNames}`
    : 'Time to take your preventative medication.';

  const times = [
    { key: 'morning', time: prefs.morningTime },
    { key: 'evening', time: prefs.eveningTime },
  ].filter(t => t.time);

  for (const { key, time } of times) {
    const [hours, minutes] = time.split(':').map(Number);
    const id = `prev${key}`.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    try {
      await LocalNotifications.schedule({
        notifications: [{
          id,
          title: '💊 Medication Reminder',
          body: bodyText,
          schedule: {
            every: 'day',
            on: { hour: hours, minute: minutes },
          },
          extra: { tag: 'preventative-reminder', repeat: true },
        }],
      });
    } catch {
      // Best effort
    }
  }
};

export const scheduleAttackCheckin = async (prefs, attacks) => {
  await cancelByTag('attack-checkin');

  if (!prefs.attackCheckinEnabled) return;

  // Check if there's an ongoing attack
  const ongoing = attacks.length > 0 && !attacks[0].endTime ? attacks[0] : null;
  if (!ongoing) return;

  const startTime = new Date(ongoing.startTime);
  if (isNaN(startTime.getTime())) return;

  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalDays = Math.floor(totalHours / 24);

  let durationText;
  if (totalDays > 0) {
    const remainingHours = totalHours % 24;
    durationText = `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
    if (remainingHours > 0) durationText += ` and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
  } else if (totalHours > 0) {
    durationText = `${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
  } else {
    durationText = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
  }

  const body = prefs.attackCheckinMessage.replace('{duration}', durationText);

  // Schedule a notification in 4 hours
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: 9999,
        title: '🤕 Migraine Check-in',
        body,
        schedule: {
          every: 'hour',
          count: 1,
          on: {
            hour: (now.getHours() + prefs.attackCheckinInterval) % 24,
            minute: now.getMinutes(),
          },
        },
        extra: { tag: 'attack-checkin' },
      }],
    });
  } catch {
    // Best effort
  }
};

export const scheduleTriggerReminder = async (prefs) => {
  await cancelByTag('trigger-reminder');

  if (!prefs.triggerReminderEnabled) return;

  const [hours, minutes] = (prefs.triggerReminderTime || '20:00').split(':').map(Number);

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: `trig${hours}${minutes}`.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0),
        title: '📋 Daily Trigger Check-in',
        body: prefs.triggerReminderMessage || "Don't forget to log your daily triggers!",
        schedule: {
          every: 'day',
          on: { hour: hours, minute: minutes },
        },
        extra: { tag: 'trigger-reminder' },
      }],
    });
  } catch {
    // Best effort
  }
};

export const scheduleAll = async (prefs, medications, attacks) => {
  await schedulePreventativeReminders(prefs, medications);
  await scheduleAttackCheckin(prefs, attacks);
  await scheduleTriggerReminder(prefs);
};
