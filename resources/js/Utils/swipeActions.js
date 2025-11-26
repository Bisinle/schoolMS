/**
 * Centralized Swipe Action Color Mapping
 * 
 * This file provides a single source of truth for swipe action button colors
 * across all index pages (Students, Teachers, Guardians, Users, Subjects, etc.)
 * 
 * Instead of defining colors in each index page independently, we map action
 * labels to their semantic colors here. This ensures consistency and makes
 * it easy to update colors globally.
 * 
 * Usage:
 * - Import getActionColor() in SwipeActionButton component
 * - Pass the action label to get the appropriate color
 * - No need to specify color prop in index pages anymore
 * 
 * @example
 * const color = getActionColor('Delete'); // Returns 'red'
 * const color = getActionColor('View');   // Returns 'blue'
 */

/**
 * Centralized label-to-color mapping for swipe action buttons
 * 
 * Color Scheme:
 * - blue: View, informational actions
 * - indigo: Edit, modification actions
 * - green: Positive actions (Activate, Report, Call, Download)
 * - red: Destructive actions (Delete, Suspend, Deactivate)
 * - yellow: Warning/caution actions (Reset Password)
 * - orange: Moderate negative actions (Deactivate)
 * - purple: Special actions (Impersonate)
 */
export const ACTION_COLOR_MAP = {
    // Primary actions
    'View': 'blue',
    'Edit': 'indigo',
    'Delete': 'red',
    
    // Document/Report actions
    'Report': 'green',
    'Download': 'green',
    'Upload Document': 'indigo',
    'Schedule Exam': 'indigo',
    
    // User management actions
    'Reset Password': 'yellow',
    'Activate': 'green',
    'Deactivate': 'orange',
    'Suspend': 'red',
    'Impersonate': 'purple',
    
    // Communication actions
    'Call': 'green',
    'Email': 'blue',
    'Message': 'blue',
};

/**
 * Get the color for a swipe action button based on its label
 * 
 * @param {string} label - The action label (e.g., 'View', 'Edit', 'Delete')
 * @returns {string} The color name (e.g., 'blue', 'red', 'green')
 * 
 * @example
 * getActionColor('Delete')  // Returns 'red'
 * getActionColor('View')    // Returns 'blue'
 * getActionColor('Unknown') // Returns 'blue' (default)
 */
export function getActionColor(label) {
    return ACTION_COLOR_MAP[label] || 'blue'; // Default to blue if label not found
}

/**
 * Check if an action label is registered in the color map
 * 
 * @param {string} label - The action label to check
 * @returns {boolean} True if the label has a defined color
 */
export function hasActionColor(label) {
    return label in ACTION_COLOR_MAP;
}

/**
 * Get all registered action labels
 * 
 * @returns {string[]} Array of all action labels
 */
export function getRegisteredActions() {
    return Object.keys(ACTION_COLOR_MAP);
}

