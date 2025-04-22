/**
 * Utility functions for working with dates
 */

/**
 * Get a default start date (1 year ago from current date)
 * @returns {string} ISO date string YYYY-MM-DD
 */
export const getDefaultStartDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split("T")[0];
};

/**
 * Get the current date formatted as YYYY-MM-DD
 * @returns {string} ISO date string YYYY-MM-DD
 */
export const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Format a date object or ISO string to YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "";

  if (typeof date === "string") {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Parse the date string to create a Date object
    date = new Date(date);
  }

  return date.toISOString().split("T")[0];
};

/**
 * Check if a string is a valid date in YYYY-MM-DD format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Whether the string is a valid date
 */
export const isValidDateString = (dateString) => {
  if (!dateString) return false;

  // Check format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
