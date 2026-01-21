import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, CheckCircle, Clock, User, Calendar, FileText, Trash2 } from 'lucide-react';

export default function Show({ auth, policy, hasAcknowledged, acknowledgmentStats }) {
    const handleAcknowledge = () => {
        if (confirm('By clicking OK, you acknowledge that you have read and understood this policy.')) {
            router.post(route('policies.acknowledge', policy.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const handlePublish = () => {
        if (confirm('Are you sure you want to publish this policy? It will be visible to all users.')) {
            router.post(route('policies.publish', policy.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${policy.title}"?`)) {
            router.delete(route('policies.destroy', policy.id));
        }
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
            <Head title={policy.title} />

            <div className="py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href={route('policies.index')}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {policy.title}
                                    </h1>
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[policy.status]}`}>
                                        {policy.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {policy.policy_number} • Version {policy.version}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                            {auth.user.role === 'admin' && (
                                <>
                                    {policy.status === 'draft' && (
                                        <button
                                            onClick={handlePublish}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Publish
                                        </button>
                                    )}
                                    <Link
                                        href={route('policies.edit', policy.id)}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                                    >
                                        <Edit className="w-5 h-5 mr-2" />
                                        Edit
                                    </Link>
                                    {policy.status !== 'published' && (
                                        <button
                                            onClick={handleDelete}
                                            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                                        >
                                            <Trash2 className="w-5 h-5 mr-2" />
                                            Delete
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-start space-x-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {policy.creator?.name || 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            {policy.effective_date && (
                                <div className="flex items-start space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Effective Date</p>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(policy.effective_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {policy.review_date && (
                                <div className="flex items-start space-x-3">
                                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Review Date</p>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(policy.review_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {policy.summary && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Summary</p>
                                <p className="text-sm text-gray-900 dark:text-white">{policy.summary}</p>
                            </div>
                        )}

                        {policy.tags && policy.tags.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {policy.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Acknowledgment Banner */}
                    {policy.requires_acknowledgment && policy.status === 'published' && !hasAcknowledged && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                            Acknowledgment Required
                                        </h3>
                                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                                            This policy requires your acknowledgment. Please read the policy carefully and click the button to acknowledge.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAcknowledge}
                                    className="ml-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition whitespace-nowrap"
                                >
                                    I Acknowledge
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Already Acknowledged */}
                    {policy.requires_acknowledgment && hasAcknowledged && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <p className="text-sm text-green-800 dark:text-green-300">
                                    You have acknowledged this policy.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Acknowledgment Stats (Admin Only) */}
                    {acknowledgmentStats && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                            Acknowledgment Rate
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-400">
                                            {acknowledgmentStats.count} users have acknowledged this policy
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {acknowledgmentStats.rate.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Policy Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
                        <div
                            className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: policy.content }}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 flex items-center justify-between">
                        {auth.user.role === 'admin' && (
                            <Link
                                href={route('policies.revisions', policy.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Revision History
                            </Link>
                        )}
                        <p className={`text-sm text-gray-500 dark:text-gray-400 ${auth.user.role !== 'admin' ? 'ml-auto' : ''}`}>
                            Last updated: {new Date(policy.updated_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

