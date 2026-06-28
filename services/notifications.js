import { LocalNotifications } from '@capacitor/local-notifications';

const PREFS_KEY = 'migraine_notification_prefs';

export const DEFAULT_PREFS = {
  morningReminderEnabled: false,
  morningTime: '08:00',
  eveningReminderEnabled: false,
  eveningTime: '20:00',
  attackCheckinEnabled: false,
  attackCheckinInterval: 4, // hours
  attackCheckinMessage: "You've been having a migraine attack for {duration}. Please log if anything has changed.",
  dailyLoginEnabled: false,
  dailyLoginTime: '20:00',
  dailyLoginMessage: "Time to check in! Log today's triggers and disability score.",
};

export const loadPrefs = () => {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    let prefs = stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : { ...DEFAULT_PREFS };
    // Migrate old keys to new
    if (prefs.preventativeEnabled !== undefined) {
      prefs.morningReminderEnabled = prefs.preventativeEnabled;
      prefs.eveningReminderEnabled = prefs.preventativeEnabled;
      delete prefs.preventativeEnabled;
    }
    if (prefs.triggerReminderEnabled !== undefined) {
      prefs.dailyLoginEnabled = prefs.triggerReminderEnabled;
      delete prefs.triggerReminderEnabled;
    }
    if (prefs.triggerReminderTime !== undefined) {
      prefs.dailyLoginTime = prefs.triggerReminderTime;
      delete prefs.triggerReminderTime;
    }
    if (prefs.triggerReminderMessage !== undefined) {
      prefs.dailyLoginMessage = prefs.triggerReminderMessage;
      delete prefs.triggerReminderMessage;
    }
    return prefs;
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

  if (!prefs.morningReminderEnabled && !prefs.eveningReminderEnabled) return;

  const preventativeMeds = medications.filter(m => m.type === 'preventive');
  const medNames = preventativeMeds.map(m => m.name).join(', ');
  const bodyText = medNames
    ? `Time to take: ${medNames}`
    : 'Time to take your preventative medication.';

  const times = [];
  if (prefs.morningReminderEnabled && prefs.morningTime) {
    times.push({ key: 'morning', time: prefs.morningTime });
  }
  if (prefs.eveningReminderEnabled && prefs.eveningTime) {
    times.push({ key: 'evening', time: prefs.eveningTime });
  }

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

export const scheduleDailyLoginReminder = async (prefs) => {
  await cancelByTag('daily-login');

  if (!prefs.dailyLoginEnabled) return;

  const [hours, minutes] = (prefs.dailyLoginTime || '20:00').split(':').map(Number);

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: `dll${hours}${minutes}`.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0),
        title: '📋 Daily Check-in',
        body: prefs.dailyLoginMessage || "Time to check in! Log today's triggers and disability score.",
        schedule: {
          every: 'day',
          on: { hour: hours, minute: minutes },
        },
        extra: { tag: 'daily-login' },
      }],
    });
  } catch {
    // Best effort
  }
};

export const scheduleAll = async (prefs, medications, attacks) => {
  await schedulePreventativeReminders(prefs, medications);
  await scheduleAttackCheckin(prefs, attacks);
  await scheduleDailyLoginReminder(prefs);
};
