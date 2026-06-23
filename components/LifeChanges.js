import * as React from 'react';
import { Card, Button, Modal, Label, Input, Select, TrashIcon } from './ui.js';

const CATEGORIES = [
  { id: 'new_preventative', label: 'New Preventative' },
  { id: 'workout', label: 'Started Workout' },
  { id: 'moved', label: 'Moved' },
  { id: 'diet', label: 'Diet Change' },
  { id: 'other', label: 'Other' },
];

const LifeChangeModal = ({ isOpen, onClose, onSave, lifeChange }) => {
  const [date, setDate] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('other');

  React.useEffect(() => {
    if (isOpen) {
      setDate(lifeChange?.date || new Date().toISOString().slice(0, 10));
      setDescription(lifeChange?.description || '');
      setCategory(lifeChange?.category || 'other');
    }
  }, [isOpen, lifeChange]);

  const handleSave = () => {
    if (!date || !description.trim()) {
      alert('Please fill in both date and description.');
      return;
    }
    onSave({
      id: lifeChange?.id || `lc-${Date.now()}`,
      date,
      description: description.trim(),
      category,
    });
    onClose();
  };

  return React.createElement(Modal, { isOpen, onClose, title: lifeChange ? 'Edit Life Change' : 'Add Life Change' },
    React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', null,
        React.createElement(Label, { htmlFor: 'lc-date' }, 'Date'),
        React.createElement(Input, { type: 'date', id: 'lc-date', value: date, onChange: e => setDate(e.target.value) })
      ),
      React.createElement('div', null,
        React.createElement(Label, { htmlFor: 'lc-category' }, 'Category'),
        React.createElement(Select, { id: 'lc-category', value: category, onChange: e => setCategory(e.target.value) },
          CATEGORIES.map(c => React.createElement('option', { key: c.id, value: c.id }, c.label))
        )
      ),
      React.createElement('div', null,
        React.createElement(Label, { htmlFor: 'lc-desc' }, 'Description'),
        React.createElement(Input, { id: 'lc-desc', value: description, onChange: e => setDescription(e.target.value), placeholder: 'e.g., Started Emgality 140mg' })
      )
    ),
    React.createElement('div', { className: 'mt-6 flex justify-end gap-2' },
      React.createElement(Button, { variant: 'secondary', onClick: onClose }, 'Cancel'),
      React.createElement(Button, { onClick: handleSave }, 'Save')
    )
  );
};

const LifeChanges = ({ lifeChanges, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);

  const sorted = React.useMemo(
    () => [...lifeChanges].sort((a, b) => b.date.localeCompare(a.date)),
    [lifeChanges]
  );

  const getCategoryLabel = (catId) => {
    const c = CATEGORIES.find(x => x.id === catId);
    return c ? c.label : catId;
  };

  const formatDate = (dateStr) => {
    try {
      const [y, m, d] = dateStr.split('-');
      return new Date(+y, +m - 1, +d).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return dateStr; }
  };

  return React.createElement('div', { className: 'space-y-6' },
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h2', { className: 'text-3xl font-bold text-dark-text-primary' }, 'Life Changes'),
      React.createElement(Button, { variant: 'primary', onClick: () => { setEditingId(null); setIsModalOpen(true); } }, '+ Add Life Change')
    ),
    React.createElement('p', { className: 'text-sm text-dark-text-secondary -mt-4' },
      'Track new preventatives, lifestyle changes, and other events. These appear as markers on your analytics charts so you can see their impact.'
    ),
    sorted.length === 0 ? React.createElement(Card, null,
      React.createElement('p', { className: 'text-dark-text-secondary text-center py-8' },
        'No life changes recorded yet. Add your first one to start tracking how changes affect your migraines.'
      )
    ) : React.createElement('div', { className: 'space-y-3' },
      sorted.map(lc => React.createElement(Card, { key: lc.id },
        React.createElement('div', { className: 'flex justify-between items-start gap-4' },
          React.createElement('div', { className: 'flex-grow' },
            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
              React.createElement('span', { className: 'text-xs font-semibold px-2 py-0.5 rounded-full bg-dark-bg text-dark-text-secondary' },
                getCategoryLabel(lc.category)
              ),
              React.createElement('span', { className: 'text-sm text-dark-text-secondary' }, formatDate(lc.date))
            ),
            React.createElement('p', { className: 'text-dark-text-primary' }, lc.description)
          ),
          React.createElement('div', { className: 'flex gap-2 flex-shrink-0' },
            React.createElement(Button, { variant: 'secondary', className: 'px-2 py-1 text-sm', onClick: () => { setEditingId(lc); setIsModalOpen(true); } }, 'Edit'),
            React.createElement(Button, { variant: 'secondary', className: 'px-2 py-1 text-sm text-dark-danger', onClick: () => {
              if (confirm('Delete this life change?')) onDelete(lc.id);
            } }, '×')
          )
        )
      ))
    ),
    React.createElement(LifeChangeModal, {
      isOpen: isModalOpen,
      onClose: () => setIsModalOpen(false),
      onSave: (lc) => editingId ? onUpdate(lc) : onAdd(lc),
      lifeChange: editingId,
    })
  );
};

export default LifeChanges;
