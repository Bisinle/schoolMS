/**
 * Constants and Shared Options
 * 
 * Centralized constants for status values, categories, and other repeated options.
 */

/**
 * Status options used across the application
 */
export const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export const STATUS_VALUES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

/**
 * Document status options
 */
export const DOCUMENT_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' },
];

export const DOCUMENT_STATUS_VALUES = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
};

/**
 * Subject/Document category options
 */
export const CATEGORY_OPTIONS = [
    { value: 'academic', label: 'Academic' },
    { value: 'islamic', label: 'Islamic' },
];

export const SUBJECT_CATEGORY_OPTIONS = [
    { value: 'core', label: 'Core' },
    { value: 'elective', label: 'Elective' },
    { value: 'co-curricular', label: 'Co-Curricular' },
];

export const CATEGORY_VALUES = {
    ACADEMIC: 'academic',
    ISLAMIC: 'islamic',
    CORE: 'core',
    ELECTIVE: 'elective',
    CO_CURRICULAR: 'co-curricular',
};

/**
 * Gender options
 */
export const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
];

export const GENDER_VALUES = {
    MALE: 'male',
    FEMALE: 'female',
};

/**
 * Grade level options (for non-madrasah schools)
 */
export const GRADE_LEVEL_OPTIONS = [
    { value: 'ECD', label: 'ECD' },
    { value: 'LOWER PRIMARY', label: 'Lower Primary' },
    { value: 'UPPER PRIMARY', label: 'Upper Primary' },
    { value: 'JUNIOR SECONDARY', label: 'Junior Secondary' },
];

export const GRADE_LEVEL_VALUES = {
    ECD: 'ECD',
    LOWER_PRIMARY: 'LOWER PRIMARY',
    UPPER_PRIMARY: 'UPPER PRIMARY',
    JUNIOR_SECONDARY: 'JUNIOR SECONDARY',
};

/**
 * User role options
 */
export const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'it_staff', label: 'IT Staff' },
    { value: 'maid', label: 'Maid' },
    { value: 'cook', label: 'Cook' },
];

export const ROLE_VALUES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    GUARDIAN: 'guardian',
    ACCOUNTANT: 'accountant',
    RECEPTIONIST: 'receptionist',
    NURSE: 'nurse',
    IT_STAFF: 'it_staff',
    MAID: 'maid',
    COOK: 'cook',
};

/**
 * Quran tracking reading type options
 */
export const READING_TYPE_OPTIONS = [
    { value: 'new_learning', label: 'New Learning' },
    { value: 'revision', label: 'Revision' },
    { value: 'subac', label: 'Subac' },
];

export const READING_TYPE_VALUES = {
    NEW_LEARNING: 'new_learning',
    REVISION: 'revision',
    SUBAC: 'subac',
};

/**
 * Quran tracking difficulty options
 */
export const DIFFICULTY_OPTIONS = [
    { value: 'very_well', label: 'Very Well' },
    { value: 'middle', label: 'Middle' },
    { value: 'difficult', label: 'Difficult' },
];

export const DIFFICULTY_VALUES = {
    VERY_WELL: 'very_well',
    MIDDLE: 'middle',
    DIFFICULT: 'difficult',
};

/**
 * School type options
 */
export const SCHOOL_TYPE_OPTIONS = [
    { value: 'madrasah', label: 'Madrasah' },
    { value: 'regular', label: 'Regular School' },
];

export const SCHOOL_TYPE_VALUES = {
    MADRASAH: 'madrasah',
    REGULAR: 'regular',
};

