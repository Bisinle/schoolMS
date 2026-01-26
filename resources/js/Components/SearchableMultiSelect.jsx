import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';

export default function SearchableMultiSelect({ 
    options = [], 
    selected = [], 
    onChange, 
    placeholder = "Search...",
    label,
    required = false,
    error = null,
    getOptionLabel = (option) => option.name,
    getOptionSubLabel = (option) => null,
    getOptionId = (option) => option.id,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search term
    const filteredOptions = options.filter(option => {
        const searchLower = searchTerm.toLowerCase();
        const label = getOptionLabel(option)?.toLowerCase() || '';
        const subLabel = getOptionSubLabel(option)?.toLowerCase() || '';
        return label.includes(searchLower) || subLabel.includes(searchLower);
    });

    // Get selected option objects
    const selectedOptions = options.filter(option => 
        selected.includes(getOptionId(option))
    );

    const handleSelect = (option) => {
        const optionId = getOptionId(option);
        if (!selected.includes(optionId)) {
            onChange([...selected, optionId]);
            setSearchTerm('');
        }
    };

    const handleRemove = (optionId) => {
        onChange(selected.filter(id => id !== optionId));
    };

    return (
        <div ref={wrapperRef} className="relative">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            {/* Selected Items */}
            {selectedOptions.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {selectedOptions.map(option => (
                        <div
                            key={getOptionId(option)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm"
                        >
                            <span>{getOptionLabel(option)}</span>
                            {getOptionSubLabel(option) && (
                                <span className="text-xs opacity-75">({getOptionSubLabel(option)})</span>
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemove(getOptionId(option))}
                                className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
            </div>

            {/* Dropdown */}
            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.map(option => {
                        const optionId = getOptionId(option);
                        const isSelected = selected.includes(optionId);
                        
                        return (
                            <button
                                key={optionId}
                                type="button"
                                onClick={() => handleSelect(option)}
                                disabled={isSelected}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between ${
                                    isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                            >
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {getOptionLabel(option)}
                                    </div>
                                    {getOptionSubLabel(option) && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {getOptionSubLabel(option)}
                                        </div>
                                    )}
                                </div>
                                {isSelected && (
                                    <span className="text-xs text-green-600 dark:text-green-400">Selected</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* No Results */}
            {isOpen && searchTerm && filteredOptions.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}

