import * as React from 'react';
import { MedicationType } from '../types.js';
import { Card, Button, Modal, Label, Input, Select, Textarea, TrashIcon, PlusIcon, TabButton, Chip } from './ui.js';
import AttackLogModal from './AttackLogModal.js';
import { safeFormatDateTime, safeToDateTimeLocal } from '../services/utils.js';
import { MOH_CATEGORIES } from '../constants.js';
import MedicationIntakeEditModal from './MedicationIntakeEditModal.js';
import { db } from '../services/db.js';
import { 
    migrateAttacks, 
    migrateTriggerLogs, 
    migrateMedications, 
    migrateMedicationIntakes, 
    migrateTriggers, 
    migrateMohRules, 
    migrateSymptoms 
} from '../services/dataMigration.js';

const MedicationModal = ({ isOpen, onClose, onSave, medication }) => {
    const [name, setName] = React.useState('');
    const [type, setType] = React.useState(MedicationType.Abortive);
    const [dose, setDose] = React.useState('');
    const [mohCategories, setMohCategories] = React.useState([]);

    React.useEffect(() => {
        if(isOpen) {
            setName(medication?.name || '');
            setType(medication?.type || MedicationType.Abortive);
            setDose(medication?.dose || '');
            setMohCategories(medication?.mohCategories || []);
        }
    }, [isOpen, medication]);

    const handleCategoryToggle = (category) => {
        setMohCategories(prev => 
            prev.includes(category) 
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };
    
    const handleSave = () => {
        onSave({
            id: medication?.id || '',
            name, 
            type, 
            dose, 
            mohCategories: type === MedicationType.Abortive ? mohCategories : undefined,
        });
    };

    return React.createElement(Modal, { isOpen: isOpen, onClose: onClose, title: medication ? "Edit Medication" : "Add Medication" },
        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "medName" }, "Name"),
                React.createElement(Input, { id: "medName", value: name, onChange: e => setName(e.target.value) })
            ),
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "medDose" }, "Dose (e.g., 50mg)"),
                React.createElement(Input, { id: "medDose", value: dose, onChange: e => setDose(e.target.value) })
            ),
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "medType" }, "Type"),
                React.createElement(Select, { id: "medType", value: type, onChange: e => setType(e.target.value) },
                    React.createElement('option', { value: MedicationType.Abortive }, "Acute"),
                    React.createElement('option', { value: MedicationType.Preventive }, "Preventive"),
                    React.createElement('option', { value: MedicationType.CGRPInhibitor }, "CGRP Inhibitor")
                )
            ),

            type === MedicationType.Abortive && React.createElement('div', { className: "space-y-2 pt-4 mt-4 border-t border-dark-border" },
                React.createElement(Label, null, "Medication Overuse Category"),
                React.createElement('p', { className: "text-xs text-dark-text-secondary mb-2" }, "Select all categories that apply for MOH tracking. For medications like Excedrin (e.g., aspirin, acetaminophen, caffeine), select 'Combination Analgesics with Caffeine'."),
                React.createElement('div', { className: "flex flex-wrap gap-2" },
                    MOH_CATEGORIES.map(category => (
                        React.createElement(Chip,
                            {
                                key: category,
                                selected: mohCategories.includes(category),
                                onClick: () => handleCategoryToggle(category)
                            },
                            category
                        )
                    ))
                )
            )
        ),
        React.createElement('div', { className: "mt-6 flex justify-end gap-2" },
            React.createElement(Button, { variant: "secondary", onClick: onClose }, "Cancel"),
            React.createElement(Button, { onClick: handleSave }, "Save")
        )
    );
};

const CheckinEditModal = ({ isOpen, onClose, log, triggers, onSave }) => {
    const [values, setValues] = React.useState({});

    React.useEffect(() => {
        if (isOpen) {
            setValues(log.values || {});
        }
    }, [isOpen, log]);

    const handleToggle = (triggerId) => {
        setValues(prev => ({...prev, [triggerId]: !prev[triggerId]}));
    };

    const handleSave = () => {
        onSave({ ...log, values });
    };
    
    const logDate = safeFormatDateTime(log.date, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }, log.date);

    return React.createElement(Modal, { isOpen: isOpen, onClose: onClose, title: `Edit Check-in for ${logDate}` },
        React.createElement('div', { className: "flex flex-wrap gap-2" },
            triggers.map(trigger => React.createElement(Chip, { key: trigger.id, selected: values[trigger.id], onClick: () => handleToggle(trigger.id) }, trigger.name))
        ),
        React.createElement('div', { className: "mt-6 flex justify-end gap-2" },
            React.createElement(Button, { variant: "secondary", onClick: onClose }, "Cancel"),
            React.createElement(Button, { onClick: handleSave }, "Save Changes")
        )
    );
};

const CheckinAddModal = ({ isOpen, onClose, triggers, onSave, triggerLogs }) => {
    const [date, setDate] = React.useState('');
    const [values, setValues] = React.useState({});
    const [warning, setWarning] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            // Default to yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const initialDate = yesterday.toISOString().split('T')[0];
            setDate(initialDate);
            setValues({});
            setWarning('');
        }
    }, [isOpen]);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        const existingLog = triggerLogs.find(log => log.date === newDate);
        if (existingLog) {
            setValues(existingLog.values || {});
            setWarning('A log for this date already exists. Saving will overwrite it.');
        } else {
            setValues({});
            setWarning('');
        }
    };

    const handleToggle = (triggerId) => {
        setValues(prev => ({ ...prev, [triggerId]: !prev[triggerId] }));
    };

    const handleSave = () => {
        if (!date) {
            alert('Please select a date.');
            return;
        }
        onSave({ date, values });
        onClose();
    };

    return React.createElement(Modal, { isOpen: isOpen, onClose: onClose, title: "Add Daily Check-in" },
        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "checkin-date" }, "Date"),
                React.createElement(Input,
                    {
                        type: "date",
                        id: "checkin-date",
                        value: date,
                        onChange: e => handleDateChange(e.target.value),
                        max: new Date().toISOString().split('T')[0] // Can't log for future
                    }
                ),
                warning && React.createElement('p', { className: "text-xs text-dark-warning mt-1" }, warning)
            ),
            React.createElement('div', null,
                React.createElement(Label, null, "Triggers"),
                React.createElement('div', { className: "flex flex-wrap gap-2" },
                    triggers.map(trigger => React.createElement(Chip, { key: trigger.id, selected: !!values[trigger.id], onClick: () => handleToggle(trigger.id) }, trigger.name))
                )
            )
        ),
        React.createElement('div', { className: "mt-6 flex justify-end gap-2" },
            React.createElement(Button, { variant: "secondary", onClick: onClose }, "Cancel"),
            React.createElement(Button, { onClick: handleSave }, "Save Check-in")
        )
    );
};

const AttackLog = ({ attacks, updateAttack, deleteAttack, symptoms, setSymptoms }) => {
    const [editingAttack, setEditingAttack] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(attacks.length / ITEMS_PER_PAGE);
    const paginatedAttacks = attacks.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    React.useEffect(() => {
        // Reset to page 1 if the attacks data changes in a way that reduces total pages
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [attacks, currentPage, totalPages]);


    return React.createElement(Card, { title: "Migraine Attack History" },
        React.createElement('div', { className: "space-y-4" },
            paginatedAttacks.length > 0 ? paginatedAttacks.map(attack => (
                React.createElement('div', { key: attack.id, className: "p-4 bg-dark-bg rounded-lg" },
                    React.createElement('div', { className: "flex justify-between items-start gap-4" },
                        React.createElement('div', { className: 'flex-grow' },
                            React.createElement('p', { className: "font-semibold text-dark-text-primary" }, safeFormatDateTime(attack.startTime)),
                            React.createElement('p', { className: "text-sm text-dark-text-secondary" }, `Severity: ${attack.severity}/10`),
                            attack.symptoms.length > 0 && React.createElement('div', { className: "mt-2" },
                                React.createElement('p', { className: "text-xs font-medium text-dark-text-secondary mb-1" }, "Symptoms:"),
                                React.createElement('div', { className: "flex flex-wrap gap-1" },
                                    attack.symptoms.map(symptom => (
                                        React.createElement(Chip, { key: symptom, className: "text-xs px-2 py-0.5 cursor-default" }, symptom)
                                    ))
                                )
                            ),
                            attack.notes && React.createElement('p', { className: "text-xs text-dark-text-secondary mt-2 italic" }, `Notes: "${attack.notes}"`)
                        ),
                        React.createElement('div', { className: "flex space-x-2 flex-shrink-0" },
                            React.createElement(Button, { variant: "secondary", onClick: () => setEditingAttack(attack) }, "Edit"),
                            React.createElement(Button, { variant: "danger", onClick: () => window.confirm('Are you sure?') && deleteAttack(attack.id) }, React.createElement(TrashIcon))
                        )
                    )
                )
            )) : (
                React.createElement('p', { className: "text-dark-text-secondary text-center py-4" }, "No attacks logged yet.")
            )
        ),

        totalPages > 1 && React.createElement('div', { className: "mt-6 flex justify-between items-center text-sm" },
            React.createElement(Button, { variant: "secondary", onClick: () => setCurrentPage(p => Math.max(1, p - 1)), disabled: currentPage === 1 },
                "Previous"
            ),
            React.createElement('span', { className: "text-dark-text-secondary" },
                `Page ${currentPage} of ${totalPages}`
            ),
            React.createElement(Button, { variant: "secondary", onClick: () => setCurrentPage(p => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages },
                "Next"
            )
        ),
         editingAttack && React.createElement(AttackLogModal, 
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
    );
};

const MedicationManager = ({ medications, setMedications, medicationIntakes, updateMedicationIntake, deleteMedicationIntake }) => {
    const [isMedModalOpen, setIsMedModalOpen] = React.useState(false);
    const [editingMed, setEditingMed] = React.useState(null);
    const [isEditIntakeModalOpen, setIsEditIntakeModalOpen] = React.useState(false);
    const [editingIntake, setEditingIntake] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(medicationIntakes.length / ITEMS_PER_PAGE);
    const paginatedIntakes = medicationIntakes.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
     React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }
    }, [medicationIntakes.length, currentPage, totalPages]);

    const MED_TYPE_DISPLAY = {
        [MedicationType.Abortive]: 'Acute',
        [MedicationType.Preventive]: 'Preventive',
        [MedicationType.CGRPInhibitor]: 'CGRP Inhibitor'
    };

    const handleSaveMedication = (med) => {
        if (med.id) { // Editing
            setMedications(medications.map(m => m.id === med.id ? med : m));
        } else { // Adding
            setMedications([...medications, { ...med, id: `med-${Date.now()}` }]);
        }
        setIsMedModalOpen(false);
        setEditingMed(null);
    }
    
    const handleDeleteMedication = (medId) => {
        if (window.confirm("Are you sure you want to delete this medication? This cannot be undone.")) {
            setMedications(medications.filter(m => m.id !== medId));
        }
    }

    const openIntakeEditor = (intake) => {
        setEditingIntake(intake);
        setIsEditIntakeModalOpen(true);
    };

    const closeIntakeEditor = () => {
        setEditingIntake(null);
        setIsEditIntakeModalOpen(false);
    };

    const handleSaveIntake = (updatedIntake) => {
        updateMedicationIntake(updatedIntake);
        closeIntakeEditor();
    };

    const handleDeleteIntake = (intakeId) => {
        if (window.confirm("Are you sure you want to delete this intake log? This action cannot be undone.")) {
            deleteMedicationIntake(intakeId);
        }
    };
    
    return React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
        React.createElement(Card, { title: "Manage Medications" },
            React.createElement('ul', { className: "space-y-2 mb-4" },
            medications.map(med => (
                React.createElement('li', { key: med.id, className: "flex justify-between items-center p-3 bg-dark-bg rounded" },
                    React.createElement('div', null,
                        React.createElement('span', { className: "font-semibold" }, med.name),
                        React.createElement('span', { className: "text-xs text-dark-text-secondary ml-2" }, `(${MED_TYPE_DISPLAY[med.type] || med.type})`)
                    ),
                    React.createElement('div', { className: 'flex gap-2' },
                       React.createElement(Button, { variant: "secondary", onClick: () => { setEditingMed(med); setIsMedModalOpen(true); } }, "Edit"),
                       React.createElement(Button, { variant: "danger", onClick: () => handleDeleteMedication(med.id) }, React.createElement(TrashIcon))
                    )
                )
            ))
            ),
            React.createElement(Button, { onClick: () => { setEditingMed(null); setIsMedModalOpen(true); } }, React.createElement(PlusIcon), " Add Medication")
        ),
        React.createElement(Card, { title: "Recent Medication Intakes" },
             React.createElement('div', { className: "space-y-3" },
                paginatedIntakes.length > 0 ? paginatedIntakes.map(intake => {
                    const med = medications.find(m => m.id === intake.medicationId);
                    return (
                        React.createElement('div', { key: intake.id, className: "text-sm p-2 bg-dark-bg rounded" },
                            React.createElement('div', { className: "flex justify-between items-center gap-2" },
                                React.createElement('div', { className: "flex-grow" },
                                    React.createElement('p', { className: "font-semibold" }, `${med?.name || 'Unknown'} - ${intake.dose}`),
                                    React.createElement('p', { className: "text-dark-text-secondary" }, safeFormatDateTime(intake.timestamp))
                                ),
                                React.createElement('div', { className: "flex gap-2 flex-shrink-0" },
                                    React.createElement(Button, { variant: "secondary", onClick: () => openIntakeEditor(intake) }, "Edit"),
                                    React.createElement(Button, { variant: "danger", onClick: () => handleDeleteIntake(intake.id) }, React.createElement(TrashIcon))
                                )
                            )
                        )
                    )
                }) : (
                    React.createElement('p', { className: "text-dark-text-secondary text-center py-4" }, "No medication intakes logged.")
                )
            ),
             totalPages > 1 && (
                React.createElement('div', { className: "mt-6 flex justify-between items-center text-sm" },
                    React.createElement(Button, { variant: "secondary", onClick: () => setCurrentPage(p => Math.max(1, p - 1)), disabled: currentPage === 1 },
                        "Previous"
                    ),
                    React.createElement('span', { className: "text-dark-text-secondary" },
                        `Page ${currentPage} of ${totalPages}`
                    ),
                    React.createElement(Button, { variant: "secondary", onClick: () => setCurrentPage(p => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages },
                        "Next"
                    )
                )
            )
        ),
         React.createElement(MedicationModal, 
            {
                isOpen: isMedModalOpen,
                onClose: () => { setIsMedModalOpen(false); setEditingMed(null); },
                onSave: handleSaveMedication,
                medication: editingMed
            }
        ),
        editingIntake && React.createElement(MedicationIntakeEditModal, 
            {
                isOpen: isEditIntakeModalOpen,
                onClose: closeIntakeEditor,
                onSave: handleSaveIntake,
                intake: editingIntake,
                medications: medications
            }
        )
    )
}

const TriggerManager = ({ triggers, setTriggers }) => {
    const [newTriggerName, setNewTriggerName] = React.useState('');
    
    const handleAddTrigger = () => {
        if (newTriggerName && !triggers.some(t => t.name.toLowerCase() === newTriggerName.toLowerCase())) {
            const newTrigger = {
                id: `trigger-${Date.now()}-${newTriggerName.toLowerCase().replace(/\s/g, '-')}`,
                name: newTriggerName,
            };
            setTriggers([...triggers, newTrigger]);
            setNewTriggerName('');
        }
    };
    
    const handleDeleteTrigger = (triggerId) => {
        setTriggers(triggers.filter(t => t.id !== triggerId));
    };

    return React.createElement(Card, { title: "Manage Triggers" },
        React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4" }, "Add or remove potential triggers to track in your daily check-in."),
        React.createElement('div', { className: "space-y-2 mb-6" },
            triggers.map(t => (
                React.createElement('div', { key: t.id, className: "flex justify-between items-center p-3 bg-dark-bg rounded-md" },
                    React.createElement('span', { className: "font-semibold" }, t.name),
                    React.createElement(Button, { variant: "danger", onClick: () => handleDeleteTrigger(t.id) }, React.createElement(TrashIcon))
                )
            ))
        ),
         React.createElement('div', { className: "flex items-center gap-2 mt-4" },
            React.createElement(Input, 
                {
                    type: "text",
                    placeholder: "New trigger name...",
                    value: newTriggerName,
                    onChange: (e) => setNewTriggerName(e.target.value),
                    onKeyDown: e => e.key === 'Enter' && handleAddTrigger()
                }
            ),
            React.createElement(Button, { onClick: handleAddTrigger }, "Add Trigger")
        )
    )
}

const SymptomManager = ({ symptoms, setSymptoms }) => {
    const [newSymptomName, setNewSymptomName] = React.useState('');
    
    const handleAddSymptom = () => {
        if (newSymptomName && !symptoms.some(s => s.toLowerCase() === newSymptomName.toLowerCase())) {
            setSymptoms([...symptoms, newSymptomName]);
            setNewSymptomName('');
        }
    };
    
    const handleDeleteSymptom = (symptomToDelete) => {
        setSymptoms(symptoms.filter(s => s !== symptomToDelete));
    };

    return React.createElement(Card, { title: "Manage Symptoms" },
        React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4" }, "Add or remove symptoms to select from when logging an attack."),
        React.createElement('div', { className: "space-y-2 mb-6" },
            symptoms.map(symptom => (
                React.createElement('div', { key: symptom, className: "flex justify-between items-center p-3 bg-dark-bg rounded-md" },
                    React.createElement('span', { className: "font-semibold" }, symptom),
                    React.createElement(Button, { variant: "danger", onClick: () => handleDeleteSymptom(symptom) }, React.createElement(TrashIcon))
                )
            ))
        ),
         React.createElement('div', { className: "flex items-center gap-2 mt-4" },
            React.createElement(Input, 
                {
                    type: "text",
                    placeholder: "New symptom name...",
                    value: newSymptomName,
                    onChange: (e) => setNewSymptomName(e.target.value),
                    onKeyDown: e => e.key === 'Enter' && handleAddSymptom()
                }
            ),
            React.createElement(Button, { onClick: handleAddSymptom }, "Add Symptom")
        )
    )
}

const CheckinManager = ({ triggerLogs, triggers, upsertTriggerLog }) => {
    const [editingLog, setEditingLog] = React.useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 15;

    const sortedLogs = React.useMemo(() => {
        try {
            return [...triggerLogs].sort((a,b) => {
                const timeA = a?.date ? new Date(a.date).getTime() : 0;
                const timeB = b?.date ? new Date(b.date).getTime() : 0;
                if(isNaN(timeA) || isNaN(timeB)) return 0;
                return timeB - timeA;
            });
        } catch (e) {
            console.error("Failed to sort trigger logs:", e);
            return triggerLogs;
        }
    }, [triggerLogs]);
    
    const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = sortedLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
     React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }
    }, [sortedLogs.length, currentPage, totalPages]);


    return React.createElement(Card, { title: "Daily Check-in History" },
        React.createElement('div', { className: "space-y-3" },
            paginatedLogs.length > 0 ? paginatedLogs.map(log => {
                const loggedTriggers = log.values ? triggers.filter(t => log.values[t.id]) : [];
                return React.createElement('div', { key: log.date, className: "p-3 bg-dark-bg rounded-md flex justify-between items-center" },
                    React.createElement('div', null,
                        React.createElement('p', { className: "font-semibold" }, safeFormatDateTime(log.date, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }, log.date)),
                        React.createElement('div', { className: "flex flex-wrap gap-1 mt-1" },
                            loggedTriggers.length > 0
                                ? loggedTriggers.map(t => (
                                    React.createElement(Chip, { key: t.id, selected: true, className: "text-xs px-2 py-0.5 cursor-default" }, t.name)
                                ))
                                : React.createElement('p', { className: "text-xs text-dark-text-secondary" }, "No triggers logged.")
                        )
                    ),
                    React.createElement(Button, { variant: "secondary", onClick: () => setEditingLog(log) }, "Edit")
                );
            }) : (
                 React.createElement('p', { className: "text-dark-text-secondary text-center py-4" }, "No check-ins logged yet.")
            )
        ),

        totalPages > 1 && React.createElement('div', { className: "mt-6 flex justify-between items-center text-sm" },
            React.createElement(Button, { variant: "secondary", onClick: () => setCurrentPage(p => Math.max(1, p - 1)), disabled: currentPage === 1 }, "Previous"),
            React.createElement('span', { className: "text-dark-text-secondary" }, `Page ${currentPage} of ${totalPages}`),
            React.createElement(Button, { variant: "secondary", onClick: () => setCurrentPage(p => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages }, "Next")
        ),


        React.createElement('div', { className: "mt-6" },
            React.createElement(Button, { onClick: () => setIsAddModalOpen(true) }, React.createElement(PlusIcon), " Add Past Check-in")
        ),

        editingLog && React.createElement(CheckinEditModal, 
            {
                isOpen: !!editingLog,
                onClose: () => setEditingLog(null),
                log: editingLog,
                triggers: triggers,
                onSave: (updatedLog) => {
                    upsertTriggerLog(updatedLog);
                    setEditingLog(null);
                }
            }
        ),
        isAddModalOpen && React.createElement(CheckinAddModal,
            {
                isOpen: isAddModalOpen,
                onClose: () => setIsAddModalOpen(false),
                triggers: triggers,
                triggerLogs: triggerLogs,
                onSave: (newLog) => {
                    upsertTriggerLog(newLog);
                    setIsAddModalOpen(false);
                }
            }
        )
    );
};

const DisabilityLogModal = ({ isOpen, onClose, log, onSave, disabilityLogs }) => {
    const [date, setDate] = React.useState('');
    const [score, setScore] = React.useState(0);
    const [isEditing, setIsEditing] = React.useState(false);
    const [warning, setWarning] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            const isEditMode = !!log;
            setIsEditing(isEditMode);
            if (isEditMode) {
                setDate(log.date);
                setScore(log.score);
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const initialDate = yesterday.toISOString().split('T')[0];
                setDate(initialDate);
                setScore(0);
            }
            setWarning('');
        }
    }, [isOpen, log]);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        const existingLog = disabilityLogs.find(l => l.date === newDate);
        if (existingLog) {
            setScore(existingLog.score);
            setWarning('A log for this date already exists. Saving will overwrite it.');
        } else {
            setScore(0);
            setWarning('');
        }
    };

    const handleSave = () => {
        if (!date) {
            alert('Please select a date.');
            return;
        }
        onSave({ date, score });
        onClose();
    };

    const scores = [
        { value: 0, label: "0 - Full Function" },
        { value: 1, label: "1 - Mild Impairment" },
        { value: 2, label: "2 - Moderate Impairment" },
        { value: 3, label: "3 - Severe Impairment" },
    ];

    return React.createElement(Modal, { isOpen: isOpen, onClose: onClose, title: isEditing ? "Edit Disability Log" : "Add Disability Log" },
        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "disability-date" }, "Date"),
                React.createElement(Input, {
                    type: "date",
                    id: "disability-date",
                    value: date,
                    onChange: e => handleDateChange(e.target.value),
                    disabled: isEditing,
                    max: new Date().toISOString().split('T')[0]
                }),
                warning && React.createElement('p', { className: "text-xs text-dark-warning mt-1" }, warning)
            ),
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "disability-score" }, "Score"),
                React.createElement(Select, {
                    id: "disability-score",
                    value: score,
                    onChange: e => setScore(parseInt(e.target.value, 10))
                },
                    scores.map(s => React.createElement('option', { key: s.value, value: s.value }, s.label))
                )
            )
        ),
        React.createElement('div', { className: "mt-6 flex justify-end gap-2" },
            React.createElement(Button, { variant: "secondary", onClick: onClose }, "Cancel"),
            React.createElement(Button, { onClick: handleSave }, isEditing ? "Save Changes" : "Save Log")
        )
    );
};

const DisabilityLogManager = ({ disabilityLogs, upsertDisabilityLog }) => {
    const [editingLog, setEditingLog] = React.useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 15;

    const sortedLogs = React.useMemo(() => {
        try {
            return [...disabilityLogs].sort((a,b) => {
                const timeA = a?.date ? new Date(a.date).getTime() : 0;
                const timeB = b?.date ? new Date(b.date).getTime() : 0;
                if(isNaN(timeA) || isNaN(timeB)) return 0;
                return timeB - timeA;
            });
        } catch (e) {
            console.error("Failed to sort disability logs:", e);
            return disabilityLogs;
        }
    }, [disabilityLogs]);
    
    const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = sortedLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
     React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }
    }, [sortedLogs.length, currentPage, totalPages]);

    const scoreLabels = {
        0: "Full Function",
        1: "Mild Impairment",
        2: "Moderate Impairment",
        3: "Severe Impairment"
    };

    const handleSaveLog = (log) => {
        upsertDisabilityLog(log);
        setEditingLog(null);
        setIsAddModalOpen(false);
    };

    return React.createElement(Card, { title: "Functional Disability Log History" },
        React.createElement('div', { className: "space-y-3" },
            paginatedLogs.length > 0 ? paginatedLogs.map(log => (
                React.createElement('div', { key: log.date, className: "p-3 bg-dark-bg rounded-md flex justify-between items-center" },
                    React.createElement('div', null,
                        React.createElement('p', { className: "font-semibold" }, safeFormatDateTime(log.date, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }, log.date)),
                        React.createElement('p', { className: "text-sm text-dark-text-secondary" }, `Score: ${log.score} - ${scoreLabels[log.score] || 'Unknown'}`)
                    ),
                    React.createElement(Button, { variant: "secondary", onClick: () => setEditingLog(log) }, "Edit")
                )
            )) : (
                 React.createElement('p', { className: "text-dark-text-secondary text-center py-4" }, "No disability scores logged yet.")
            )
        ),

        totalPages > 1 && React.createElement('div', { className: "mt-6 flex justify-between items-center text-sm" },
            React.createElement(Button, { variant: "secondary", onClick: () => setCurrentPage(p => Math.max(1, p - 1)), disabled: currentPage === 1 }, "Previous"),
            React.createElement('span', { className: "text-dark-text-secondary" }, `Page ${currentPage} of ${totalPages}`),
            React.createElement(Button, { variant: "secondary", onClick: () => setCurrentPage(p => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages }, "Next")
        ),

        React.createElement('div', { className: "mt-6" },
            React.createElement(Button, { onClick: () => setIsAddModalOpen(true) }, React.createElement(PlusIcon), " Add Past Log")
        ),

        (editingLog || isAddModalOpen) && React.createElement(DisabilityLogModal, 
            {
                isOpen: !!editingLog || isAddModalOpen,
                onClose: () => { setEditingLog(null); setIsAddModalOpen(false); },
                log: editingLog,
                disabilityLogs: disabilityLogs,
                onSave: handleSaveLog
            }
        )
    );
};

const DataManager = () => {
    const fileInputRef = React.useRef(null);

    const handleExport = async () => {
        try {
            const appData = {
                version: 2,
                exportedAt: new Date().toISOString(),
                attacks: await db.attacks.toArray(),
                medications: await db.medications.toArray(),
                medicationIntakes: await db.medicationIntakes.toArray(),
                triggers: await db.triggers.toArray(),
                symptoms: await db.symptoms.toArray(),
                triggerLogs: await db.triggerLogs.toArray(),
                mohRules: await db.mohRules.toArray(),
                disabilityLogs: await db.disabilityLogs.toArray(),
                lifeChanges: await db.lifeChanges.toArray(),
                notificationPrefs: JSON.parse(localStorage.getItem('migraine_notification_prefs') || '{}'),
            };

            const dataStr = JSON.stringify(appData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `migraine_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Data exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("Are you sure you want to import this file? This will overwrite all your current data.")) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not valid text");
                const data = JSON.parse(text);

                // Basic validation
                if (!data || typeof data !== 'object' || !Array.isArray(data.attacks)) {
                     throw new Error("Invalid data format");
                }

                // Ensure backward compatibility by running all imported data through migration functions.
                const migratedData = {
                    attacks: data.attacks ? migrateAttacks(data.attacks) : [],
                    medications: data.medications ? migrateMedications(data.medications) : [],
                    medicationIntakes: data.medicationIntakes ? migrateMedicationIntakes(data.medicationIntakes) : [],
                    triggers: data.triggers ? migrateTriggers(data.triggers) : [],
                    symptoms: data.symptoms ? migrateSymptoms(data.symptoms) : [],
                    triggerLogs: data.triggerLogs ? migrateTriggerLogs(data.triggerLogs) : [],
                    mohRules: data.mohRules ? migrateMohRules(data.mohRules) : [],
                    disabilityLogs: data.disabilityLogs || [], // Assume new field might not need migration yet
                };
                
                await db.transaction('rw', ...Object.values(db.tables), async () => {
                    // Clear all existing data
                    await Promise.all(Object.values(db.tables).map(table => table.clear()));

                    // Bulk add new, migrated data
                    if (migratedData.attacks.length > 0) await db.attacks.bulkAdd(migratedData.attacks);
                    if (migratedData.medications.length > 0) await db.medications.bulkAdd(migratedData.medications);
                    if (migratedData.medicationIntakes.length > 0) await db.medicationIntakes.bulkAdd(migratedData.medicationIntakes);
                    if (migratedData.triggers.length > 0) await db.triggers.bulkAdd(migratedData.triggers);
                    if (migratedData.symptoms.length > 0) await db.symptoms.bulkAdd(migratedData.symptoms);
                    if (migratedData.triggerLogs.length > 0) await db.triggerLogs.bulkAdd(migratedData.triggerLogs);
                    if (migratedData.mohRules.length > 0) await db.mohRules.bulkAdd(migratedData.mohRules);
                    if (migratedData.disabilityLogs.length > 0) await db.disabilityLogs.bulkAdd(migratedData.disabilityLogs);
                });

                alert('Data imported successfully! The app will now reload.');
                window.location.reload();

            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to import data. The file may be corrupt or in the wrong format.");
            }
        };
        reader.readAsText(file);
    };

    return React.createElement(Card, { title: "Data Management" },
        React.createElement('p', { className: "text-sm text-dark-text-secondary mb-4" }, "All your data is stored locally in your browser. You can export it to a file as a backup or to move to another device."),
        React.createElement('div', { className: "flex gap-4" },
            React.createElement(Button, { onClick: handleExport }, "Export All Data"),
            React.createElement(Button, { variant: "secondary", onClick: handleImportClick }, "Import Data"),
            React.createElement('input', { type: "file", ref: fileInputRef, onChange: handleFileChange, className: "hidden", accept: ".json" })
        ),
        React.createElement('div', { className: "mt-6 p-3 bg-dark-warning/10 border border-dark-warning/30 rounded-lg" },
            React.createElement('p', { className: "font-semibold text-dark-warning" }, "Warning"),
            React.createElement('p', { className: "text-sm text-dark-text-secondary" }, "Importing data will completely replace your existing data. Please make sure you have a backup if needed.")
        )
    );
};

const LogAndSettings = (props) => {
    const [activeTab, setActiveTab] = React.useState('attacks');
    const { disabilityLogs, upsertDisabilityLog } = props;

    return React.createElement('div', { className: "space-y-6" },
         React.createElement('h2', { className: "text-3xl font-bold text-dark-text-primary" }, "Logs & Settings"),
        React.createElement('div', { className: "border-b border-dark-border" },
            React.createElement('nav', { className: "-mb-px flex space-x-6 flex-wrap" },
                React.createElement(TabButton, { active: activeTab === 'attacks', onClick: () => setActiveTab('attacks') }, "Attack Log"),
                React.createElement(TabButton, { active: activeTab === 'meds', onClick: () => setActiveTab('meds') }, "Medications"),
                React.createElement(TabButton, { active: activeTab === 'triggers', onClick: () => setActiveTab('triggers') }, "Triggers"),
                React.createElement(TabButton, { active: activeTab === 'symptoms', onClick: () => setActiveTab('symptoms') }, "Symptoms"),
                React.createElement(TabButton, { active: activeTab === 'checkins', onClick: () => setActiveTab('checkins') }, "Daily Check-ins"),
                React.createElement(TabButton, { active: activeTab === 'disability', onClick: () => setActiveTab('disability') }, "Disability Log"),
                React.createElement(TabButton, { active: activeTab === 'data', onClick: () => setActiveTab('data') }, "Data Management")
            )
        ),
        React.createElement('div', null,
            activeTab === 'attacks' && React.createElement(AttackLog, props),
            activeTab === 'meds' && React.createElement(MedicationManager, props),
            activeTab === 'triggers' && React.createElement(TriggerManager, props),
            activeTab === 'symptoms' && React.createElement(SymptomManager, props),
            activeTab === 'checkins' && React.createElement(CheckinManager, props),
            activeTab === 'disability' && React.createElement(DisabilityLogManager, { disabilityLogs, upsertDisabilityLog }),
            activeTab === 'data' && React.createElement(DataManager, props)
        )
    );
};

export default LogAndSettings;
