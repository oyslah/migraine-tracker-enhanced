/**
 * Safely formats a date string, returning a fallback string if the date is invalid.
 * This prevents the app from crashing during render if it encounters a malformed date string in the data.
 * @param dateString The date string to format.
 * @param options Intl.DateTimeFormatOptions for formatting.
 * @param fallback The string to return on error.
 * @returns The formatted date string or the fallback.
 */
export const safeFormatDateTime = (
  dateString, 
  options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  fallback = 'Invalid Date'
) => {
  if (!dateString) return fallback;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return fallback;
  }
};

/**
 * Safely converts a date object or string into a string suitable for `<input type="datetime-local">`.
 * This function is crash-proof and correctly handles the user's local timezone.
 * It returns an empty string for invalid inputs, preventing render-crashing errors.
 * @param dateInput The Date object or string to convert.
 * @returns A string in 'YYYY-MM-DDTHH:mm' format or an empty string.
 */
export const safeToDateTimeLocal = (dateInput) => {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      return ''; // Gracefully handle invalid dates to prevent crashes.
    }

    const pad = (num) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error(`Error converting to datetime-local: ${dateInput}`, error);
    return '';
  }
};

/**
 * Safely converts a date object or string into a 'YYYY-MM-DD' string based on the user's local timezone.
 * This is crucial for correctly associating daily logs with events regardless of timezone.
 * This version corrects a bug where date-only strings were parsed as UTC, leading to off-by-one errors.
 * @param dateInput The Date object or string to convert.
 * @returns A string in 'YYYY-MM-DD' format or an empty string.
 */
export const toLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  try {
    let date;
    // Handle YYYY-MM-DD strings by constructing a new Date object that interprets them
    // in the local time zone, preventing off-by-one day errors.
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(num => parseInt(num, 10));
        date = new Date(year, month - 1, day);
    } else {
        date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    }

    if (isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Safely converts a date object or string into a 'YYYY-MM-DD' string based on UTC.
 * This is crucial for timezone-independent analytics.
 * @param dateInput The Date object or string to convert.
 * @returns A string in 'YYYY-MM-DD' format or an empty string.
 */
export const toUTCDateString = (dateInput) => {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      return '';
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};
