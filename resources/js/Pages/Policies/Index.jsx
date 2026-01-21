import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, CheckCircle, Calendar, Shield } from 'lucide-react';

export default function Index({ auth, policies, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('policies.index'), {
            search,
            type: typeFilter,
            status: statusFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (policy) => {
        if (confirm(`Are you sure you want to delete "${policy.title}"?`)) {
            router.delete(route('policies.destroy', policy.id), {
                preserveScroll: true,
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const policyTypes = {
        school_policy: 'School Policy',
        student_handbook: 'Student Handbook',
        staff_handbook: 'Staff Handbook',
        code_of_conduct: 'Code of Conduct',
        rules_regulations: 'Rules & Regulations',
        safety_policy: 'Safety Policy',
        academic_policy: 'Academic Policy',
        admission_policy: 'Admission Policy',
        fee_policy: 'Fee Policy',
        other: 'Other',
    };

    const statusColors = {
        draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Policies & Regulations" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Policies & Regulations
                            </h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {auth.user.role === 'admin'
                                    ? 'Manage school policies, handbooks, and regulations'
                                    : 'View school policies, handbooks, and regulations'
                                }
                            </p>
                        </div>
                        {auth.user.role === 'admin' && (
                            <Link
                                href={route('policies.create')}
                                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Create Policy
                            </Link>
                        )}
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                        <form onSubmit={handleSearch} className={`grid grid-cols-1 gap-4 ${auth.user.role === 'admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by title, policy number..."
                                        className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Type
                                </label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">All Types</option>
                                    {Object.entries(policyTypes).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            {auth.user.role === 'admin' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="draft">Draft</option>
                                        <option value="pending_approval">Pending Approval</option>
                                        <option value="approved">Approved</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            )}
                            <div className={`flex justify-end ${auth.user.role === 'admin' ? 'md:col-span-4' : 'md:col-span-3'}`}>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Policies List */}
                    <div className="space-y-4">
                        {policies.data.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No policies found</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {auth.user.role === 'admin' ? 'Get started by creating a new policy.' : 'No policies available yet.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {policies.data.map((policy) => (
                                    <div
                                        key={policy.id}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                {/* Left Section - Policy Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                                {policy.title}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                                    {policy.policy_number}
                                                                </span>
                                                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {policyTypes[policy.type]}
                                                                </span>
                                                            </div>
                                                            {policy.summary && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                                    {policy.summary}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section - Metadata & Actions */}
                                                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:items-end">
                                                    {/* Metadata */}
                                                    <div className="flex flex-wrap gap-3">
                                                        {/* Status Badge */}
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[policy.status]}`}>
                                                                {policy.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </div>

                                                        {/* Version */}
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                Version {policy.version}
                                                            </span>
                                                        </div>

                                                        {/* Effective Date */}
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                                            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                                                {formatDate(policy.effective_date)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={route('policies.show', policy.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                            title="View Policy"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            <span>View</span>
                                                        </Link>
                                                        {auth.user.role === 'admin' && (
                                                            <>
                                                                <Link
                                                                    href={route('policies.edit', policy.id)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
                                                                    title="Edit Policy"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    <span>Edit</span>
                                                                </Link>
                                                                {policy.status !== 'published' && (
                                                                    <button
                                                                        onClick={() => handleDelete(policy)}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                                        title="Delete Policy"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        <span>Delete</span>
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination */}
                                {policies.links && policies.links.length > 3 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                Showing <span className="font-medium">{policies.from}</span> to{' '}
                                                <span className="font-medium">{policies.to}</span> of{' '}
                                                <span className="font-medium">{policies.total}</span> results
                                            </div>
                                            <div className="flex gap-2">
                                                {policies.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                                            link.active
                                                                ? 'bg-blue-600 text-white shadow-sm'
                                                                : link.url
                                                                ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                                                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                        preserveState
                                                        preserveScroll
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

