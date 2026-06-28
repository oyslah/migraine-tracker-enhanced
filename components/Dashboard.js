import * as React from 'react';
import { Card, Button, Modal, Label, Input, Textarea, Select, Chip, TrashIcon } from './ui.js';
import { MedicationType } from '../types.js';
import { MOH_CATEGORIES } from '../constants.js';
import AttackLogModal from './AttackLogModal.js';
import { safeFormatDateTime, safeToDateTimeLocal, toLocalDateString } from '../services/utils.js';
import MedicationIntakeEditModal from './MedicationIntakeEditModal.js';
import ThirtyDayStats from './ThirtyDayStats.js';
import MOHGauge from './MOHGauge.js';

const MedicationLogModal = ({ isOpen, onClose, medications, onSave, onAddMedication }) => {
    const loggableMeds = medications.filter(m => m.type === MedicationType.Abortive || m.type === MedicationType.CGRPInhibitor);
    const [medicationId, setMedicationId] = React.useState('');
    const [timestamp, setTimestamp] = React.useState('');
    const [dose, setDose] = React.useState('');
    const [effectiveness, setEffectiveness] = React.useState(null);
    const [showAddMed, setShowAddMed] = React.useState(false);
    const [newMedName, setNewMedName] = React.useState('');
    const [newMedDose, setNewMedDose] = React.useState('');
    const [newMedType, setNewMedType] = React.useState(MedicationType.Abortive);
    const [newMedMohCategories, setNewMedMohCategories] = React.useState([]);

    // Effect to initialize/reset form state when the modal opens.
    React.useEffect(() => {
        if (isOpen) {
            // Set the timestamp to the current time. This happens only when opening.
            setTimestamp(safeToDateTimeLocal(new Date()));
            
            // Set a valid default medication selection, or clear if none exist.
            const firstValidMedId = loggableMeds[0]?.id || '';
            setMedicationId(firstValidMedId);
            
            // The dose will be set by the other effect.
            setEffectiveness(null);
        }
    }, [isOpen]);

    // Effect to update the dose whenever the selected medication changes.
    React.useEffect(() => {
        if (medicationId) {
            const selectedMed = medications.find(m => m.id === medicationId);
            setDose(selectedMed?.dose || '');
        } else {
            setDose('');
        }
    }, [medicationId, medications]);


    const handleSave = () => {
        if (!medicationId) {
            alert("Please select a medication.");
            return;
        }
        if (!timestamp) {
            alert("Please enter a time for the medication intake.");
            return;
        }
        try {
            const intakeDate = new Date(timestamp);
            if (isNaN(intakeDate.getTime())) throw new Error("Invalid timestamp");

            onSave({
                id: `intake-${Date.now()}`,
                medicationId,
                timestamp: intakeDate.toISOString(),
                dose: dose || "N/A",
                effectiveness,
            });
            onClose();
        } catch (error) {
            console.error("Error logging medication:", error);
            alert("Could not log medication. Please ensure the date and time are valid.");
        }
    };

    const handleAddMedication = () => {
        if (!newMedName.trim()) {
            alert("Please enter a medication name.");
            return;
        }
        const newMed = {
            id: `med-${Date.now()}`,
            name: newMedName.trim(),
            type: newMedType,
            dose: newMedDose || "N/A",
            mohCategories: newMedMohCategories,
        };
        if (onAddMedication) {
            onAddMedication(newMed);
        }
        setMedicationId(newMed.id);
        setShowAddMed(false);
        setNewMedName('');
        setNewMedDose('');
        setNewMedType(MedicationType.Abortive);
        setNewMedMohCategories([]);
    };

    const EFFECTIVENESS_OPTIONS = [
        { id: null, label: 'Not Sure' },
        { id: 'not_effective', label: 'Not Effective' },
        { id: 'partially_effective', label: 'Partially Effective' },
        { id: 'effective', label: 'Effective' },
    ];

    return React.createElement(Modal, { isOpen: isOpen, onClose: onClose, title: "Log Medication Use" },
        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "med-select" }, "Medication"),
                React.createElement(Select, { id: "med-select", value: medicationId, onChange: e => setMedicationId(e.target.value) },
                    loggableMeds.map(m => React.createElement('option', { key: m.id, value: m.id }, m.name))
                ),
                !showAddMed && React.createElement(Button, { variant: "secondary", className: "mt-2 w-full", onClick: () => setShowAddMed(true) }, "+ Add New Medication"),
                showAddMed && React.createElement('div', { className: "mt-3 p-3 bg-dark-bg rounded-md space-y-3" },
                    React.createElement('div', null,
                        React.createElement(Label, { htmlFor: "new-med-name" }, "Name"),
                        React.createElement(Input, { id: "new-med-name", placeholder: "Medication name", value: newMedName, onChange: e => setNewMedName(e.target.value) })
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, { htmlFor: "new-med-dose" }, "Dose"),
                        React.createElement(Input, { id: "new-med-dose", placeholder: "e.g., 50mg", value: newMedDose, onChange: e => setNewMedDose(e.target.value) })
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, { htmlFor: "new-med-type" }, "Type"),
                        React.createElement(Select, { id: "new-med-type", value: newMedType, onChange: e => setNewMedType(e.target.value) },
                            React.createElement('option', { value: MedicationType.Abortive }, "Acute"),
                            React.createElement('option', { value: MedicationType.Preventive }, "Preventive"),
                            React.createElement('option', { value: MedicationType.CGRPInhibitor }, "CGRP Inhibitor")
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, null, "MOH Categories"),
                        React.createElement('div', { className: 'flex flex-wrap gap-2 mt-1' },
                            MOH_CATEGORIES.map(cat =>
                                React.createElement(Chip, {
                                    key: cat,
                                    selected: newMedMohCategories.includes(cat),
                                    onClick: () => setNewMedMohCategories(prev =>
                                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                    ),
                                }, cat)
                            )
                        )
                    ),
                    React.createElement('div', { className: "flex justify-end space-x-2 pt-2" },
                        React.createElement(Button, { variant: "secondary", onClick: () => { setShowAddMed(false); setNewMedName(''); setNewMedDose(''); setNewMedType(MedicationType.Abortive); setNewMedMohCategories([]); } }, "Cancel"),
                        React.createElement(Button, { onClick: handleAddMedication }, "Save Medication")
                    )
                )
            ),
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "med-dose" }, "Dose"),
                React.createElement(Input, { id: "med-dose", placeholder: "e.g., 50mg", value: dose, onChange: e => setDose(e.target.value) })
            ),
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "med-time" }, "Time Taken"),
                React.createElement(Input, { type: "datetime-local", id: "med-time", value: timestamp, onChange: e => setTimestamp(e.target.value) })
            ),
            React.createElement('div', { className: "space-y-3 pt-4 mt-4 border-t border-dark-border" },
                React.createElement(Label, { className: "mb-2" }, "How effective was this dose?"),
                 React.createElement('div', { className: 'flex flex-wrap gap-2' },
                    EFFECTIVENESS_OPTIONS.map(option => (
                        React.createElement(Chip, {
                            key: option.id ?? 'not-sure',
                            selected: effectiveness === option.id,
                            onClick: () => setEffectiveness(option.id),
                        }, option.label)
                    ))
                )
            )
        ),
        React.createElement('div', { className: "mt-6 flex justify-end space-x-2" },
            React.createElement(Button, { variant: "secondary", onClick: onClose }, "Cancel"),
            React.createElement(Button, { onClick: handleSave }, "Log Intake")
        )
    );
};

const WelcomeHeader = ({ attacks }) => {
    const [message, setMessage] = React.useState(null);

    React.useEffect(() => {
        const updateMessage = () => {
            const now = new Date();
            // State 1: No attacks
            if (attacks.length === 0) {
                setMessage(
                    React.createElement(React.Fragment, null,
                        React.createElement('h2', { className: "text-2xl font-bold text-dark-text-primary" }, "Welcome"),
                        React.createElement('p', { className: "text-dark-text-secondary" }, "How are you feeling today?")
                    )
                );
                return;
            }

            const latestAttack = attacks[0];

            // State 2: Ongoing attack
            if (latestAttack && !latestAttack.endTime) {
                const startTime = new Date(latestAttack.startTime);
                if (isNaN(startTime.getTime())) {
                    setMessage(React.createElement('p', { className: "text-dark-text-secondary" }, "Ongoing attack with invalid start time."));
                    return;
                }

                const diffMs = now.getTime() - startTime.getTime();
                const totalMinutes = Math.floor(diffMs / (1000 * 60));
                const totalHours = Math.floor(totalMinutes / 60);
                const totalDays = Math.floor(totalHours / 24);
                
                let durationText;
                if (totalDays > 0) {
                    const remainingHours = totalHours % 24;
                    durationText = `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
                    if (remainingHours > 0) {
                        durationText += ` and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
                    }
                } else if (totalHours > 0) {
                    durationText = `${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
                } else {
                    durationText = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
                }
                
                setMessage(
                    React.createElement('h2', { className: "text-2xl font-bold text-dark-text-primary leading-tight" },
                        `You've been having a migraine attack for ${durationText}.`
                    )
                );
                return;
            }
            
            // State 3: Migraine-free
            const lastFinishedAttack = attacks.find(a => a.endTime);
            if (lastFinishedAttack && lastFinishedAttack.endTime) {
                const endTime = new Date(lastFinishedAttack.endTime);
                if (isNaN(endTime.getTime())) {
                     setMessage(React.createElement('p', { className: "text-dark-text-secondary" }, "Could not calculate migraine-free duration."));
                    return;
                }

                const diffMs = now.getTime() - endTime.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                setMessage(
                    React.createElement('h2', { className: "text-2xl font-bold text-dark-text-primary leading-tight" },
                        `You've been migraine free for ${diffDays} day${diffDays !== 1 ? 's' : ''} and ${diffHours} hour${diffHours !== 1 ? 's' : ''}.`
                    )
                );
            } else {
                 setMessage(
                    React.createElement(React.Fragment, null,
                        React.createElement('h2', { className: "text-2xl font-bold text-dark-text-primary" }, "Welcome Back"),
                        React.createElement('p', { className: "text-dark-text-secondary" }, "How are you feeling today?")
                    )
                );
            }
        };

        updateMessage();
        if (attacks.length > 0) {
            const intervalId = setInterval(updateMessage, 60000);
            return () => clearInterval(intervalId);
        }
    }, [attacks]);

    return (
        React.createElement('div', { className: "min-h-[56px] flex flex-col justify-center flex-grow" },
            message
        )
    );
};

const FunctionalDisabilityScore = ({ disabilityLogs, upsertDisabilityLog }) => {
    const todayDate = React.useMemo(() => toLocalDateString(new Date()), []);
    const todayLog = React.useMemo(() => disabilityLogs.find(l => l.date === todayDate), [disabilityLogs, todayDate]);

    // Use today's log score if it exists; null means no score selected yet
    const currentScore = todayLog?.score ?? null;

    const scores = [
        { value: 0, label: "Full Function" },
        { value: 1, label: "Mild Impairment" },
        { value: 2, label: "Moderate Impairment" },
        { value: 3, label: "Severe Impairment" },
    ];

    const handleScoreSelect = (score) => {
        const newLog = {
            date: todayDate,
            score: score,
        };
        upsertDisabilityLog(newLog);
    };

    const getDisabilityColor = (score) => {
        if (score === 0) return '#58A6FF';  // blue
        if (score === 1) return '#D29922';  // yellow
        if (score === 2) return '#DB6D28';  // amber
        return '#F85149';                     // red
    };

    return React.createElement(Card, { title: "Functional Disability" },
        React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4" }, "How much did your migraine impact your daily activities today? If you had an attack, please score based on its peak severity."),
        React.createElement('div', { className: "grid grid-cols-2 sm:grid-cols-4 gap-2" },
            scores.map(({ value, label }) => {
                const dColor = getDisabilityColor(value);
                const selected = currentScore === value;
                return React.createElement('button', {
                    key: value,
                    onClick: () => handleScoreSelect(value),
                    style: { backgroundColor: dColor, color: '#fff' },
                    className: `p-3 rounded-lg text-center transition-all ${
                        selected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-bg-secondary scale-105'
                            : 'hover:brightness-110'
                    }`
                },
                    React.createElement('span', { className: "text-2xl font-bold" }, value),
                    React.createElement('span', { className: "block text-xs mt-1" }, label)
                )
            })
        )
    );
};


const Dashboard = ({ attacks, triggers, triggerLogs, upsertTriggerLog, addAttack, updateAttack, deleteAttack, medications, medicationIntakes, addMedicationIntake, updateMedicationIntake, deleteMedicationIntake, symptoms, setSymptoms, disabilityLogs, upsertDisabilityLog, mohRules, addMedication }) => {
    const [isAttackModalOpen, setIsAttackModalOpen] = React.useState(false);
    const [isMedLogModalOpen, setIsMedLogModalOpen] = React.useState(false);
    const [editingAttack, setEditingAttack] = React.useState(null);
    const [editingIntake, setEditingIntake] = React.useState(null);

    // Memoize today's date string to keep it stable across re-renders.
    const todayDate = React.useMemo(() => toLocalDateString(new Date()), []);
    
    // Memoize the log for today from props.
    const todayLog = React.useMemo(() => {
        return triggerLogs.find(l => l.date === todayDate)?.values || {};
    }, [triggerLogs, todayDate]);

    // Local state for the user's check-in edits.
    const [dailyCheckinState, setDailyCheckinState] = React.useState(todayLog);
    
    // Effect to synchronize local state with props, crucial for async data loading.
    React.useEffect(() => {
        setDailyCheckinState(todayLog);
    }, [todayLog]);
    
    const todayFormatted = React.useMemo(() => new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }), []);

    const handleCheckinToggle = (triggerId) => {
        setDailyCheckinState(prev => ({...prev, [triggerId]: !prev[triggerId]}));
    }

    const handleSaveCheckin = () => {
        const newLog = {
            date: todayDate,
            values: dailyCheckinState,
        };
        upsertTriggerLog(newLog);
    };

    const handleLogAttackClick = () => {
        // Attacks are sorted by startTime descending, so attacks[0] is the latest.
        const ongoingAttack = attacks[0] && !attacks[0].endTime ? attacks[0] : null;

        if (ongoingAttack) {
            // If there's an ongoing attack, open it for editing.
            setEditingAttack(ongoingAttack);
        } else {
            // Otherwise, open a new attack log.
            setIsAttackModalOpen(true);
        }
    };

    return (
        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
            React.createElement('div', { className: "lg:col-span-2 space-y-6" },
                React.createElement(Card, null,
                    React.createElement('div', { className: "flex flex-col sm:flex-row items-center justify-between gap-4" },
                        React.createElement(WelcomeHeader, { attacks: attacks }),
                        React.createElement('div', { className: "flex space-x-4 flex-shrink-0" },
                             React.createElement(Button, { variant: "secondary", onClick: () => setIsMedLogModalOpen(true) }, "Log Acute Medication"),
                            React.createElement(Button, { variant: "primary", onClick: handleLogAttackClick }, "Log Migraine Attack")
                        )
                    )
                ),
                React.createElement(Card, { title: `Daily Check-in - ${todayFormatted}` },
                     React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4" }, "Tap any potential triggers you experienced today."),
                    React.createElement('div', { className: "flex flex-wrap gap-2" },
                       triggers.map(trigger => (
                           React.createElement(Chip, 
                            {
                                key: trigger.id,
                                selected: !!dailyCheckinState[trigger.id],
                                onClick: () => handleCheckinToggle(trigger.id)
                            },
                               trigger.name
                           )
                       ))
                    ),
                    React.createElement('div', { className: "mt-6 flex justify-end" },
                        React.createElement(Button, { onClick: handleSaveCheckin }, "Save Check-in")
                    )
                ),
                React.createElement(FunctionalDisabilityScore, { disabilityLogs: disabilityLogs, upsertDisabilityLog: upsertDisabilityLog })
            ),
            React.createElement('div', { className: "lg:col-span-1 space-y-6" },
                React.createElement(ThirtyDayStats, { attacks: attacks }),
                React.createElement(MOHGauge, { medicationIntakes: medicationIntakes, medications: medications, mohRules: mohRules }),
                React.createElement(Card, { title: "Recent Attacks" },
                    attacks.length > 0 ? (
                        React.createElement('ul', { className: "space-y-3" },
                            attacks.slice(0, 3).map(attack => (
                                React.createElement('li', { key: attack.id, className: "p-3 bg-dark-bg rounded-md flex justify-between items-center gap-2" },
                                    React.createElement('div', null,
                                        React.createElement('p', { className: "font-semibold" }, safeFormatDateTime(attack.startTime)),
                                        React.createElement('p', { className: "text-sm text-dark-text-secondary" }, `Pain: ${attack.severity}/10`)
                                    ),
                                    React.createElement('div', { className: "flex space-x-2 flex-shrink-0" },
                                        React.createElement(Button, { variant: "secondary", className: "px-2 py-1 text-sm", onClick: () => setEditingAttack(attack) }, "Edit")
                                    )
                                )
                            ))
                        )
                    ) : (
                        React.createElement('p', { className: "text-dark-text-secondary" }, "No recent attacks logged.")
                    )
                ),
                 React.createElement(Card, { title: "Recent Medications" },
                    medicationIntakes.length > 0 ? (
                        React.createElement('ul', { className: "space-y-3" },
                            medicationIntakes.slice(0, 3).map(intake => {
                                const med = medications.find(m => m.id === intake.medicationId);
                                return React.createElement('li', { key: intake.id, className: "p-3 bg-dark-bg rounded-md" },
                                    React.createElement('div', { className: "flex justify-between items-center gap-2" },
                                        React.createElement('div', { className: "flex-grow" },
                                            React.createElement('p', { className: "font-semibold" }, med ? `${med.name} - ${intake.dose}` : 'Unknown Medication'),
                                            React.createElement('p', { className: "text-sm text-dark-text-secondary" }, safeFormatDateTime(intake.timestamp))
                                        ),
                                        React.createElement('div', { className: "flex space-x-2 flex-shrink-0" },
                                            React.createElement(Button, { variant: "secondary", className: "px-2 py-1 text-sm", onClick: () => setEditingIntake(intake) }, "Edit")
                                        )
                                    )
                                );
                            })
                        )
                    ) : (
                        React.createElement('p', { className: "text-dark-text-secondary" }, "No recent medications logged.")
                    )
                )
            ),

            React.createElement(AttackLogModal, 
              {
                  isOpen: isAttackModalOpen,
                  onClose: () => setIsAttackModalOpen(false),
                  onSave: (attack) => {
                    const attackDate = toLocalDateString(new Date(attack.startTime));
                    const latestTriggerLog = triggerLogs.find(log => log.date === attackDate);
                    // Merge saved triggers with currently-unsaved check-in state for today
                    const savedValues = latestTriggerLog?.values || {};
                    const todaysUnsaved = attackDate === todayDate ? dailyCheckinState : {};
                    const mergedTriggers = { ...savedValues, ...todaysUnsaved };
                    const attackWithTriggers = {
                        ...attack,
                        triggers: mergedTriggers,
                    };
                    addAttack(attackWithTriggers);
                    setIsAttackModalOpen(false);
                  },
                  symptoms: symptoms,
                  setSymptoms: setSymptoms
              }
            ),

            editingAttack && (
                React.createElement(AttackLogModal, 
                    {
                        isOpen: !!editingAttack,
                        onClose: () => setEditingAttack(null),
                        onSave: (updated) => {
                            updateAttack(updated);
                            setEditingAttack(null);
                        },
                        attack: editingAttack,
                        symptoms: symptoms,
                        setSymptoms: setSymptoms
                    }
                )
            ),
            
            React.createElement(MedicationLogModal,
                {
                    isOpen: isMedLogModalOpen,
                    onClose: () => setIsMedLogModalOpen(false),
                    medications: medications,
                    onSave: addMedicationIntake,
                    onAddMedication: addMedication
                }
            ),

            editingIntake && React.createElement(MedicationIntakeEditModal, 
            {
                isOpen: !!editingIntake,
                onClose: () => setEditingIntake(null),
                onSave: (updated) => {
                    updateMedicationIntake(updated);
                    setEditingIntake(null);
                },
                intake: editingIntake,
                medications: medications
            })
        )
    );
};

export default Dashboard;
