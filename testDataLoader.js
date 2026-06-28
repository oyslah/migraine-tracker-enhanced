/**
 * Test data injection — loads realistic sample data for UI testing.
 * Triggered by visiting with ?loadTestData=true in the URL.
 * Remove before production release.
 */
import { db } from './services/db.js';
import { DEFAULT_TRIGGERS, DEFAULT_MEDICATIONS, DEFAULT_MOH_RULES, DEFAULT_SYMPTOMS } from './constants.js';
import { MedicationType } from './types.js';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];
const pickN = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};

const dateStr = (d) => d.toISOString().split('T')[0];
const isoStr = (d) => d.toISOString();

export async function injectTestData() {
    // Clear existing data
    await db.attacks.clear();
    await db.medicationIntakes.clear();
    await db.triggerLogs.clear();
    await db.disabilityLogs.clear();
    await db.lifeChanges.clear();
    await db.medications.clear();
    await db.triggers.clear();
    await db.symptoms.clear();
    await db.mohRules.clear();

    // Seed base data (use bulkPut to handle case where migration already populated these)
    await db.medications.bulkPut(DEFAULT_MEDICATIONS);
    await db.triggers.bulkPut(DEFAULT_TRIGGERS);
    await db.symptoms.bulkPut(DEFAULT_SYMPTOMS.map(s => ({ id: s, name: s })));
    await db.mohRules.bulkPut(DEFAULT_MOH_RULES);

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const attacks = [];
    const intakes = [];
    const triggerLogs = [];
    const disabilityLogs = [];
    const lifeChanges = [];

    // Generate daily trigger logs (last 6 months)
    for (let d = new Date(sixMonthsAgo); d <= now; d.setDate(d.getDate() + 1)) {
        const day = dateStr(d);
        const values = {};
        // ~40% of days have some triggers
        if (Math.random() < 0.4) {
            DEFAULT_TRIGGERS.forEach(t => {
                values[t.id] = Math.random() < 0.3;
            });
        }
        triggerLogs.push({ date: day, values });

        // Disability scores on most days
        const hasAttackToday = Math.random() < 0.1; // rough, we'll override below
        const score = hasAttackToday ? randomInt(1, 3) : (Math.random() < 0.3 ? randomInt(0, 1) : 0);
        disabilityLogs.push({ date: day, score });
    }

    // Generate ~45 attacks over 6 months (roughly 2 per week)
    const attackDates = [];
    for (let i = 0; i < 45; i++) {
        const dayOffset = randomInt(0, 180);
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - dayOffset);
        // Randomize time of day
        startDate.setHours(randomInt(0, 23), randomInt(0, 59), 0, 0);

        const durationHours = randomInt(2, 48);
        const endDate = new Date(startDate.getTime() + durationHours * 3600000);
        if (endDate > now) endDate.setTime(now.getTime() - 3600000); // must be in the past

        const severity = randomInt(3, 9);
        const symptomPool = DEFAULT_SYMPTOMS;
        const symptoms = pickN(symptomPool, randomInt(2, 5));

        const notesOptions = [
            '', '', '', // often no notes
            'Started behind left eye',
            'Woke up with it',
            'Triggered after stressful meeting',
            'Weather change — pressure dropped',
            'After skipping lunch',
            'Came on gradually over 2 hours',
            'Neck tension preceded it',
        ];

        attacks.push({
            id: `test-atk-${i}`,
            startTime: isoStr(startDate),
            endTime: isoStr(endDate),
            severity,
            symptoms,
            notes: pick(notesOptions),
        });

        attackDates.push({ startDate, endDate, severity });

        // Log medication intakes for this attack
        const abortiveMeds = DEFAULT_MEDICATIONS.filter(m => m.type === MedicationType.Abortive || m.type === MedicationType.CGRPInhibitor);
        const medsToTake = randomInt(1, 2);
        for (let m = 0; m < medsToTake; m++) {
            const med = pick(abortiveMeds);
            const intakeTime = new Date(startDate.getTime() + randomInt(0, 120) * 60000);
            intakes.push({
                id: `test-intake-${i}-${m}`,
                medicationId: med.id,
                timestamp: isoStr(intakeTime),
                dose: med.dose,
                effectiveness: pick([null, 'not_effective', 'partially_effective', 'effective', 'effective']),
            });
        }
    }

    // Sort attacks by startTime
    attacks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Generate medication intakes on non-attack days too (preventive refills, PRN use)
    const preventiveMeds = DEFAULT_MEDICATIONS.filter(m => m.type === MedicationType.Preventive);
    for (let d = new Date(sixMonthsAgo); d <= now; d.setDate(d.getDate() + 1)) {
        if (Math.random() < 0.15) {
            const med = pick(preventiveMeds);
            const intakeTime = new Date(d);
            intakeTime.setHours(randomInt(7, 9), randomInt(0, 59));
            intakes.push({
                id: `test-prev-${dateStr(d)}`,
                medicationId: med.id,
                timestamp: isoStr(intakeTime),
                dose: med.dose,
                effectiveness: null,
            });
        }
    }

    // Life changes
    lifeChanges.push({
        id: 'test-lc-1',
        date: dateStr(new Date(now.getFullYear(), now.getMonth() - 4, 15)),
        description: 'Started new job — higher stress environment',
    });
    lifeChanges.push({
        id: 'test-lc-2',
        date: dateStr(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
        description: 'Began magnesium supplements (400mg/day)',
    });
    lifeChanges.push({
        id: 'test-lc-3',
        date: dateStr(new Date(now.getFullYear(), now.getMonth() - 1, 10)),
        description: 'Started regular exercise routine (3x/week)',
    });

    // Bulk insert all
    await db.transaction('rw',
        db.attacks, db.medicationIntakes, db.triggerLogs,
        db.disabilityLogs, db.lifeChanges,
        async () => {
            await db.attacks.bulkPut(attacks);
            await db.medicationIntakes.bulkPut(intakes);
            await db.triggerLogs.bulkPut(triggerLogs);
            await db.disabilityLogs.bulkPut(disabilityLogs);
            await db.lifeChanges.bulkPut(lifeChanges);
        });

    console.log(`✅ Test data loaded: ${attacks.length} attacks, ${intakes.length} intakes, ${triggerLogs.length} check-ins, ${disabilityLogs.length} disability scores, ${lifeChanges.length} life changes`);
    return true;
}
