import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react';

export default function Revisions({ auth, policy, revisions }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Revision History - ${policy.title}`} />

            <div className="py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href={route('policies.show', policy.id)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Revision History
                                </h1>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {policy.title} • {policy.policy_number}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Current Version */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Current Version: {policy.version}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Last updated: {new Date(policy.updated_at).toLocaleString()}
                                </p>
                            </div>
                            <Link
                                href={route('policies.show', policy.id)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                            >
                                View Current
                            </Link>
                        </div>
                    </div>

                    {/* Revisions List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        {revisions.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    No revision history
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    This policy has not been revised yet.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {revisions.map((revision, index) => (
                                    <div key={revision.id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                        Version {revision.version}
                                                    </h3>
                                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                                                        Revision #{revisions.length - index}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center space-x-1">
                                                        <User className="w-4 h-4" />
                                                        <span>{revision.revisor?.name || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{new Date(revision.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {revision.revision_notes && (
                                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="font-medium">Notes:</span> {revision.revision_notes}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Content Preview */}
                                                <details className="mt-4">
                                                    <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                                        View Content
                                                    </summary>
                                                    <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                        <div 
                                                            className="prose prose-sm max-w-none dark:prose-invert"
                                                            dangerouslySetInnerHTML={{ __html: revision.content }}
                                                        />
                                                    </div>
                                                </details>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

