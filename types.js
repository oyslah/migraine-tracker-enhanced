// Interfaces and types are removed as they are not part of JavaScript.
// The application relies on the shape of the data (duck typing).

// Enums must be converted to plain JavaScript objects for runtime use.
export const MedicationType = {
  Preventive: 'preventive',
  Abortive: 'abortive',
  CGRPInhibitor: 'cgrp_inhibitor',
};

// Type definitions like MOHCategory are for static analysis and are removed.
// The actual values are used directly or from constants.
