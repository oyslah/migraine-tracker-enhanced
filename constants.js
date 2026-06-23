import { MedicationType } from './types.js';

export const DEFAULT_TRIGGERS = [
  { id: 'stress', name: 'High Stress' },
  { id: 'sleep', name: 'Poor Sleep' },
  { id: 'hydration', name: 'Dehydrated' },
  { id: 'caffeine', name: 'High Caffeine' },
  { id: 'menstruation', name: 'Menstruation' },
  { id: 'chocolate', name: 'Chocolate' },
  { id: 'aged_cheese', name: 'Aged Cheese' },
  { id: 'processed_meats', name: 'Processed Meats' },
  { id: 'citrus_fruits', name: 'Citrus Fruits' },
  { id: 'red_wine', name: 'Red Wine' },
];

export const MOH_CATEGORIES = [
  'Non-Opioid Analgesics',
  'Combination Analgesics with Caffeine',
  'Triptans',
  'Ergotamines',
  'Opioids or Barbiturates',
];

export const DEFAULT_MEDICATIONS = [
    { id: 'sumatriptan', name: 'Sumatriptan', type: MedicationType.Abortive, dose: '50mg', mohCategories: ['Triptans'] },
    { id: 'ibuprofen', name: 'Ibuprofen', type: MedicationType.Abortive, dose: '400mg', mohCategories: ['Non-Opioid Analgesics'] },
    { id: 'ubrogepant', name: 'Ubrogepant (Ubrelvy)', type: MedicationType.CGRPInhibitor, dose: '50mg' },
    { id: 'topiramate', name: 'Topiramate', type: MedicationType.Preventive, dose: '50mg', reminderTimes: ['08:00', '20:00'], reminderEnabled: false },
];

export const DEFAULT_MOH_RULES = [
    { medicationType: 'Non-Opioid Analgesics', threshold: 15 },
    { medicationType: 'Combination Analgesics with Caffeine', threshold: 9 },
    { medicationType: 'Triptans', threshold: 9 },
    { medicationType: 'Ergotamines', threshold: 9 },
    { medicationType: 'Opioids or Barbiturates', threshold: 9 },
];

export const DEFAULT_SYMPTOMS = [
  "Aura", "Pulsating pain", "One-sided pain", "Nausea", "Vomiting", 
  "Sensitivity to light", "Sensitivity to sound", "Visual disturbances", "Vertigo", "Fatigue"
];
