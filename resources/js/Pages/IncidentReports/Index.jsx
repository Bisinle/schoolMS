import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { AlertOctagon, Plus, Search, Funnel, X, Eye, Edit, Trash2 } from 'lucide-react';

export default function Index({ auth, reports, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        status: filters.status || '',
        severity: filters.severity || '',
        incident_type: filters.incident_type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('incident-reports.index'), {
            search,
            ...localFilters,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        router.get(route('incident-reports.index'), {
            search,
            ...localFilters,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
        setShowFilters(false);
    };

    const clearFilters = () => {
        setSearch('');
        setLocalFilters({
            status: '',
            severity: '',
            incident_type: '',
            date_from: '',
            date_to: '',
        });
        router.get(route('incident-reports.index'));
    };

    const getSeverityColor = (severity) => {
        const colors = {
            minor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            severe: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return colors[severity] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    const getStatusColor = (status) => {
        const colors = {
            open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            investigating: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    const getIncidentTypeLabel = (type) => {
        const labels = {
            bullying: 'Bullying',
            fighting: 'Fighting',
            theft: 'Theft',
            vandalism: 'Vandalism',
            disrespect: 'Disrespect',
            cheating: 'Cheating',
            truancy: 'Truancy',
            substance_abuse: 'Substance Abuse',
            weapons: 'Weapons',
            harassment: 'Harassment',
            other: 'Other',
        };
        return labels[type] || type;
    };

    const canCreate = ['admin', 'teacher'].includes(auth.user.role);
    const canEdit = (report) => {
        return auth.user.role === 'admin' || report.reporter_id === auth.user.id;
    };
    const canDelete = auth.user.role === 'admin';

    const handleDelete = (e, reportId) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm('Are you sure you want to delete this incident report? This action cannot be undone.')) {
            router.delete(route('incident-reports.destroy', reportId), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Incident Reports" />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                    <AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                        Incident Reports
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Behavioral and security incident tracking
                                    </p>
                                </div>
                            </div>

                            {canCreate && (
                                <Link
                                    href={route('incident-reports.create')}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200 gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Create Report</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by report number, location, description..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 gap-2"
                            >
                                <Funnel className="w-5 h-5" />
                                <span>Filters</span>
                            </button>

                            <button
                                type="submit"
                                className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 gap-2"
                            >
                                <Search className="w-5 h-5" />
                                <span>Search</span>
                            </button>
                        </form>

                        {/* Filters Panel */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                            <option value="open">Open</option>
                                            <option value="investigating">Investigating</option>
                                            <option value="resolved">Resolved</option>
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
                                            Incident Type
                                        </label>
                                        <select
                                            value={localFilters.incident_type}
                                            onChange={(e) => handleFilterChange('incident_type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">All Types</option>
                                            <option value="bullying">Bullying</option>
                                            <option value="fighting">Fighting</option>
                                            <option value="theft">Theft</option>
                                            <option value="vandalism">Vandalism</option>
                                            <option value="disrespect">Disrespect</option>
                                            <option value="cheating">Cheating</option>
                                            <option value="truancy">Truancy</option>
                                            <option value="substance_abuse">Substance Abuse</option>
                                            <option value="weapons">Weapons</option>
                                            <option value="harassment">Harassment</option>
                                            <option value="other">Other</option>
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

                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={applyFilters}
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200"
                                    >
                                        Apply Filters
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reports List */}
                    {reports.data.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                            <AlertOctagon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No incident reports found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {search || Object.values(localFilters).some(v => v)
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first incident report'}
                            </p>
                            {canCreate && !search && !Object.values(localFilters).some(v => v) && (
                                <Link
                                    href={route('incident-reports.create')}
                                    className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Create First Report</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.data.map((report) => (
                                <div
                                    key={report.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <Link
                                            href={route('incident-reports.show', report.id)}
                                            className="flex-1 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                                    {report.report_number}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                                                    {report.severity}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                    {report.status}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {report.title}
                                            </h3>

                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                                {report.description}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span>📅 {new Date(report.incident_date).toLocaleDateString()}</span>
                                                <span>📍 {report.location}</span>
                                                <span>👤 {report.reporter?.name || 'Unknown'}</span>
                                                {report.students_involved && (
                                                    <span>👥 {report.students_involved.length} student(s)</span>
                                                )}
                                            </div>
                                        </Link>

                                        {/* CRUD Buttons */}
                                        <div className="flex sm:flex-col gap-2 sm:ml-4">
                                            <Link
                                                href={route('incident-reports.show', report.id)}
                                                className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                                                title="View"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>

                                            {canEdit(report) && (
                                                <Link
                                                    href={route('incident-reports.edit', report.id)}
                                                    className="inline-flex items-center justify-center p-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg transition-colors duration-200"
                                                    title="Edit"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </Link>
                                            )}

                                            {canDelete && (
                                                <button
                                                    onClick={(e) => handleDelete(e, report.id)}
                                                    className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
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
                            <nav className="flex gap-2">
                                {reports.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-4 py-2 rounded-lg ${
                                            link.active
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
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

