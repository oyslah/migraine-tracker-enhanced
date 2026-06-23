import { MedicationType } from '../types.js';
import { MOH_CATEGORIES } from '../constants.js';

// Ensures every attack object conforms to the latest MigraineAttack interface.
export const migrateAttacks = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map(attack => {
    if (typeof attack !== 'object' || attack === null) return null;

    // Clean the triggers object to only include boolean values.
    // This removes any leftover data from the old weather feature (e.g., temperature)
    // ensuring data consistency for the rest of the app.
    let cleanedTriggers = {};
    if (typeof attack.triggers === 'object' && attack.triggers !== null) {
        for (const key in attack.triggers) {
            if (Object.prototype.hasOwnProperty.call(attack.triggers, key) && typeof attack.triggers[key] === 'boolean') {
                cleanedTriggers[key] = attack.triggers[key];
            }
        }
    }

    const symptoms = Array.isArray(attack.symptoms) ? attack.symptoms.filter((s) => typeof s === 'string') : [];
    // MIGRATION: If the old `hasAura` property was true, add "Aura" to the symptoms list if it's not already there.
    if (attack.hasAura === true && !symptoms.includes('Aura')) {
        symptoms.push('Aura');
    }

    const newAttack = {
      id: String(attack.id || `migrated-${Date.now()}`),
      startTime: String(attack.startTime || new Date().toISOString()),
      severity: typeof attack.severity === 'number' ? attack.severity : 5,
      symptoms: symptoms,
      triggers: cleanedTriggers,
    };

    if (typeof attack.endTime === 'string' && attack.endTime) {
      newAttack.endTime = attack.endTime;
    }

    if (typeof attack.notes === 'string' && attack.notes) {
      newAttack.notes = attack.notes;
    }

    return newAttack;
  }).filter((attack) => attack !== null);
};

// Ensures every trigger log object conforms to the latest TriggerLog interface.
export const migrateTriggerLogs = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map(log => {
        if (typeof log !== 'object' || log === null) return null;
        
        const cleanedValues = {};
        if (typeof log.values === 'object' && log.values !== null) {
            for (const key in log.values) {
                if (Object.prototype.hasOwnProperty.call(log.values, key) && typeof log.values[key] === 'boolean') {
                    cleanedValues[key] = log.values[key];
                }
            }
        }

        return {
            date: log.date || new Date().toISOString().split('T')[0],
            values: cleanedValues,
        };
    }).filter((log) => log !== null);
};

// Ensures every medication object conforms to the latest Medication interface.
export const migrateMedications = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map(med => {
        if (typeof med !== 'object' || med === null) return null;
        const migratedMed = {
            id: med.id || `migrated-med-${Date.now()}`,
            name: med.name || 'Unknown Medication',
            type: med.type === MedicationType.Abortive || med.type === MedicationType.Preventive || med.type === MedicationType.CGRPInhibitor ? med.type : MedicationType.Abortive,
            dose: med.dose,
        };
        if (migratedMed.type === MedicationType.Preventive) {
            migratedMed.reminderEnabled = typeof med.reminderEnabled === 'boolean' ? med.reminderEnabled : false;

            const reminderTimes = [];
            if (Array.isArray(med.reminderTimes)) {
                med.reminderTimes.forEach((t) => {
                    if (typeof t === 'string' && t) reminderTimes.push(t);
                });
            } else if (typeof med.reminderTime === 'string' && med.reminderTime) {
                reminderTimes.push(med.reminderTime);
            }

            if (reminderTimes.length === 0) {
                reminderTimes.push('08:00'); // Default if no times are found
            }
            migratedMed.reminderTimes = reminderTimes;
        }

        if (migratedMed.type === MedicationType.Abortive) {
            if (Array.isArray(med.mohCategories)) {
                 migratedMed.mohCategories = med.mohCategories.map((cat) => {
                    if (cat === 'Simple Analgesics') return 'Non-Opioid Analgesics';
                    if (cat === 'Combination Analgesics') return 'Combination Analgesics with Caffeine';
                    if (cat === 'Opioids') return 'Opioids or Barbiturates';
                    if (MOH_CATEGORIES.includes(cat)) return cat;
                    return null;
                }).filter((cat) => cat !== null);
            } else if (!med.mohCategories) { // Add default MOH categories for old data for backward compatibility
                if (med.id === 'sumatriptan') {
                    migratedMed.mohCategories = ['Triptans'];
                } else if (med.id === 'ibuprofen') {
                    migratedMed.mohCategories = ['Non-Opioid Analgesics'];
                } else {
                    migratedMed.mohCategories = [];
                }
            }
        }
        
        return migratedMed;
    }).filter((med) => med !== null);
};

// Ensures every medication intake object conforms to the latest MedicationIntake interface.
export const migrateMedicationIntakes = (data) => {
    if (!Array.isArray(data)) return [];
    return data
        .map(intake => {
            if (typeof intake !== 'object' || intake === null) return null;
            if (!intake.id || !intake.medicationId || !intake.timestamp) return null;
            
            let effectiveness;
            if (intake.effectiveness) { // Already migrated or new format
                effectiveness = intake.effectiveness;
            } else if (typeof intake.abortedMigraine === 'boolean') { // Old format
                if (intake.abortedMigraine) {
                    effectiveness = 'effective';
                } else if (intake.secondDoseNeeded === true) {
                    effectiveness = 'partially_effective';
                } else {
                    effectiveness = 'not_effective';
                }
            }
            
            return {
                id: String(intake.id),
                medicationId: String(intake.medicationId),
                timestamp: String(intake.timestamp),
                dose: String(intake.dose || 'N/A'),
                effectiveness: effectiveness,
            };
        })
        .filter((intake) => intake !== null);
};

// Ensures every trigger object conforms to the latest Trigger interface.
export const migrateTriggers = (data) => {
    if (!Array.isArray(data)) return [];
    return data
        .map(trigger => {
            if (typeof trigger !== 'object' || trigger === null) return null;
            if (!trigger.id || !trigger.name) return null;
            return {
                id: String(trigger.id),
                name: String(trigger.name),
            };
        })
        .filter((trigger) => trigger !== null);
};

// Ensures every MOH rule object conforms to the latest MOHRule interface.
export const migrateMohRules = (data) => {
    if (!Array.isArray(data)) return [];
    return data
        .map(rule => {
            if (typeof rule !== 'object' || rule === null || typeof rule.threshold !== 'number') return null;
            
            let medicationType = rule.medicationType;
            if (medicationType === 'Simple Analgesics') medicationType = 'Non-Opioid Analgesics';
            else if (medicationType === 'Combination Analgesics') medicationType = 'Combination Analgesics with Caffeine';
            else if (medicationType === 'Opioids') medicationType = 'Opioids or Barbiturates';
            
            if (!medicationType || !MOH_CATEGORIES.includes(medicationType)) return null;

            return {
                medicationType: medicationType,
                threshold: rule.threshold,
            };
        })
        .filter((rule) => rule !== null);
};

// Ensures symptom data is in the object format {id, name} required by the database.
export const migrateSymptoms = (data) => {
    if (!Array.isArray(data)) return [];
    // Convert string array to object array for DB storage
    return data.filter((symptom) => typeof symptom === 'string' && symptom)
        .map(symptom => ({ id: symptom, name: symptom }));
};