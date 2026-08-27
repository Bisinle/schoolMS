import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Plus, 
    Search, 
    Filter, 
    AlertTriangle, 
    Clock, 
    MapPin,
    Eye,
    Edit,
    Trash2,
    FileText,
    X
} from 'lucide-react';
import usePermissions from '@/Hooks/usePermissions';

export default function Index({ auth, reports, filters }) {
    const { can } = usePermissions();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        status: filters.status || '',
        severity: filters.severity || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('accident-reports.index'), {
            search: searchTerm,
            ...localFilters,
        });
    };

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        router.get(route('accident-reports.index'), {
            search: searchTerm,
            ...localFilters,
        });
        setShowFilters(false);
    };

    const clearFilters = () => {
        setLocalFilters({
            status: '',
            severity: '',
            date_from: '',
            date_to: '',
        });
        setSearchTerm('');
        router.get(route('accident-reports.index'));
    };

    const getSeverityColor = (severity) => {
        const colors = {
            minor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            severe: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return colors[severity] || colors.minor;
    };

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            under_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
        return colors[status] || colors.submitted;
    };

    const canCreate = can('accident-reports.create');

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Accident Reports" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Accident Reports
                            </h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Track and manage accident and injury reports
                            </p>
                        </div>
                        {canCreate && (
                            <Link
                                href={route('accident-reports.create')}
                                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                New Report
                            </Link>
                        )}
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by report number, location, or description..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
                            >
                                <Filter className="w-5 h-5 mr-2" />
                                Filters
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                            >
                                Search
                            </button>
                        </form>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={localFilters.status}
                                            onChange={(e) => handleFilterChange('status', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="submitted">Submitted</option>
                                            <option value="under_review">Under Review</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Severity
                                        </label>
                                        <select
                                            value={localFilters.severity}
                                            onChange={(e) => handleFilterChange('severity', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">All Severities</option>
                                            <option value="minor">Minor</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="severe">Severe</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date From
                                        </label>
                                        <input
                                            type="date"
                                            value={localFilters.date_from}
                                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date To
                                        </label>
                                        <input
                                            type="date"
                                            value={localFilters.date_to}
                                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={applyFilters}
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reports List */}
                    {reports.data.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No accident reports found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {searchTerm || Object.values(localFilters).some(v => v)
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first accident report'}
                            </p>
                            {canCreate && !searchTerm && (
                                <Link
                                    href={route('accident-reports.create')}
                                    className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create First Report
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.data.map((report) => (
                                <div
                                    key={report.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(report.severity)}`}>
                                                    {report.severity}
                                                </span>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                                                    {report.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {report.title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(report.incident_date).toLocaleDateString()} at {report.incident_time}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {report.location}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                                                {report.description}
                                            </p>
                                            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                Reported by: {report.reporter?.name || 'Unknown'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Link
                                                href={route('accident-reports.show', report.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                                title="View"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                            {can('accident-reports.update') && (auth.user.id === report.reported_by || auth.user.role === 'admin') && report.status !== 'closed' && (
                                                <Link
                                                    href={route('accident-reports.edit', report.id)}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {reports.links && reports.links.length > 3 && (
                        <div className="mt-6 flex justify-center">
                            <nav className="flex items-center gap-2">
                                {reports.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-4 py-2 rounded-lg transition ${
                                            link.active
                                                ? 'bg-orange-600 text-white'
                                                : link.url
                                                ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

