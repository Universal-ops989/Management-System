/**
 * Date Helper Functions
 * Utilities for getting default date values based on current date
 */

/**
 * Get current month in YYYY-MM format
 * @returns {string} - Current month in YYYY-MM format (e.g., "2026-01")
 */
export function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get current week range (Monday to Sunday)
 * @returns {Object} - Object with dateFrom and dateTo in YYYY-MM-DD format
 */
export function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    dateFrom: formatDate(monday),
    dateTo: formatDate(sunday)
  };
}

/**
 * Get current month range (first day to last day of current month)
 * @returns {Object} - Object with dateFrom and dateTo in YYYY-MM-DD format
 */
export function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDay = new Date(year, month, 1);
  firstDay.setHours(0, 0, 0, 0);
  
  const lastDay = new Date(year, month + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  return {
    dateFrom: formatDate(firstDay),
    dateTo: formatDate(lastDay)
  };
}

/**
 * Format date to YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export function formatDateToYYYYMMDD(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

