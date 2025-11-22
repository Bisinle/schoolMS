/**
 * Filter subjects based on school type
 * For madrasah schools, hide academic subjects
 * For islamic_school, show all subjects
 * 
 * @param {Array} subjects - Array of subject objects
 * @param {string} schoolType - School type ('islamic_school' or 'madrasah')
 * @returns {Array} Filtered subjects array
 */
export function filterSubjectsBySchoolType(subjects, schoolType) {
    if (!subjects || !Array.isArray(subjects)) {
        return [];
    }

    // If madrasah, filter out academic subjects
    if (schoolType === 'madrasah') {
        return subjects.filter(subject => subject.category !== 'academic');
    }

    // For islamic_school or any other type, return all subjects
    return subjects;
}

/**
 * Check if academic subjects should be shown for this school
 * 
 * @param {string} schoolType - School type ('islamic_school' or 'madrasah')
 * @returns {boolean} True if academic subjects should be shown
 */
export function shouldShowAcademicSubjects(schoolType) {
    return schoolType !== 'madrasah';
}

