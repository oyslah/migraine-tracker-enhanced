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
    // --- Triptans (first-line acute) ---
    { id: 'sumatriptan', name: 'Sumatriptan (Imitrex)', type: MedicationType.Abortive, dose: '50mg', mohCategories: ['Triptans'] },
    { id: 'rizatriptan', name: 'Rizatriptan (Maxalt)', type: MedicationType.Abortive, dose: '10mg', mohCategories: ['Triptans'] },
    { id: 'eletriptan', name: 'Eletriptan (Relpax)', type: MedicationType.Abortive, dose: '40mg', mohCategories: ['Triptans'] },
    { id: 'zolmitriptan', name: 'Zolmitriptan (Zomig)', type: MedicationType.Abortive, dose: '5mg', mohCategories: ['Triptans'] },
    { id: 'naratriptan', name: 'Naratriptan (Amerge)', type: MedicationType.Abortive, dose: '2.5mg', mohCategories: ['Triptans'] },
    { id: 'almotriptan', name: 'Almotriptan (Axert)', type: MedicationType.Abortive, dose: '12.5mg', mohCategories: ['Triptans'] },
    { id: 'frovatriptan', name: 'Frovatriptan (Frova)', type: MedicationType.Abortive, dose: '2.5mg', mohCategories: ['Triptans'] },
    // --- Gepants (CGRP inhibitors) ---
    { id: 'ubrogepant', name: 'Ubrogepant (Ubrelvy)', type: MedicationType.CGRPInhibitor, dose: '50mg' },
    { id: 'rimegepant', name: 'Rimegepant (Nurtec)', type: MedicationType.CGRPInhibitor, dose: '75mg' },
    // --- Ditans ---
    { id: 'lasmiditan', name: 'Lasmiditan (Reyvow)', type: MedicationType.Abortive, dose: '50mg', mohCategories: [] },
    // --- OTC / Combination Analgesics ---
    { id: 'ibuprofen', name: 'Ibuprofen (Advil)', type: MedicationType.Abortive, dose: '400mg', mohCategories: ['Non-Opioid Analgesics'] },
    { id: 'naproxen', name: 'Naproxen (Aleve)', type: MedicationType.Abortive, dose: '220mg', mohCategories: ['Non-Opioid Analgesics'] },
    { id: 'acetaminophen', name: 'Acetaminophen (Tylenol)', type: MedicationType.Abortive, dose: '500mg', mohCategories: ['Non-Opioid Analgesics'] },
    { id: 'excedrin_migraine', name: 'Excedrin Migraine', type: MedicationType.Abortive, dose: '250/250/65mg', mohCategories: ['Combination Analgesics with Caffeine'] },
    // --- Preventives ---
    { id: 'topiramate', name: 'Topiramate (Topamax)', type: MedicationType.Preventive, dose: '50mg', reminderTimes: ['08:00', '20:00'], reminderEnabled: false },
];

export const DEFAULT_MOH_RULES = [
    { medicationType: 'Non-Opioid Analgesics', threshold: 14 },
    { medicationType: 'Combination Analgesics with Caffeine', threshold: 9 },
    { medicationType: 'Triptans', threshold: 9 },
    { medicationType: 'Ergotamines', threshold: 9 },
    { medicationType: 'Opioids or Barbiturates', threshold: 9 },
];

export const DEFAULT_SYMPTOMS = [
  "Aura", "Pulsating pain", "One-sided pain", "Nausea", "Vomiting", 
  "Sensitivity to light", "Sensitivity to sound", "Visual disturbances", "Vertigo", "Fatigue"
];
