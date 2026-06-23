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

    // Combined days — only applies if more than one distinct abortive med
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

    const allRisks = [
      { name: 'Combined', days: combinedDays, threshold: 9 },
      ...categories.filter(c => c.threshold > 0),
    ];

    return allRisks;
  }, [medicationIntakes, medications, mohRules]);

  if (!gaugeData || gaugeData.length === 0) return null;

  const getColor = (days, threshold) => {
    if (threshold === 0) return 'bg-dark-success';
    const pct = days / threshold;
    if (pct >= 1) return 'bg-dark-danger';
    if (pct >= 0.7) return 'bg-dark-warning';
    return 'bg-dark-success';
  };

  const getTextColor = (days, threshold) => {
    if (threshold === 0) return 'text-dark-success';
    const pct = days / threshold;
    if (pct >= 1) return 'text-dark-danger';
    if (pct >= 0.7) return 'text-dark-warning';
    return 'text-dark-success';
  };

  return React.createElement(Card, { title: "MOH Risk (Last 30 Days)" },
    React.createElement('div', { className: "space-y-3" },
      gaugeData.map((item, i) =>
        React.createElement('div', { key: i, className: "space-y-1" },
          React.createElement('div', { className: "flex justify-between items-center" },
            React.createElement('span', { className: "text-sm text-dark-text-secondary" }, item.name),
            React.createElement('span', {
              className: `text-sm font-bold ${getTextColor(item.days, item.threshold)}`
            }, `${item.days}/${item.threshold} days`)
          ),
          React.createElement('div', { className: "w-full bg-dark-bg rounded-full h-2" },
            React.createElement('div', {
              className: `${getColor(item.days, item.threshold)} h-2 rounded-full transition-all duration-300`,
              style: { width: `${Math.min((item.days / Math.max(item.threshold, 1)) * 100, 100)}%` }
            })
          )
        )
      ),
      gaugeData.some(c => c.threshold > 0 && c.days >= c.threshold) && React.createElement('p', {
        className: "text-xs text-dark-danger mt-2"
      }, '⚠️  One or more medication thresholds reached — consider consulting your doctor.')
    )
  );
};

export default MOHGauge;
