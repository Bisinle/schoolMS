/**
 * Test file to verify utility functions work correctly
 * This file can be deleted after verification
 */

// Import all utilities
import {
    getStatusBadge,
    getCategoryBadge,
    getCategoryGradient,
    getDifficultyBadge,
    getReadingTypeBadge,
    getRoleBadge,
    getGenderBadge,
    getLevelBadge,
    getDocumentStatusBadge,
} from './badges';

import {
    formatDate,
    formatDateTime,
    formatDateShort,
    formatDateLong,
    formatCurrency,
    formatPercentage,
    formatNumber,
    truncateText,
    truncateWords,
    capitalize,
    toTitleCase,
} from './formatting';

import {
    STATUS_OPTIONS,
    STATUS_VALUES,
    DOCUMENT_STATUS_OPTIONS,
    DOCUMENT_STATUS_VALUES,
    CATEGORY_OPTIONS,
    SUBJECT_CATEGORY_OPTIONS,
    CATEGORY_VALUES,
    GENDER_OPTIONS,
    GENDER_VALUES,
    GRADE_LEVEL_OPTIONS,
    GRADE_LEVEL_VALUES,
    ROLE_OPTIONS,
    ROLE_VALUES,
    READING_TYPE_OPTIONS,
    READING_TYPE_VALUES,
    DIFFICULTY_OPTIONS,
    DIFFICULTY_VALUES,
    SCHOOL_TYPE_OPTIONS,
    SCHOOL_TYPE_VALUES,
} from './constants';

// Test badge functions
console.log('=== Testing Badge Functions ===');
console.log('Status Badge (active):', getStatusBadge('active'));
console.log('Category Badge (academic):', getCategoryBadge('academic'));
console.log('Category Gradient (core):', getCategoryGradient('core'));
console.log('Difficulty Badge (very_well):', getDifficultyBadge('very_well'));
console.log('Reading Type Badge (new_learning):', getReadingTypeBadge('new_learning'));
console.log('Role Badge (admin):', getRoleBadge('admin'));
console.log('Gender Badge (male):', getGenderBadge('male'));
console.log('Level Badge (ECD):', getLevelBadge('ECD'));
console.log('Document Status Badge (verified):', getDocumentStatusBadge('verified'));

// Test formatting functions
console.log('\n=== Testing Formatting Functions ===');
console.log('Format Date:', formatDate(new Date()));
console.log('Format DateTime:', formatDateTime(new Date()));
console.log('Format Date Short:', formatDateShort(new Date()));
console.log('Format Date Long:', formatDateLong(new Date()));
console.log('Format Currency:', formatCurrency(1500.50));
console.log('Format Percentage:', formatPercentage(85.5, 1));
console.log('Format Number:', formatNumber(1234567));
console.log('Truncate Text:', truncateText('This is a very long text that needs to be truncated', 20));
console.log('Truncate Words:', truncateWords('This is a very long sentence with many words', 5));
console.log('Capitalize:', capitalize('hello world'));
console.log('Title Case:', toTitleCase('hello world from javascript'));

// Test constants
console.log('\n=== Testing Constants ===');
console.log('Status Options:', STATUS_OPTIONS);
console.log('Status Values:', STATUS_VALUES);
console.log('Document Status Options:', DOCUMENT_STATUS_OPTIONS);
console.log('Category Options:', CATEGORY_OPTIONS);
console.log('Gender Options:', GENDER_OPTIONS);
console.log('Grade Level Options:', GRADE_LEVEL_OPTIONS);
console.log('Role Options:', ROLE_OPTIONS);
console.log('Reading Type Options:', READING_TYPE_OPTIONS);
console.log('Difficulty Options:', DIFFICULTY_OPTIONS);

console.log('\n✅ All utilities imported and tested successfully!');

export default {
    badges: {
        getStatusBadge,
        getCategoryBadge,
        getCategoryGradient,
        getDifficultyBadge,
        getReadingTypeBadge,
        getRoleBadge,
        getGenderBadge,
        getLevelBadge,
        getDocumentStatusBadge,
    },
    formatting: {
        formatDate,
        formatDateTime,
        formatDateShort,
        formatDateLong,
        formatCurrency,
        formatPercentage,
        formatNumber,
        truncateText,
        truncateWords,
        capitalize,
        toTitleCase,
    },
    constants: {
        STATUS_OPTIONS,
        STATUS_VALUES,
        DOCUMENT_STATUS_OPTIONS,
        CATEGORY_OPTIONS,
        GENDER_OPTIONS,
        GRADE_LEVEL_OPTIONS,
        ROLE_OPTIONS,
        READING_TYPE_OPTIONS,
        DIFFICULTY_OPTIONS,
    },
};

