import Dexie from 'dexie';

export const db = new Dexie('MigraineTrackerDB');

db.version(2).stores({
  attacks: 'id, startTime, endTime',
  medications: 'id',
  medicationIntakes: 'id, medicationId, timestamp',
  triggers: 'id',
  symptoms: 'id', // Storing as objects {id, name}
  triggerLogs: 'date', // date is the primary key (YYYY-MM-DD)
  mohRules: 'medicationType',
  disabilityLogs: 'date', // New table for disability score
});