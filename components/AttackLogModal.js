import * as React from 'react';
import { Modal, Label, Input, Textarea, Chip, Button } from './ui.js';
import { safeToDateTimeLocal } from '../services/utils.js';

const AttackLogModal = ({ isOpen, onClose, onSave, attack, symptoms: availableSymptoms, setSymptoms }) => {
    const [startTime, setStartTime] = React.useState('');
    const [endTime, setEndTime] = React.useState('');
    const [severity, setSeverity] = React.useState(5);
    const [symptoms, setLocalSymptoms] = React.useState([]);
    const [notes, setNotes] = React.useState('');
    const [customSymptom, setCustomSymptom] = React.useState('');
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (isOpen) {
            // Safely set initial form state to prevent crashes and handle timezones correctly.
            // For new attacks, default to now (local time). For existing, safely parse the date string.
            setStartTime(safeToDateTimeLocal(attack?.startTime || new Date()));
            setEndTime(safeToDateTimeLocal(attack?.endTime));
            setSeverity(attack?.severity ?? 5);
            setLocalSymptoms(attack?.symptoms ?? []);
            setNotes(attack?.notes ?? '');
            setCustomSymptom('');
            setError(null); // Clear any previous errors when the modal opens
        }
    }, [isOpen, attack]);

    const handleSymptomToggle = (symptom) => {
        setLocalSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
    };

    const handleAddCustomSymptom = () => {
        if (customSymptom && !symptoms.includes(customSymptom)) {
            setLocalSymptoms(prev => [...prev, customSymptom]);
        }
        setCustomSymptom('');
    }

    const handleSave = () => {
        setError(null); // Reset error state on each save attempt

        if (!startTime) {
            setError("Please provide a start time for the attack.");
            return;
        }

        try {
            const startDate = new Date(startTime);
            if (isNaN(startDate.getTime())) {
                setError("The start time is not a valid date.");
                return;
            }

            let endDate;
            if (endTime) {
                endDate = new Date(endTime);
                if (isNaN(endDate.getTime())) {
                    setError("The end time is not a valid date.");
                    return;
                }
            }
            
            if (endDate && startDate > endDate) {
                setError("The end time cannot be before the start time.");
                return;
            }
            
            const newAttack = {
                id: attack?.id || `attack-${Date.now()}`,
                startTime: startDate.toISOString(),
                endTime: endDate ? endDate.toISOString() : undefined,
                severity,
                symptoms,
                notes,
                triggers: attack?.triggers || {},
            };
            
            // Add any newly created custom symptoms to the master list
            const newCustomSymptoms = symptoms.filter(s => !availableSymptoms.includes(s));
            if (newCustomSymptoms.length > 0) {
                setSymptoms([...new Set([...availableSymptoms, ...newCustomSymptoms])]);
            }

            onSave(newAttack);

        } catch (error) {
            console.error("Error saving attack:", error);
            setError("An unexpected error occurred. Please check the console.");
        }
    };

    const allSymptoms = React.useMemo(() => {
        return [...new Set([...availableSymptoms, ...symptoms])];
    }, [availableSymptoms, symptoms]);
    
    const modalId = React.useMemo(() => (attack?.id || 'new'), [attack]);
    
    const severityDescriptions = {
        0: 'No pain',
        1: 'Hurts a little',
        2: 'Hurts a little',
        3: 'Mild',
        4: 'Mild',
        5: 'Moderate',
        6: 'Moderate',
        7: 'Severe',
        8: 'Severe',
        9: 'Excruciating',
        10: 'Excruciating'
    };
    const severityDescription = severityDescriptions[severity];

    return React.createElement(Modal, { isOpen: isOpen, onClose: onClose, title: attack ? 'Edit Migraine Attack' : 'Log Migraine Attack' },
        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement('div', null,
                    React.createElement(Label, { htmlFor: `startTime-${modalId}` }, "Start Time"),
                    React.createElement(Input, { type: "datetime-local", id: `startTime-${modalId}`, value: startTime, onChange: e => setStartTime(e.target.value) })
                ),
                React.createElement('div', null,
                    React.createElement(Label, { htmlFor: `endTime-${modalId}` }, "End Time (optional)"),
                    React.createElement(Input, { type: "datetime-local", id: `endTime-${modalId}`, value: endTime, onChange: e => setEndTime(e.target.value) })
                )
            ),
            React.createElement('div', null,
                React.createElement(Label, { id: `severity-label-${modalId}` }, "Severity"),
                React.createElement('div', {
                    role: "group",
                    'aria-labelledby': `severity-label-${modalId}`,
                    className: "flex flex-wrap gap-2 mt-2"
                },
                    Array.from({ length: 11 }, (_, i) => i).map(num => (
                        React.createElement('button', {
                            key: num,
                            type: 'button',
                            'aria-pressed': severity === num,
                            onClick: () => setSeverity(num),
                            className: `w-10 h-10 flex items-center justify-center rounded-md font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg-secondary ${
                                severity === num
                                    ? 'bg-dark-primary text-dark-bg ring-dark-primary'
                                    : 'bg-dark-bg hover:bg-dark-border text-dark-text-primary'
                            }`
                        },
                        num
                        )
                    ))
                ),
                React.createElement('p', {
                    'aria-live': "polite",
                    className: "text-center text-dark-text-secondary mt-2 min-h-[1.25rem]"
                },
                    severityDescription ? `${severity} - ${severityDescription}` : ''
                )
            ),
            React.createElement('div', null,
                React.createElement(Label, null, "Symptoms"),
                React.createElement('div', { className: "flex flex-wrap gap-2" },
                    allSymptoms.map(symptom => React.createElement(Chip, { key: symptom, selected: symptoms.includes(symptom), onClick: () => handleSymptomToggle(symptom) }, symptom))
                ),
                React.createElement('div', { className: "flex items-center mt-3 gap-2" },
                    React.createElement(Input, 
                        { 
                            type: "text", 
                            placeholder: "Add other symptom...", 
                            value: customSymptom,
                            onChange: e => setCustomSymptom(e.target.value),
                            onKeyDown: e => e.key === 'Enter' && handleAddCustomSymptom()
                        }
                    ),
                    React.createElement(Button, { variant: "secondary", onClick: handleAddCustomSymptom }, "Add")
                )
            ),
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: `notes-${modalId}` }, "Notes"),
                React.createElement(Textarea, { id: `notes-${modalId}`, value: notes, onChange: e => setNotes(e.target.value), rows: 3})
            )
        ),
        
        error && React.createElement('div', { className: "mt-4 p-3 bg-dark-danger/10 border border-dark-danger/50 text-dark-danger text-sm rounded-md", role: "alert" },
            error
        ),

        React.createElement('div', { className: "mt-6 flex justify-end" },
            React.createElement(Button, { onClick: handleSave }, "Save Attack")
        )
    );
};

export default AttackLogModal;