import * as React from 'react';
import { Modal, Label, Input, Select, Button, Chip } from './ui.js';
import { safeToDateTimeLocal } from '../services/utils.js';

const MedicationIntakeEditModal = ({ isOpen, onClose, onSave, intake, medications }) => {
    const [medicationId, setMedicationId] = React.useState('');
    const [timestamp, setTimestamp] = React.useState('');
    const [dose, setDose] = React.useState('');
    const [effectiveness, setEffectiveness] = React.useState(null);

    React.useEffect(() => {
        if (isOpen && intake) {
            setMedicationId(intake.medicationId);
            setTimestamp(safeToDateTimeLocal(intake.timestamp));
            setDose(intake.dose);
            setEffectiveness(intake.effectiveness || null);
        }
    }, [isOpen, intake]);

    const handleSave = () => {
        if (!intake) return;
        if (!medicationId || !timestamp) {
            alert("Please fill out all fields.");
            return;
        }
        try {
            const intakeDate = new Date(timestamp);
            if (isNaN(intakeDate.getTime())) throw new Error("Invalid timestamp");

            onSave({
                ...intake,
                medicationId,
                timestamp: intakeDate.toISOString(),
                dose,
                effectiveness,
            });
            onClose();
        } catch (error) {
            console.error("Error updating medication intake:", error);
            alert("Could not save. Please ensure the date and time are valid.");
        }
    };
    
    const EFFECTIVENESS_OPTIONS = [
        { id: null, label: 'Not Sure' },
        { id: 'not_effective', label: 'Not Effective' },
        { id: 'partially_effective', label: 'Partially Effective' },
        { id: 'effective', label: 'Effective' },
    ];

    return React.createElement(Modal, { isOpen: isOpen, onClose: onClose, title: "Edit Medication Intake" },
        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "med-select-edit" }, "Medication"),
                React.createElement(Select, 
                    {
                        id: "med-select-edit", 
                        value: medicationId, 
                        onChange: e => {
                            const newMedId = e.target.value;
                            setMedicationId(newMedId);
                            const selectedMed = medications.find(m => m.id === newMedId);
                            setDose(selectedMed?.dose || '');
                        }
                    },
                    medications.map(m => React.createElement('option', { key: m.id, value: m.id }, m.name))
                )
            ),
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "med-dose-edit" }, "Dose"),
                React.createElement(Input, { id: "med-dose-edit", placeholder: "e.g., 50mg", value: dose, onChange: e => setDose(e.target.value) })
            ),
            React.createElement('div', null,
                React.createElement(Label, { htmlFor: "med-time-edit" }, "Time Taken"),
                React.createElement(Input, { type: "datetime-local", id: "med-time-edit", value: timestamp, onChange: e => setTimestamp(e.target.value) })
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
            React.createElement(Button, { onClick: handleSave }, "Save Changes")
        )
    );
};

export default MedicationIntakeEditModal;
