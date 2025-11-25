/**
 * Formatting Utility Functions
 * 
 * Centralized formatting functions for dates, numbers, currency, and text.
 */

/**
 * Format a date to a localized string
 * @param {string|Date} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    if (!date) return 'N/A';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format a date with time
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
    if (!date) return 'Never';
    
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format a date to a short format (MM/DD/YYYY)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
};

/**
 * Format a date to a long format (Month Day, Year)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateLong = (date) => {
    if (!date) return 'N/A';
    
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Format a number as currency (KSH)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'KSH')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'KSH') => {
    if (amount === null || amount === undefined) return `${currency} 0`;
    
    const formatted = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    
    return `${currency} ${formatted}`;
};

/**
 * Format a number as a percentage
 * @param {number} value - The value to format (0-100)
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 0) => {
    if (value === null || value === undefined) return '0%';
    
    return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format a number with thousand separators
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    
    return Number(value).toLocaleString('en-US');
};

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @param {string} suffix - Suffix to add when truncated (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Truncate text to a specified number of words
 * @param {string} text - The text to truncate
 * @param {number} maxWords - Maximum number of words (default: 10)
 * @param {string} suffix - Suffix to add when truncated (default: '...')
 * @returns {string} Truncated text
 */
export const truncateWords = (text, maxWords = 10, suffix = '...') => {
    if (!text) return '';
    
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    
    return words.slice(0, maxWords).join(' ') + suffix;
};

/**
 * Capitalize the first letter of a string
 * @param {string} text - The text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Convert a string to title case
 * @param {string} text - The text to convert
 * @returns {string} Title case text
 */
export const toTitleCase = (text) => {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

