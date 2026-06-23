
import * as React from 'react';
import { MedicationType } from '../types.js';
import { Card, Chip, Label, Input } from './ui.js';
import { toLocalDateString } from '../services/utils.js';
import ChartComponent from './Chart.js';

const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                color: '#F5F5F5',
            },
        },
        tooltip: {
            backgroundColor: 'rgba(51, 42, 37, 0.9)',
            titleColor: '#F5F5F5',
            bodyColor: '#F5F5F5',
            borderColor: '#635752',
            borderWidth: 1,
        },
    },
    scales: {
        x: {
            ticks: {
                color: '#B0A6A1',
                maxRotation: 0,
                autoSkip: true,
            },
            grid: {
                color: 'rgba(99, 87, 82, 0.2)',
            },
             border: {
                color: 'rgba(99, 87, 82, 0.4)',
            },
        },
        y: {
            ticks: {
                color: '#B0A6A1',
            },
            grid: {
                color: 'rgba(99, 87, 82, 0.2)',
            },
             border: {
                color: 'rgba(99, 87, 82, 0.4)',
            },
        },
    },
};

/**
 * Generates an array of month strings (e.g., '2023-01') between two dates.
 */
const getMonthRange = (startDate, endDate) => {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    
    const months = [];
    for (let year = startYear; year <= endYear; year++) {
        const monthStart = (year === startYear) ? startMonth : 0;
        const monthEnd = (year === endYear) ? endMonth : 11;
        
        for (let month = monthStart; month <= monthEnd; month++) {
            months.push(`${year}-${String(month + 1).padStart(2, '0')}`);
        }
    }
    return months;
};

const Analytics = ({ attacks, medicationIntakes, medications, triggers, triggerLogs, mohRules, disabilityLogs }) => {
    const [timeRange, setTimeRange] = React.useState('12m');
    const [customStartDate, setCustomStartDate] = React.useState('');
    const [customEndDate, setCustomEndDate] = React.useState('');

    const handleTimeRangeChange = (newRange) => {
        setTimeRange(newRange);
        if (newRange === 'custom' && !customStartDate && !customEndDate) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            setCustomStartDate(toLocalDateString(startDate));
            setCustomEndDate(toLocalDateString(endDate));
        }
    };

    const getCutoffDate = React.useCallback(() => {
        if (timeRange === 'all' || timeRange === 'custom') return null;
        let months;
        switch(timeRange) {
            case '3m': months = 3; break;
            case '6m': months = 6; break;
            case '12m': months = 12; break;
            default: return null;
        }
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);
        cutoff.setDate(1);
        cutoff.setHours(0, 0, 0, 0);
        return cutoff;
    }, [timeRange]);

    const filteredAttacks = React.useMemo(() => {
        if (timeRange === 'custom') {
            if (!customStartDate || !customEndDate) return [];
            const [startYear, startMonth, startDay] = customStartDate.split('-').map(Number);
            const start = new Date(startYear, startMonth - 1, startDay);
            const [endYear, endMonth, endDay] = customEndDate.split('-').map(Number);
            const end = new Date(endYear, endMonth - 1, endDay);
            end.setHours(23, 59, 59, 999);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
            return attacks.filter(attack => {
                const attackDate = new Date(attack.startTime);
                return !isNaN(attackDate.getTime()) && attackDate >= start && attackDate <= end;
            });
        }
        const cutoffDate = getCutoffDate();
        if (!cutoffDate) return attacks;
        return attacks.filter(attack => new Date(attack.startTime) >= cutoffDate);
    }, [attacks, getCutoffDate, timeRange, customStartDate, customEndDate]);
    
    const filteredTriggerLogs = React.useMemo(() => {
        if (timeRange === 'custom') {
            if (!customStartDate || !customEndDate) return [];
            return triggerLogs.filter(log => log.date && log.date >= customStartDate && log.date <= customEndDate);
        }
        const cutoffDate = getCutoffDate();
        if (!cutoffDate) return triggerLogs;
        return triggerLogs.filter(log => {
            try {
                const [year, month, day] = log.date.split('-').map(Number);
                const logDate = new Date(year, month - 1, day);
                return logDate >= cutoffDate;
            } catch {
                return false;
            }
        });
    }, [triggerLogs, getCutoffDate, timeRange, customStartDate, customEndDate]);

    const filteredDisabilityLogs = React.useMemo(() => {
        if (timeRange === 'custom') {
            if (!customStartDate || !customEndDate) return [];
            return disabilityLogs.filter(log => log.date && log.date >= customStartDate && log.date <= customEndDate);
        }
        const cutoffDate = getCutoffDate();
        if (!cutoffDate) return disabilityLogs;
        return disabilityLogs.filter(log => {
             try {
                const [year, month, day] = log.date.split('-').map(Number);
                const logDate = new Date(year, month - 1, day);
                return logDate >= cutoffDate;
            } catch {
                return false;
            }
        });
    }, [disabilityLogs, getCutoffDate, timeRange, customStartDate, customEndDate]);

    const filteredMedicationIntakes = React.useMemo(() => {
        if (timeRange === 'custom') {
            if (!customStartDate || !customEndDate) return [];
            const [startYear, startMonth, startDay] = customStartDate.split('-').map(Number);
            const start = new Date(startYear, startMonth - 1, startDay);
            const [endYear, endMonth, endDay] = customEndDate.split('-').map(Number);
            const end = new Date(endYear, endMonth - 1, endDay);
            end.setHours(23, 59, 59, 999);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
            return medicationIntakes.filter(intake => {
                const intakeDate = new Date(intake.timestamp);
                return !isNaN(intakeDate.getTime()) && intakeDate >= start && intakeDate <= end;
            });
        }
        const cutoffDate = getCutoffDate();
        if (!cutoffDate) return medicationIntakes;
        return medicationIntakes.filter(intake => new Date(intake.timestamp) >= cutoffDate);
    }, [medicationIntakes, getCutoffDate, timeRange, customStartDate, customEndDate]);

    // Memoized calculation for Migraine Days Per Month
    const migraineDaysData = React.useMemo(() => {
        try {
            if (!filteredAttacks || filteredAttacks.length === 0) return null;

            const validDates = filteredAttacks
              .flatMap(a => [a.startTime, a.endTime])
              .filter((d) => !!d)
              .map(d => new Date(d))
              .filter(d => !isNaN(d.getTime()));

            if (validDates.length === 0) return null;
            
            validDates.sort((a, b) => a.getTime() - b.getTime());
            const firstDate = validDates[0];
            const lastDate = validDates[validDates.length - 1];

            const impactedDays = new Set();
            filteredAttacks.forEach(attack => {
                const startDate = new Date(attack.startTime);
                if (isNaN(startDate.getTime())) return;
                
                const endDate = attack.endTime ? new Date(attack.endTime) : startDate;
                if (isNaN(endDate.getTime()) || endDate < startDate) return;

                let currentDate = new Date(startDate);
                currentDate.setHours(0, 0, 0, 0);

                const finalDate = new Date(endDate);
                finalDate.setHours(0, 0, 0, 0);

                while (currentDate <= finalDate) {
                    impactedDays.add(toLocalDateString(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });

            const dataByMonth = {};
            impactedDays.forEach(dayString => {
                const monthKey = dayString.substring(0, 7); // 'YYYY-MM'
                dataByMonth[monthKey] = (dataByMonth[monthKey] || 0) + 1;
            });
            
            const fullMonthRange = getMonthRange(firstDate, lastDate);

            const labels = fullMonthRange.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
            });
            const data = fullMonthRange.map(month => dataByMonth[month] || 0);

            return {
                labels,
                datasets: [{
                    label: 'Days with Migraine',
                    data: data,
                    backgroundColor: 'rgba(141, 179, 139, 0.6)',
                    borderColor: 'rgba(141, 179, 139, 1)',
                    borderWidth: 1,
                }],
            };
        } catch (error) {
            console.error("Error calculating migraine days data:", error);
            return null;
        }
    }, [filteredAttacks]);
    
    const migraineDaysOptions = {
        ...commonChartOptions,
        scales: {
            ...commonChartOptions.scales,
            y: {
                ...commonChartOptions.scales?.y,
                type: 'linear',
                title: { display: true, text: 'Number of Days', color: '#B0A6A1' },
                beginAtZero: true,
                ticks: {
                    ...commonChartOptions.scales?.y?.ticks,
                    stepSize: 1,
                }
            },
        },
        plugins: {
            ...commonChartOptions.plugins,
            legend: {
                display: false,
            }
        }
    };
    
    // Memoized calculation for Attack Frequency and Severity
    const attackFrequencyData = React.useMemo(() => {
        try {
            const validAttacks = filteredAttacks.filter(attack => {
                const date = new Date(attack.startTime);
                return !isNaN(date.getTime());
            });

            if (validAttacks.length === 0) return null;
            
            validAttacks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            const firstDate = new Date(validAttacks[0].startTime);
            const lastDate = new Date(validAttacks[validAttacks.length - 1].startTime);

            const dataByMonth = {};
            validAttacks.forEach(attack => {
                const date = new Date(attack.startTime);
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!dataByMonth[dateKey]) {
                    dataByMonth[dateKey] = { count: 0, severitySum: 0 };
                }
                dataByMonth[dateKey].count++;
                dataByMonth[dateKey].severitySum += attack.severity;
            });

            if (Object.keys(dataByMonth).length === 0) return null;

            const fullMonthRange = getMonthRange(firstDate, lastDate);

            const labels = fullMonthRange.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(parseInt(year), parseInt(monthNum) - 1, 15).toLocaleString('default', { month: 'short', year: '2-digit' });
            });
            
            const counts = fullMonthRange.map(month => dataByMonth[month]?.count || 0);
            const avgSeverities = fullMonthRange.map(month => {
                const monthData = dataByMonth[month];
                // For months with no attacks, the average severity should be 0 to reflect no activity.
                return (monthData && monthData.count > 0) ? (monthData.severitySum / monthData.count) : 0;
            });
            
            // Only show trend line if there are at least two distinct months with data
            if (Object.keys(dataByMonth).length < 2) return null;

            return {
                labels,
                datasets: [
                    {
                        label: 'Number of Attacks',
                        data: counts,
                        borderColor: '#8C7A72',
                        backgroundColor: 'rgba(140, 122, 114, 0.5)',
                        yAxisID: 'y',
                        tension: 0.1
                    },
                    {
                        label: 'Average Severity',
                        data: avgSeverities,
                        borderColor: '#D9A056',
                        backgroundColor: 'rgba(217, 160, 86, 0.5)',
                        yAxisID: 'y1',
                        tension: 0.1,
                        spanGaps: false,
                    }
                ],
            };
        } catch (error) {
            console.error("Error calculating attack frequency data:", error);
            return null; // Return null on error to prevent crash
        }
    }, [filteredAttacks]);

    const attackFrequencyOptions = {
        ...commonChartOptions,
        scales: {
            x: commonChartOptions.scales?.x,
            y: {
                ...commonChartOptions.scales?.y,
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Number of Attacks', color: '#B0A6A1'},
                beginAtZero: true,
            },
            y1: {
                ...commonChartOptions.scales?.y,
                type: 'linear',
                display: true,
                position: 'right',
                min: 0,
                max: 10,
                title: { display: true, text: 'Avg Severity (0-10)', color: '#B0A6A1'},
                grid: { drawOnChartArea: false },
            },
        }
    };
    
    // Memoized calculation for Trigger Correlation
    const triggerCorrelationData = React.useMemo(() => {
        try {
            if (filteredAttacks.length === 0 || !triggers.length || filteredTriggerLogs.length === 0) return null;

            const migraineStartDays = new Set(
                filteredAttacks.map(attack => toLocalDateString(attack.startTime)).filter(Boolean)
            );
            if (migraineStartDays.size === 0) return null;

            const triggerStats = {};
            triggers.forEach(t => {
                triggerStats[t.id] = {
                    name: t.name,
                    triggerDaysCount: 0,
                    migraineDaysWithTriggerCount: 0,
                };
            });

            filteredTriggerLogs.forEach(log => {
                const logDate = log.date;
                if (!log.values || !logDate) return;

                Object.keys(log.values).forEach(triggerId => {
                    if (log.values[triggerId] && triggerStats[triggerId]) {
                        triggerStats[triggerId].triggerDaysCount++;

                        const [year, month, day] = logDate.split('-').map(num => parseInt(num, 10));
                        const logDateObj = new Date(year, month - 1, day);
                        
                        const nextDayObj = new Date(logDateObj);
                        nextDayObj.setDate(nextDayObj.getDate() + 1);
                        const nextDayString = toLocalDateString(nextDayObj);

                        if (migraineStartDays.has(logDate) || migraineStartDays.has(nextDayString)) {
                            triggerStats[triggerId].migraineDaysWithTriggerCount++;
                        }
                    }
                });
            });

            const correlationAnalysis = Object.values(triggerStats)
                .map(stats => {
                    if (stats.triggerDaysCount === 0) return null;
                    return {
                        name: stats.name,
                        percentage: (stats.migraineDaysWithTriggerCount / stats.triggerDaysCount) * 100,
                        triggerDaysCount: stats.triggerDaysCount,
                        migraineDaysWithTriggerCount: stats.migraineDaysWithTriggerCount,
                    };
                })
                .filter(item => item && item.triggerDaysCount > 0)
                .sort((a, b) => b.percentage - a.percentage);

            if (correlationAnalysis.length === 0) return null;

            const labels = correlationAnalysis.map(item => item.name);
            const data = correlationAnalysis.map(item => item.percentage);
            const meta = correlationAnalysis.map(item => ({
                migraineDays: item.migraineDaysWithTriggerCount,
                totalDays: item.triggerDaysCount
            }));

            return {
                labels,
                datasets: [{
                    label: 'Migraine Chance on Trigger Day (%)',
                    data: data,
                    backgroundColor: 'rgba(217, 120, 86, 0.6)',
                    borderColor: 'rgba(217, 120, 86, 1)',
                    borderWidth: 1,
                    meta: meta,
                }],
            };
        } catch (error) {
            console.error("Error calculating trigger correlation data:", error);
            return null;
        }
    }, [filteredAttacks, triggers, filteredTriggerLogs]);

    const triggerCorrelationOptions = {
        ...commonChartOptions,
        indexAxis: 'y',
        plugins: {
            ...commonChartOptions.plugins,
            title: { display: false },
            legend: { display: false },
            tooltip: { 
                ...commonChartOptions.plugins?.tooltip,
                callbacks: {
                    label: function(context) {
                        const percentage = context.raw;
                        const metaData = (context.dataset).meta?.[context.dataIndex];
                        if (metaData) {
                            const { migraineDays, totalDays } = metaData;
                            return `On the ${totalDays} days this was logged, a migraine followed on ${migraineDays} of them (${percentage.toFixed(1)}%).`;
                        }
                        return `Migraine occurred on ${percentage.toFixed(1)}% of days with this trigger.`;
                    }
                }
            }
        },
        scales: {
            x: {
                ...commonChartOptions.scales?.x,
                type: 'linear',
                title: { display: true, text: 'Migraine Probability on Trigger Days (%)', color: '#B0A6A1'},
                ticks: {
                    ...commonChartOptions.scales?.x?.ticks,
                    callback: (value) => value + "%"
                },
                max: 100,
            },
            y: commonChartOptions.scales?.y
        }
    };
    
    // Memoized calculation for Symptom Frequency
    const symptomFrequencyData = React.useMemo(() => {
        try {
            // Use filteredAttacks which is already time-range filtered.
            if (!filteredAttacks || filteredAttacks.length === 0) return null;

            const symptomCounts = {};
            filteredAttacks.forEach(attack => {
                // It's good practice to check if attack.symptoms exists and is an array
                if (Array.isArray(attack.symptoms)) {
                    attack.symptoms.forEach(symptom => {
                        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
                    });
                }
            });

            if (Object.keys(symptomCounts).length === 0) return null;

            const sortedSymptoms = Object.entries(symptomCounts)
                .sort(([, a], [, b]) => b - a);

            const labels = sortedSymptoms.map(([symptom]) => symptom);
            const data = sortedSymptoms.map(([, count]) => count);

            return {
                labels,
                datasets: [{
                    label: 'Symptom Occurrences',
                    data,
                    backgroundColor: 'rgba(217, 86, 99, 0.6)',
                    borderColor: 'rgba(217, 86, 99, 1)',
                    borderWidth: 1,
                }],
            };
        } catch (error) {
            console.error("Error calculating symptom frequency data:", error);
            return null;
        }
    }, [filteredAttacks]);

    const symptomFrequencyOptions = {
        ...commonChartOptions,
        indexAxis: 'y',
        plugins: {
            ...commonChartOptions.plugins,
            title: { display: false },
            legend: { display: false }
        },
        scales: {
            x: {
                ...commonChartOptions.scales?.x,
                type: 'linear',
                title: { display: true, text: 'Number of Occurrences', color: '#B0A6A1'},
                beginAtZero: true,
                ticks: {
                    ...commonChartOptions.scales?.x?.ticks,
                    stepSize: 1,
                }
            },
            y: {
                ...commonChartOptions.scales?.y,
                ticks: {
                     ...commonChartOptions.scales?.y?.ticks,
                    autoSkip: false
                }
            }
        }
    };

    // Memoized calculation for MOH Risk
    const mohData = React.useMemo(() => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const intakesInLast30Days = medicationIntakes.filter(intake => {
                try {
                    return new Date(intake.timestamp) >= thirtyDaysAgo;
                } catch { return false; }
            });

            const getPercentage = (days, threshold) => {
                if (threshold > 0) {
                    return Math.min((days / threshold) * 100, 100);
                }
                // If threshold is 0, any usage is considered overuse.
                return days > 0 ? 100 : 0;
            };

            // Create a map for quick lookup of medication types
            const medTypeMap = new Map(medications.map(med => [med.id, med.type]));
    
            // Filter for abortive intakes in the last 30 days
            const abortiveIntakesInLast30Days = intakesInLast30Days.filter(intake => 
                medTypeMap.get(intake.medicationId) === MedicationType.Abortive
            );
    
            // 1. Calculate the 'Any Combination' rule
            const uniqueAbortiveMedsTaken = new Set(
                abortiveIntakesInLast30Days.map(intake => intake.medicationId)
            );
    
            let anyComboDays = 0;
            // The "combination" rule only applies if more than one distinct abortive med was used.
            if (uniqueAbortiveMedsTaken.size > 1) {
                anyComboDays = new Set(
                    abortiveIntakesInLast30Days.map(i => toLocalDateString(i.timestamp))
                ).size;
            }

            const anyComboData = {
                name: 'Any Combination of Meds',
                days: anyComboDays,
                threshold: 9,
                percentage: getPercentage(anyComboDays, 9),
            };

            // 2. Calculate rules for each specific category
            const categoryData = mohRules.map(rule => {
                const relevantMedIds = new Set(
                    medications
                        .filter(med => 
                            med.type === MedicationType.Abortive && 
                            med.mohCategories?.includes(rule.medicationType)
                        )
                        .map(med => med.id)
                );

                const daysWithIntake = new Set(
                    intakesInLast30Days
                        .filter(intake => relevantMedIds.has(intake.medicationId))
                        .map(i => toLocalDateString(i.timestamp))
                ).size;
                
                return {
                    name: rule.medicationType,
                    days: daysWithIntake,
                    threshold: rule.threshold,
                    percentage: getPercentage(daysWithIntake, rule.threshold)
                };
            });

            return [anyComboData, ...categoryData];
        } catch (error) {
            console.error("Error calculating MOH data:", error);
            return []; // Return empty array on error
        }
    }, [medicationIntakes, medications, mohRules]);

     const disabilityScoreData = React.useMemo(() => {
        try {
            if (!filteredDisabilityLogs || filteredDisabilityLogs.length === 0) return null;
            
            const logsByMonth = {};
            const validDates = [];

            filteredDisabilityLogs.forEach(log => {
                const date = new Date(log.date);
                if (isNaN(date.getTime())) return;
                validDates.push(date);
                const monthKey = log.date.substring(0, 7);
                if (!logsByMonth[monthKey]) {
                    logsByMonth[monthKey] = { sum: 0, count: 0 };
                }
                logsByMonth[monthKey].sum += log.score;
                logsByMonth[monthKey].count++;
            });
            
            if (validDates.length === 0) return null;
            
            validDates.sort((a,b) => a - b);
            const firstDate = validDates[0];
            const lastDate = validDates[validDates.length - 1];
            const fullMonthRange = getMonthRange(firstDate, lastDate);

            const labels = fullMonthRange.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
            });
            const data = fullMonthRange.map(month => {
                const monthData = logsByMonth[month];
                return monthData ? monthData.sum / monthData.count : 0;
            });

            return {
                labels,
                datasets: [{
                    label: 'Avg. Disability Score',
                    data: data,
                    borderColor: '#D95663',
                    backgroundColor: 'rgba(217, 86, 99, 0.5)',
                    tension: 0.1
                }]
            };
        } catch (error) {
            console.error("Error calculating disability score data:", error);
            return null;
        }
    }, [filteredDisabilityLogs]);

    const disabilityScoreOptions = {
        ...commonChartOptions,
        scales: {
            ...commonChartOptions.scales,
            y: {
                ...commonChartOptions.scales?.y,
                title: { display: true, text: 'Avg. Score (0-3)', color: '#B0A6A1' },
                min: 0,
                max: 3,
            }
        },
        plugins: { ...commonChartOptions.plugins, legend: { display: false } }
    };

    const medEffectivenessData = React.useMemo(() => {
        try {
            const relevantIntakes = filteredMedicationIntakes.filter(i => i.effectiveness);
            if (relevantIntakes.length === 0) return null;

            const stats = {};
            relevantIntakes.forEach(intake => {
                const medId = intake.medicationId;
                if (!stats[medId]) {
                    stats[medId] = { total: 0, effective: 0, partially_effective: 0, not_effective: 0 };
                }
                stats[medId].total++;
                if (intake.effectiveness === 'effective') stats[medId].effective++;
                else if (intake.effectiveness === 'partially_effective') stats[medId].partially_effective++;
                else if (intake.effectiveness === 'not_effective') stats[medId].not_effective++;
            });
            
            const medMap = new Map(medications.map(m => [m.id, m.name]));
            
            const dataForChart = Object.entries(stats)
                .map(([medId, data]) => ({
                    medId,
                    name: medMap.get(medId) || 'Unknown',
                    ...data
                }))
                .sort((a, b) => {
                     // Sort by highest percentage of 'effective' doses
                    const effectivenessA = a.total > 0 ? a.effective / a.total : 0;
                    const effectivenessB = b.total > 0 ? b.effective / b.total : 0;
                    return effectivenessB - effectivenessA;
                });

            if (dataForChart.length === 0) return null;

            const labels = dataForChart.map(d => d.name);

            return {
                labels,
                datasets: [
                    {
                        label: 'Effective',
                        data: dataForChart.map(d => d.total > 0 ? (d.effective / d.total) * 100 : 0),
                        backgroundColor: '#8DB38B', // dark-success
                        meta: dataForChart,
                    },
                    {
                        label: 'Partially Effective',
                        data: dataForChart.map(d => d.total > 0 ? (d.partially_effective / d.total) * 100 : 0),
                        backgroundColor: '#D9A056', // dark-warning
                        meta: dataForChart,
                    },
                    {
                        label: 'Not Effective',
                        data: dataForChart.map(d => d.total > 0 ? (d.not_effective / d.total) * 100 : 0),
                        backgroundColor: '#D95663', // dark-danger
                        meta: dataForChart,
                    },
                ]
            };
        } catch (error) {
            console.error("Error calculating medication effectiveness:", error);
            return null;
        }
    }, [filteredMedicationIntakes, medications]);

    const medEffectivenessOptions = {
        ...commonChartOptions,
        indexAxis: 'y',
        plugins: {
            ...commonChartOptions.plugins,
            legend: { display: true },
             tooltip: {
                ...commonChartOptions.plugins.tooltip,
                callbacks: {
                    label: function(context) {
                        const effectivenessLevel = context.dataset.label;
                        const percentage = context.raw;
                        
                        const allMeta = context.dataset.meta;
                        if (!allMeta || !allMeta[context.dataIndex]) return `${effectivenessLevel}: ${percentage.toFixed(1)}%`;
                        
                        const itemMeta = allMeta[context.dataIndex];
                        const levelKey = effectivenessLevel.toLowerCase().replace(/ /g, '_');
                        const count = itemMeta[levelKey] || 0;
                        const total = itemMeta.total;

                        return `${effectivenessLevel}: ${percentage.toFixed(1)}% (${count}/${total} doses)`;
                    }
                }
            }
        },
        scales: { 
            ...commonChartOptions.scales, 
            x: { 
                ...commonChartOptions.scales.x, 
                max: 100, 
                stacked: true,
                title: { display: true, text: 'Effectiveness Breakdown (%)', color: '#B0A6A1' } 
            },
            y: {
                ...commonChartOptions.scales.y,
                stacked: true,
            }
        }
    };

    const weeklyCycleData = React.useMemo(() => {
        try {
            if (filteredAttacks.length === 0) return null;
            const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun -> Sat
            filteredAttacks.forEach(attack => {
                const day = new Date(attack.startTime).getDay();
                dayCounts[day]++;
            });
            return {
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                    label: 'Number of Attacks',
                    data: dayCounts,
                    backgroundColor: 'rgba(217, 160, 86, 0.6)'
                }]
            };
        } catch (error) {
            console.error("Error calculating weekly cycle:", error);
            return null;
        }
    }, [filteredAttacks]);

    const weeklyCycleOptions = {
        ...commonChartOptions,
        plugins: { ...commonChartOptions.plugins, legend: { display: false } },
        scales: { ...commonChartOptions.scales, y: { ...commonChartOptions.scales.y, title: { display: true, text: 'Number of Attacks', color: '#B0A6A1' } } }
    };

    const timeOfDayData = React.useMemo(() => {
        try {
            if (filteredAttacks.length === 0) return null;

            const timeOfDayCounts = {
                'Overnight / Early Morning': 0, // 0-6 (midnight to 7am)
                'Morning': 0,                   // 7-11 (7am to 12pm)
                'Afternoon': 0,                 // 12-16 (12pm to 5pm)
                'Evening': 0,                   // 17-21 (5pm to 10pm)
                'Late Night': 0,                // 22-23 (10pm to midnight)
            };

            filteredAttacks.forEach(attack => {
                try {
                    const hour = new Date(attack.startTime).getHours();
                    if (isNaN(hour)) return;

                    if (hour < 7) {
                        timeOfDayCounts['Overnight / Early Morning']++;
                    } else if (hour < 12) {
                        timeOfDayCounts['Morning']++;
                    } else if (hour < 17) {
                        timeOfDayCounts['Afternoon']++;
                    } else if (hour < 22) {
                        timeOfDayCounts['Evening']++;
                    } else {
                        timeOfDayCounts['Late Night']++;
                    }
                } catch(e) {
                    // Ignore attacks with invalid start times
                }
            });
            
            const labels = Object.keys(timeOfDayCounts).map(label => 
                label === 'Overnight / Early Morning' ? ['Overnight /', 'Early Morning'] : label
            );
            const data = Object.values(timeOfDayCounts);

            return {
                labels: labels,
                datasets: [{
                    label: 'Number of Attacks',
                    data: data,
                    backgroundColor: 'rgba(140, 122, 114, 0.6)'
                }]
            };
        } catch (error) {
            console.error("Error calculating time of day data:", error);
            return null;
        }
    }, [filteredAttacks]);

    const timeOfDayOptions = {
        ...commonChartOptions,
        plugins: { ...commonChartOptions.plugins, legend: { display: false } },
        scales: { 
            ...commonChartOptions.scales, 
            x: {
                ...commonChartOptions.scales.x,
                ticks: {
                    ...commonChartOptions.scales.x.ticks,
                    autoSkip: false, // Ensure all labels are shown
                },
            },
            y: { 
                ...commonChartOptions.scales.y, 
                title: { display: true, text: 'Number of Attacks', color: '#B0A6A1' } 
            } 
        }
    };
    
    const timeRangeOptions = [
        { id: '3m', label: 'Last 3 Months' },
        { id: '6m', label: 'Last 6 Months' },
        { id: '12m', label: 'Last 12 Months' },
        { id: 'all', label: 'All Time' },
        { id: 'custom', label: 'Custom Range' },
    ];

    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('h2', { className: "text-3xl font-bold text-dark-text-primary" }, "Analytics"),
            
            React.createElement('div', { className: "grid grid-cols-1 xl:grid-cols-2 gap-6" },
                React.createElement(Card, { className: "xl:col-span-2" },
                    React.createElement('div', { className: "flex flex-col sm:flex-row justify-between sm:items-center gap-4" },
                        React.createElement('div', { className: 'flex-grow' },
                            React.createElement('h3', { className: "text-xl font-bold text-dark-text-primary" }, "Trends Over Time"),
                             React.createElement('p', { className: "text-sm text-dark-text-secondary" },
                                "View historical data for migraine days and attack frequency."
                            )
                        ),
                        React.createElement('div', { className: "flex items-center gap-2 flex-wrap justify-center bg-dark-bg p-1 rounded-full" },
                            timeRangeOptions.map(option => (
                                React.createElement(Chip, 
                                    {
                                        key: option.id,
                                        selected: timeRange === option.id,
                                        onClick: () => handleTimeRangeChange(option.id)
                                    },
                                    option.label
                                )
                            ))
                        )
                    ),
                    timeRange === 'custom' && React.createElement('div', { className: "mt-4 pt-4 border-t border-dark-border flex flex-col sm:flex-row items-center gap-4" },
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement(Label, { htmlFor: 'start-date' }, 'From:'),
                            React.createElement(Input, {
                                type: 'date',
                                id: 'start-date',
                                value: customStartDate,
                                onChange: e => setCustomStartDate(e.target.value)
                            })
                        ),
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement(Label, { htmlFor: 'end-date' }, 'To:'),
                            React.createElement(Input, {
                                type: 'date',
                                id: 'end-date',
                                value: customEndDate,
                                onChange: e => setCustomEndDate(e.target.value)
                            })
                        )
                    )
                ),
                React.createElement(Card, { title: "Migraine Days Per Month" },
                    React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4 -mt-2" },
                        "Total number of calendar days impacted by a migraine attack each month."
                    ),
                   React.createElement('div', { className: "h-96" },
                        migraineDaysData ? (
                            React.createElement(ChartComponent, { type: "bar", data: migraineDaysData, options: migraineDaysOptions })
                        ) : (
                            React.createElement('div', { className: "flex items-center justify-center h-full" },
                               React.createElement('p', { className: "text-dark-text-secondary text-center" }, "Log your migraine attacks to see this chart.")
                            )
                        )
                   )
                ),
                React.createElement(Card, { title: "Attack Frequency & Severity" },
                   React.createElement('div', { className: "h-96" },
                        attackFrequencyData ? (
                            React.createElement(ChartComponent, { type: "line", data: attackFrequencyData, options: attackFrequencyOptions })
                        ) : (
                            React.createElement('div', { className: "flex items-center justify-center h-full" },
                               React.createElement('p', { className: "text-dark-text-secondary text-center" }, "Not enough data to display a trend. Please log attacks in at least two different months.")
                            )
                        )
                   )
                ),
                React.createElement(Card, { title: "Functional Disability Over Time" },
                   React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4 -mt-2" }, "Monthly average of your daily functional disability score (0-3)."),
                   React.createElement('div', { className: "h-96" },
                        disabilityScoreData ? (
                            React.createElement(ChartComponent, { type: "line", data: disabilityScoreData, options: disabilityScoreOptions })
                        ) : (
                            React.createElement('div', { className: "flex items-center justify-center h-full" },
                               React.createElement('p', { className: "text-dark-text-secondary text-center" }, "Log your daily disability score to see this chart.")
                            )
                        )
                   )
                ),
                 React.createElement(Card, { title: "Medication Effectiveness" },
                   React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4 -mt-2" }, "Effectiveness breakdown of each medication, showing the percentage of doses that were effective, partially effective, or not effective."),
                   React.createElement('div', { className: "h-96" },
                        medEffectivenessData ? (
                            React.createElement(ChartComponent, { type: "bar", data: medEffectivenessData, options: medEffectivenessOptions })
                        ) : (
                            React.createElement('div', { className: "flex items-center justify-center h-full" },
                               React.createElement('p', { className: "text-dark-text-secondary text-center" }, "Log medication intakes and their effectiveness to see this chart.")
                            )
                        )
                   )
                ),
                React.createElement(Card, { title: "Weekly Migraine Cycle" },
                   React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4 -mt-2" }, "Total number of migraine attacks started on each day of the week."),
                   React.createElement('div', { className: "h-96" },
                        weeklyCycleData ? (
                            React.createElement(ChartComponent, { type: "bar", data: weeklyCycleData, options: weeklyCycleOptions })
                        ) : (
                            React.createElement('div', { className: "flex items-center justify-center h-full" },
                               React.createElement('p', { className: "text-dark-text-secondary text-center" }, "Log migraine attacks to see this chart.")
                            )
                        )
                   )
                ),
                React.createElement(Card, { title: "Time of Day Patterns" },
                   React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4 -mt-2" }, "Breakdown of when migraine attacks typically start throughout the day."),
                   React.createElement('div', { className: "h-96" },
                        timeOfDayData ? (
                            React.createElement(ChartComponent, { type: "bar", data: timeOfDayData, options: timeOfDayOptions })
                        ) : (
                            React.createElement('div', { className: "flex items-center justify-center h-full" },
                               React.createElement('p', { className: "text-dark-text-secondary text-center" }, "Log migraine attacks to see this chart.")
                            )
                        )
                   )
                ),
                React.createElement(Card, { title: "Trigger Impact Analysis" },
                    React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4 -mt-2" },
                        "This chart shows the percentage of days a migraine occurred when a trigger was logged on that day or the day before. This helps identify triggers with a higher probability of being followed by an attack."
                    ),
                    React.createElement('div', { className: "h-96" },
                       triggerCorrelationData && triggerCorrelationData.labels.length > 0 ? (
                            React.createElement(ChartComponent, { type: "bar", data: triggerCorrelationData, options: triggerCorrelationOptions })
                       ) : (
                           React.createElement('div', { className: "flex items-center justify-center h-full" },
                             React.createElement('p', { className: "text-dark-text-secondary text-center" }, "Not enough data to perform analysis. Log your daily triggers and migraine attacks to see this chart.")
                           )
                       )
                    )
                ),
                React.createElement(Card, { title: "Symptom Frequency" },
                    React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4 -mt-2" },
                        "Common symptoms reported during migraine attacks in the selected time range."
                    ),
                    React.createElement('div', { className: "h-96" },
                       symptomFrequencyData ? (
                            React.createElement(ChartComponent, { type: "bar", data: symptomFrequencyData, options: symptomFrequencyOptions })
                       ) : (
                           React.createElement('div', { className: "flex items-center justify-center h-full" },
                             React.createElement('p', { className: "text-dark-text-secondary text-center" }, "Log attacks with symptoms to see this chart.")
                           )
                       )
                    )
                ),
                 React.createElement(Card, { title: "Medication Overuse Risk (Last 30 Days)", className: "xl:col-span-2" },
                    React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4" },
                        "This tracks the number of days you've used certain types of acute medication. Frequent use can be a risk factor for Medication Overuse Headache (MOH).",
                        React.createElement('br'),
                        React.createElement('em', { className: "text-xs" }, "This is for informational purposes only and is not medical advice.")
                    ),
                    React.createElement('div', { className: "space-y-4" },
                        mohData.length > 0 ? mohData.map(data => (
                            React.createElement('div', { key: data.name },
                                React.createElement('div', { className: "flex justify-between items-center mb-1 text-sm" },
                                    React.createElement('span', { className: "font-semibold" }, data.name),
                                    React.createElement('span', { className: "text-dark-text-secondary" }, `${data.days} / ${data.threshold} days`)
                                ),
                                React.createElement('div', { className: "w-full bg-dark-bg rounded-full h-2.5" },
                                    React.createElement('div', 
                                        {
                                            className: `h-2.5 rounded-full transition-all duration-500 ${data.percentage >= 80 ? 'bg-dark-danger' : data.percentage >= 50 ? 'bg-dark-warning' : 'bg-dark-primary'}`, 
                                            style: { width: `${data.percentage}%`}
                                        }
                                    )
                                )
                            )
                        )) : (
                             React.createElement('div', { className: "flex items-center justify-center h-full pt-8" },
                                React.createElement('p', { className: "text-dark-text-secondary text-center text-sm" }, "No medication overuse rules are configured or no relevant medications have been taken in the last 30 days.")
                           )
                        )
                    )
                )
            )
        )
    );
};

export default Analytics;
