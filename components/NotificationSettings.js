import * as React from 'react';
import { Card, Button, Label, Input, Select } from './ui.js';
import { loadPrefs, savePrefs, DEFAULT_PREFS, scheduleAll, requestPermission, scheduleDailyLoginReminder } from '../services/notifications.js';
import { MedicationType } from '../types.js';

const Toggle = ({ enabled, onChange, disabled }) => {
  return React.createElement(
    'button',
    {
      type: 'button',
      onClick: () => !disabled && onChange(!enabled),
      disabled,
      className: `relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-dark-primary focus:ring-offset-2 focus:ring-offset-dark-bg ${enabled ? 'bg-dark-primary' : 'bg-dark-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      role: 'switch',
      'aria-checked': enabled,
    },
    React.createElement('span', {
      className: `pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`,
    })
  );
};

const NotificationSettings = ({ medications, attacks }) => {
  const [prefs, setPrefs] = React.useState(DEFAULT_PREFS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loaded = loadPrefs();
    setPrefs(loaded);
    setLoading(false);
  }, []);

  const handleSave = async () => {
    savePrefs(prefs);
    await requestPermission();
    await scheduleAll(prefs, medications, attacks);
    alert('Preferences saved!');
  };

  const handleTestNotification = async () => {
    const granted = await requestPermission();
    if (!granted) {
      alert('Notification permission is required for test notifications.');
      return;
    }
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: 1,
          title: '🧪 Test Notification',
          body: 'This is a test notification from Migraine Tracker.',
          schedule: { at: new Date(Date.now() + 5000) },
        }],
      });
      alert('Test notification scheduled! You should receive it in 5 seconds.');
    } catch (e) {
      console.error('Test notification failed:', e);
      alert('Failed to schedule test notification. Check console for details.');
    }
  };

  const updatePref = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const preventativeMeds = medications.filter(m => m.type === MedicationType.Preventive);

  const intervalOptions = [1, 2, 4, 6, 8];

  if (loading) {
    return React.createElement(
      'div',
      { className: 'flex justify-center items-center py-12' },
      React.createElement('p', { className: 'text-dark-text-secondary' }, 'Loading preferences...')
    );
  }

  return React.createElement(
    'div',
    { className: 'space-y-6' },

    // ── Preventative Medication Reminder ──
    React.createElement(
      Card,
      { title: '💊 Preventative Medication Reminder' },
      React.createElement('div', { className: 'space-y-4' },

        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement(Label, null, 'Morning reminder'),
          React.createElement(Toggle, {
            enabled: prefs.morningReminderEnabled,
            onChange: (val) => updatePref('morningReminderEnabled', val),
          })
        ),
        prefs.morningReminderEnabled && React.createElement('div', null,
          React.createElement(Label, { htmlFor: 'morning-time' }, 'Morning time'),
          React.createElement(Input, {
            id: 'morning-time',
            type: 'time',
            value: prefs.morningTime || '08:00',
            onChange: (e) => updatePref('morningTime', e.target.value),
          })
        ),

        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement(Label, null, 'Evening reminder'),
          React.createElement(Toggle, {
            enabled: prefs.eveningReminderEnabled,
            onChange: (val) => updatePref('eveningReminderEnabled', val),
          })
        ),
        prefs.eveningReminderEnabled && React.createElement('div', null,
          React.createElement(Label, { htmlFor: 'evening-time' }, 'Evening time'),
          React.createElement(Input, {
            id: 'evening-time',
            type: 'time',
            value: prefs.eveningTime || '20:00',
            onChange: (e) => updatePref('eveningTime', e.target.value),
          })
        ),

        React.createElement('p', { className: 'text-sm text-dark-text-secondary italic' },
          "You'll be notified at the selected times until you confirm you've taken your medication."
        ),

        preventativeMeds.length > 0 && React.createElement(
          'div',
          null,
          React.createElement('p', { className: 'text-sm font-medium text-dark-text-secondary mb-2' }, 'Your preventative medications:'),
          React.createElement('ul', { className: 'space-y-1' },
            preventativeMeds.map(med =>
              React.createElement('li', {
                key: med.id,
                className: 'text-sm text-dark-text-primary bg-dark-bg rounded px-3 py-1.5',
              }, `${med.name}${med.dose ? ` (${med.dose})` : ''}`)
            )
          ),
          React.createElement('p', { className: 'text-xs text-dark-text-secondary mt-2' },
            'Preventative medications are managed in the Logs & Settings tab under Medications.'
          )
        ),

        preventativeMeds.length === 0 && React.createElement(
          'p', { className: 'text-sm text-dark-text-secondary italic' },
            'No preventative medications configured. Add some in the Medications section.'
        )
      )
    ),

    // ── Attack Check-in ──
    React.createElement(
      Card,
      { title: '🤕 Attack Check-in' },
      React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement(Label, null, 'Enable attack check-in'),
          React.createElement(Toggle, {
            enabled: prefs.attackCheckinEnabled,
            onChange: (val) => updatePref('attackCheckinEnabled', val),
          })
        ),

        prefs.attackCheckinEnabled && React.createElement(
          React.Fragment,
          null,
          React.createElement('div', null,
            React.createElement(Label, { htmlFor: 'checkin-interval' }, 'Check-in interval'),
            React.createElement(Select, {
              id: 'checkin-interval',
              value: prefs.attackCheckinInterval || 4,
              onChange: (e) => updatePref('attackCheckinInterval', parseInt(e.target.value, 10)),
            },
              intervalOptions.map(h =>
                React.createElement('option', { key: h, value: h }, `Every ${h} hour${h > 1 ? 's' : ''}`)
              )
            )
          ),

          React.createElement('div', null,
            React.createElement(Label, { htmlFor: 'checkin-message' }, 'Check-in message'),
            React.createElement(Input, {
              id: 'checkin-message',
              type: 'text',
              value: prefs.attackCheckinMessage || '',
              onChange: (e) => updatePref('attackCheckinMessage', e.target.value),
              placeholder: "You've been having a migraine attack for {duration}...",
            }),
            React.createElement('p', { className: 'text-xs text-dark-text-secondary mt-1' },
              'Use {duration} as a placeholder for the current attack duration.'
            )
          ),

          React.createElement('p', { className: 'text-sm text-dark-text-secondary italic' },
            "You'll receive notifications during an ongoing migraine attack"
          )
        )
      )
    ),

    // ── Daily Login Reminder ──
    React.createElement(
      Card,
      { title: '📋 Daily Check-in Reminder' },
      React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement(Label, null, 'Enable daily check-in reminder'),
          React.createElement(Toggle, {
            enabled: prefs.dailyLoginEnabled,
            onChange: (val) => updatePref('dailyLoginEnabled', val),
          })
        ),

        prefs.dailyLoginEnabled && React.createElement(
          React.Fragment,
          null,
          React.createElement('div', null,
            React.createElement(Label, { htmlFor: 'login-time' }, 'Reminder time'),
            React.createElement(Input, {
              id: 'login-time',
              type: 'time',
              value: prefs.dailyLoginTime || '20:00',
              onChange: (e) => updatePref('dailyLoginTime', e.target.value),
            })
          ),

          React.createElement('div', null,
            React.createElement(Label, { htmlFor: 'login-message' }, 'Reminder message'),
            React.createElement(Input, {
              id: 'login-message',
              type: 'text',
              value: prefs.dailyLoginMessage || '',
              onChange: (e) => updatePref('dailyLoginMessage', e.target.value),
              placeholder: "Time to check in! Log today's triggers and disability score.",
            })
          ),

          React.createElement('p', { className: 'text-sm text-dark-text-secondary italic' },
            "You'll get a daily nudge to open the app and log your triggers and functional disability score."
          )
        )
      )
    ),

    // ── Action buttons ──
    React.createElement(
      'div',
      { className: 'flex flex-col sm:flex-row gap-3 pt-2' },
      React.createElement(
        Button,
        { onClick: handleSave, className: 'flex-1' },
        'Save Preferences'
      ),
      React.createElement(
        Button,
        { variant: 'secondary', onClick: handleTestNotification, className: 'flex-1' },
        '🧪 Test Notification'
      )
    )
  );
};

export default NotificationSettings;
