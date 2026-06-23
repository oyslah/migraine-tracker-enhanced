import * as React from 'react';

// --- ICONS ---

export const MenuIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16m-7 6h7" }));
export const XIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }));
export const ChartBarIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }));
export const CogIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }));
export const TrashIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }));
export const PlusIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }));
export const HomeIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }));
export const CalendarIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }));
export const BellIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" }));

// --- COMPONENTS ---

export const Card = React.forwardRef(
  ({ title, children, className, ...props }, ref) => React.createElement(
    'div',
    {
      ref: ref,
      className: `bg-dark-bg-secondary border border-dark-border rounded-lg shadow-lg p-6 ${className || ''}`,
      ...props
    },
    title && React.createElement('h3', { className: "text-xl font-bold text-dark-text-primary mb-4" }, title),
    children
  )
);
Card.displayName = 'Card';

export const Button = React.forwardRef(
  ({ children, className, variant = 'primary', ...props }, ref) => {
    const baseClasses = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors duration-200 flex items-center justify-center gap-2";
    const variantClasses = {
      primary: 'bg-dark-primary text-dark-bg hover:bg-dark-primary/90 focus:ring-dark-primary',
      secondary: 'bg-dark-border text-dark-text-primary hover:bg-dark-border/80 focus:ring-dark-border',
      danger: 'bg-dark-danger text-white hover:bg-dark-danger/90 focus:ring-dark-danger',
    };
    return React.createElement(
      'button',
      {
        ref: ref,
        className: `${baseClasses} ${variantClasses[variant]} ${className || ''}`,
        ...props
      },
      children
    );
});
Button.displayName = 'Button';

export const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = React.useRef(null);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  return React.createElement(
    'div',
    {
      className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50",
      onClick: onClose,
      'aria-modal': "true",
      role: "dialog"
    },
    React.createElement(
      'div',
      {
        ref: modalRef,
        className: "bg-dark-bg-secondary w-full max-w-lg m-4 rounded-lg shadow-xl border border-dark-border p-6 relative max-h-[90vh] overflow-y-auto",
        onClick: e => e.stopPropagation(),
        tabIndex: -1
      },
      React.createElement(
        'div',
        { className: "flex justify-between items-center mb-4" },
        React.createElement('h2', { className: "text-2xl font-bold text-dark-text-primary" }, title),
        React.createElement('button', { onClick: onClose, className: "text-dark-text-secondary hover:text-dark-text-primary" },
          React.createElement(XIcon)
        )
      ),
      children
    )
  );
};


export const Label = React.forwardRef(
  ({ className, children, ...props }, ref) => React.createElement(
    'label',
    {
      ref: ref,
      className: `block text-sm font-medium text-dark-text-secondary mb-1 ${className || ''}`,
      ...props
    },
    children
  )
);
Label.displayName = 'Label';

const inputBaseClasses = "w-full bg-dark-bg border border-dark-border rounded-md px-3 py-2 text-dark-text-primary placeholder-dark-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-dark-primary focus:border-dark-primary transition";

export const Input = React.forwardRef(
  ({ className, ...props }, ref) => React.createElement('input', { ref: ref, className: `${inputBaseClasses} ${className || ''}`, ...props })
);
Input.displayName = 'Input';


export const Textarea = React.forwardRef(
    ({ className, ...props }, ref) => React.createElement('textarea', { ref: ref, className: `${inputBaseClasses} ${className || ''}`, ...props })
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(
    ({ className, ...props }, ref) => React.createElement('select', { ref: ref, className: `${inputBaseClasses} appearance-none ${className || ''}`, ...props })
);
Select.displayName = 'Select';


export const Chip = React.forwardRef(
    ({ selected, children, onClick, className, ...props }, ref) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer";
    const selectedClasses = "bg-dark-primary text-dark-bg";
    const unselectedClasses = "bg-dark-border hover:bg-dark-border/80 text-dark-text-primary";
    return React.createElement(
        'span',
        {
            ref: ref,
            onClick: onClick,
            className: `${baseClasses} ${selected ? selectedClasses : unselectedClasses} ${className || ''}`,
            ...props
        },
        children
    );
});
Chip.displayName = 'Chip';

export const TabButton = React.forwardRef(
    ({ active, onClick, children, ...props }, ref) => React.createElement(
    'button',
    {
      ref: ref,
      onClick: onClick,
      className: `px-1 py-4 border-b-2 font-medium text-sm transition-colors
        ${active
          ? 'border-dark-primary text-dark-primary'
          : 'border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border'
        }`,
      ...props
    },
    children
));
TabButton.displayName = 'TabButton';