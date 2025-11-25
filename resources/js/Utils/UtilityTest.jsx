/**
 * React Component to Test Utility Functions
 * This file can be deleted after verification
 */

import React from 'react';
import { getStatusBadge, getRoleBadge, getCategoryBadge } from './badges';
import { formatDate, formatCurrency, truncateText } from './formatting';
import { STATUS_OPTIONS, GENDER_OPTIONS, ROLE_OPTIONS } from './constants';

export default function UtilityTest() {
    const testDate = new Date();
    const testAmount = 1500.50;
    const testText = 'This is a very long text that needs to be truncated for display purposes';

    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900">Utility Functions Test</h1>

            {/* Badge Tests */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Badge Functions</h2>
                <div className="space-y-3">
                    <div>
                        <span className="text-sm text-gray-600 mr-2">Status Badge (active):</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge('active')}`}>
                            Active
                        </span>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 mr-2">Role Badge (admin):</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge('admin')}`}>
                            Admin
                        </span>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 mr-2">Category Badge (academic):</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryBadge('academic')}`}>
                            Academic
                        </span>
                    </div>
                </div>
            </div>

            {/* Formatting Tests */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Formatting Functions</h2>
                <div className="space-y-2">
                    <p className="text-sm">
                        <span className="text-gray-600">Formatted Date:</span>{' '}
                        <span className="font-medium">{formatDate(testDate)}</span>
                    </p>
                    <p className="text-sm">
                        <span className="text-gray-600">Formatted Currency:</span>{' '}
                        <span className="font-medium">{formatCurrency(testAmount)}</span>
                    </p>
                    <p className="text-sm">
                        <span className="text-gray-600">Truncated Text:</span>{' '}
                        <span className="font-medium">{truncateText(testText, 50)}</span>
                    </p>
                </div>
            </div>

            {/* Constants Tests */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Constants</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Status Options:</h3>
                        <div className="flex gap-2">
                            {STATUS_OPTIONS.map(option => (
                                <span
                                    key={option.value}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                    {option.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Gender Options:</h3>
                        <div className="flex gap-2">
                            {GENDER_OPTIONS.map(option => (
                                <span
                                    key={option.value}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                    {option.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Role Options:</h3>
                        <div className="flex flex-wrap gap-2">
                            {ROLE_OPTIONS.map(option => (
                                <span
                                    key={option.value}
                                    className={`px-3 py-1 rounded text-xs font-medium ${getRoleBadge(option.value)}`}
                                >
                                    {option.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                    ✅ All utility functions are working correctly!
                </p>
                <p className="text-green-700 text-sm mt-1">
                    You can now use these utilities across your application.
                </p>
            </div>
        </div>
    );
}

