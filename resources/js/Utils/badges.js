/**
 * Badge Utility Functions
 * 
 * Centralized badge styling functions for consistent UI across the application.
 * Each function returns Tailwind CSS classes for badges.
 */

/**
 * Get badge classes for status (active/inactive)
 * @param {string} status - The status value ('active' or 'inactive')
 * @returns {string} Tailwind CSS classes
 */
export const getStatusBadge = (status) => {
    const badges = {
        active: 'bg-green-100 text-green-700',
        inactive: 'bg-red-100 text-red-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
};

/**
 * Get badge classes for subject/document category
 * @param {string} category - The category value
 * @returns {string} Tailwind CSS classes
 */
export const getCategoryBadge = (category) => {
    const badges = {
        academic: 'bg-blue-100 text-blue-800',
        islamic: 'bg-green-100 text-green-800',
        core: 'bg-blue-100 text-blue-800',
        elective: 'bg-green-100 text-green-800',
        'co-curricular': 'bg-purple-100 text-purple-800',
    };
    return badges[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Get gradient classes for category (used in mobile cards)
 * @param {string} category - The category value
 * @returns {string} Tailwind CSS gradient classes
 */
export const getCategoryGradient = (category) => {
    const gradients = {
        core: 'from-blue-500 to-blue-600',
        elective: 'from-green-500 to-green-600',
        'co-curricular': 'from-purple-500 to-purple-600',
        academic: 'from-blue-500 to-blue-600',
        islamic: 'from-green-500 to-green-600',
    };
    return gradients[category] || 'from-gray-500 to-gray-600';
};

/**
 * Get badge classes for Quran tracking difficulty
 * @param {string} difficulty - The difficulty level
 * @returns {string} Tailwind CSS classes
 */
export const getDifficultyBadge = (difficulty) => {
    const badges = {
        very_well: 'bg-emerald-100 text-emerald-700',
        middle: 'bg-amber-100 text-amber-700',
        difficult: 'bg-rose-100 text-rose-700',
    };
    return badges[difficulty] || 'bg-gray-100 text-gray-700';
};

/**
 * Get badge classes for Quran reading type
 * @param {string} readingType - The reading type
 * @returns {string} Tailwind CSS classes
 */
export const getReadingTypeBadge = (readingType) => {
    const badges = {
        new_learning: 'bg-emerald-100 text-emerald-700',
        revision: 'bg-blue-100 text-blue-700',
        subac: 'bg-orange-100 text-orange-700',
    };
    return badges[readingType] || 'bg-gray-100 text-gray-700';
};

/**
 * Get badge classes for user roles
 * @param {string} role - The user role
 * @returns {string} Tailwind CSS classes
 */
export const getRoleBadge = (role) => {
    const badges = {
        admin: 'bg-purple-100 text-purple-800',
        teacher: 'bg-blue-100 text-blue-800',
        guardian: 'bg-green-100 text-green-800',
        accountant: 'bg-yellow-100 text-yellow-800',
        receptionist: 'bg-pink-100 text-pink-800',
        nurse: 'bg-red-100 text-red-800',
        it_staff: 'bg-indigo-100 text-indigo-800',
        maid: 'bg-gray-100 text-gray-800',
        cook: 'bg-orange-100 text-orange-800',
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
};

/**
 * Get badge classes for gender
 * @param {string} gender - The gender value
 * @returns {string} Tailwind CSS classes
 */
export const getGenderBadge = (gender) => {
    const badges = {
        male: 'bg-blue-100 text-blue-700',
        female: 'bg-pink-100 text-pink-700',
    };
    return badges[gender] || 'bg-gray-100 text-gray-700';
};

/**
 * Get badge classes for grade level
 * @param {string} level - The grade level
 * @returns {string} Tailwind CSS classes
 */
export const getLevelBadge = (level) => {
    const badges = {
        'ECD': 'bg-purple-100 text-purple-800',
        'LOWER PRIMARY': 'bg-blue-100 text-blue-800',
        'UPPER PRIMARY': 'bg-green-100 text-green-800',
        'JUNIOR SECONDARY': 'bg-orange-100 text-orange-800',
    };
    return badges[level] || 'bg-gray-100 text-gray-800';
};

/**
 * Get badge classes for document status
 * @param {string} status - The document status
 * @returns {string} Tailwind CSS classes
 */
export const getDocumentStatusBadge = (status) => {
    const badges = {
        pending: 'bg-yellow-100 text-yellow-800',
        verified: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        expired: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get badge classes for invoice status
 * @param {string} status - The invoice status ('pending', 'partial', 'paid', 'overdue')
 * @returns {string} Tailwind CSS classes
 */
export const getInvoiceStatusBadge = (status) => {
    const badges = {
        pending: 'bg-red-100 text-red-700 border border-red-200',
        partial: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        paid: 'bg-green-100 text-green-700 border border-green-200',
        overdue: 'bg-red-100 text-red-700 border border-red-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
};

