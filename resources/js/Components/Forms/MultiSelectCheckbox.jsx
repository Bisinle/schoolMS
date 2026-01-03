import React from 'react';

/**
 * MultiSelectCheckbox Component
 * 
 * Multi-select component using checkboxes with visual feedback.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {string} props.label - Field label text
 * @param {string} props.name - Field name attribute
 * @param {Array} props.value - Array of selected values
 * @param {Function} props.onChange - Change handler (receives array of selected values)
 * @param {Array} props.options - Options array (format: [{ value, label }] or objects with id/name)
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether field is required (shows asterisk)
 * @param {string} props.helperText - Helper text below field
 * @param {string} props.className - Additional CSS classes for container
 * @param {number} props.gridCols - Number of columns (1, 2, 3, 4) default: 3
 * @param {Function} props.optionRenderer - Custom option renderer function
 * @param {string} props.valueKey - Key to use for value (default: 'id')
 * @param {string} props.labelKey - Key to use for label (default: 'name')
 * 
 * @example
 * <MultiSelectCheckbox
 *   label="Subject Specializations"
 *   name="subject_ids"
 *   value={selectedSubjects}
 *   onChange={(values) => setData('subject_ids', values)}
 *   options={subjects}
 *   error={errors.subject_ids}
 *   required
 *   helperText="Select all subjects this teacher can teach"
 * />
 */
export default function MultiSelectCheckbox({
    label,
    name,
    value = [],
    onChange,
    error,
    required = false,
    helperText,
    className = '',
    gridCols = 3,
    options = [],
    optionRenderer,
    valueKey = 'id',
    labelKey = 'name',
}) {
    const handleToggle = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        
        onChange(newValue);
    };

    const gridColsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={className}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Helper Text */}
            {helperText && !error && (
                <p className="text-sm text-gray-500 mb-3">
                    {helperText}
                </p>
            )}

            {/* Options Grid */}
            <div className={`grid ${gridColsClass[gridCols] || gridColsClass[3]} gap-3`}>
                {options.map((option) => {
                    const optionValue = option[valueKey] ?? option.value ?? option;
                    const optionLabel = option[labelKey] ?? option.label ?? option;
                    const isSelected = value.includes(optionValue);

                    if (optionRenderer) {
                        return optionRenderer(option, isSelected, () => handleToggle(optionValue));
                    }

                    return (
                        <label
                            key={optionValue}
                            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                    ? 'border-orange bg-orange bg-opacity-10'
                                    : 'border-gray-300 hover:border-orange hover:bg-gray-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                name={`${name}[]`}
                                checked={isSelected}
                                onChange={() => handleToggle(optionValue)}
                                className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900">
                                {optionLabel}
                            </span>
                        </label>
                    );
                })}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}

            {/* Selected Count */}
            {value.length > 0 && !error && (
                <p className="mt-2 text-sm text-gray-600">
                    {value.length} {value.length === 1 ? 'item' : 'items'} selected
                </p>
            )}
        </div>
    );
}

/**
 * MultiSelectCheckboxGrouped Component
 * 
 * Multi-select with options grouped by category.
 */
export function MultiSelectCheckboxGrouped({
    label,
    name,
    value = [],
    onChange,
    error,
    required = false,
    helperText,
    className = '',
    groupedOptions = {}, // { 'Category Name': [options] }
    valueKey = 'id',
    labelKey = 'name',
}) {
    const handleToggle = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        
        onChange(newValue);
    };

    return (
        <div className={className}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Helper Text */}
            {helperText && !error && (
                <p className="text-sm text-gray-500 mb-3">
                    {helperText}
                </p>
            )}

            {/* Grouped Options */}
            <div className="space-y-4">
                {Object.entries(groupedOptions).map(([category, options]) => (
                    <div key={category}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {options.map((option) => {
                                const optionValue = option[valueKey];
                                const optionLabel = option[labelKey];
                                const isSelected = value.includes(optionValue);

                                return (
                                    <label
                                        key={optionValue}
                                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-orange bg-orange bg-opacity-10'
                                                : 'border-gray-300 hover:border-orange hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            name={`${name}[]`}
                                            checked={isSelected}
                                            onChange={() => handleToggle(optionValue)}
                                            className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-900">
                                            {optionLabel}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}

            {/* Selected Count */}
            {value.length > 0 && !error && (
                <p className="mt-2 text-sm text-gray-600">
                    {value.length} {value.length === 1 ? 'subject' : 'subjects'} selected
                </p>
            )}
        </div>
    );
}

