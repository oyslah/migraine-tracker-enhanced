import * as React from 'react';
import { Card } from './ui.js';
import { toLocalDateString } from '../services/utils.js';

const heatColor = (value, thresholds) => {
  if (value == null || value === '—' || value === 0) return 'text-[#8B949E]'; // gray
  if (value <= thresholds[0]) return 'text-[#58A6FF]';   // blue
  if (value <= thresholds[1]) return 'text-[#3FB950]';   // green
  if (value <= thresholds[2]) return 'text-[#D29922]';   // amber
  if (value <= thresholds[3]) return 'text-[#F0883E]';   // orange
  return 'text-[#F85149]';                                // red
};

const ThirtyDayStats = ({ attacks }) => {
  const stats = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recent = attacks.filter(a => new Date(a.startTime) >= thirtyDaysAgo);

    if (recent.length === 0) return null;

    // Count unique migraine days (including multi-day attack spans)
    const allDays = new Set();
    recent.forEach(a => {
      const start = new Date(a.startTime);
      if (isNaN(start.getTime())) return;
      const end = a.endTime ? new Date(a.endTime) : start;
      if (isNaN(end.getTime())) return;
      let d = new Date(start);
      d.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);
      while (d <= endDay) {
        allDays.add(toLocalDateString(d));
        d.setDate(d.getDate() + 1);
      }
    });

    const severities = recent.map(a => a.severity).filter(s => s != null && !isNaN(s));
    const avgPain = severities.length > 0
      ? (severities.reduce((a, b) => a + b, 0) / severities.length).toFixed(1)
      : '—';
    const peakPain = severities.length > 0 ? Math.max(...severities) : '—';

    return {
      migraineDays: allDays.size,
      attackCount: recent.length,
      avgPain,
      peakPain,
    };
  }, [attacks]);

  if (!stats) {
    return React.createElement(Card, { title: "Last 30 Days" },
      React.createElement('p', { className: "text-dark-text-secondary text-sm" },
        "No attacks recorded in the last 30 days."
      )
    );
  }

  const statItems = [
    { value: stats.migraineDays, label: 'Migraine Days', thresholds: [3, 7, 11, 14] },
    { value: stats.attackCount, label: 'Attacks', thresholds: [2, 5, 8, 11] },
    { value: stats.avgPain, label: 'Avg Pain /10', thresholds: [2, 4, 6, 8] },
    { value: stats.peakPain, label: 'Peak Pain /10', thresholds: [2, 4, 6, 8] },
  ];

  return React.createElement(Card, { title: "Last 30 Days" },
    React.createElement('div', { className: "grid grid-cols-2 sm:grid-cols-4 gap-4 text-center" },
      statItems.map(item =>
        React.createElement('div', { key: item.label },
          React.createElement('p', { className: `text-3xl font-bold ${heatColor(typeof item.value === 'string' ? parseFloat(item.value) : item.value, item.thresholds)}` }, item.value),
          React.createElement('p', { className: "text-xs text-dark-text-secondary mt-1" }, item.label)
        )
      )
    )
  );
};

export default ThirtyDayStats;
