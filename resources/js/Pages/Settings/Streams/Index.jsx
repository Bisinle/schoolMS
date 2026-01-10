import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Edit, Trash2, Unlink, Eye } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ auth, streams }) {
    const [deleteModal, setDeleteModal] = useState({ show: false, stream: null });
    const [unlinkModal, setUnlinkModal] = useState({ show: false, stream: null });

    const handleDelete = (stream) => {
        setDeleteModal({ show: true, stream });
    };

    const confirmDelete = () => {
        if (deleteModal.stream) {
            router.delete(`/streams/${deleteModal.stream.id}`, {
                onSuccess: () => setDeleteModal({ show: false, stream: null }),
            });
        }
    };

    const handleUnlink = (stream) => {
        setUnlinkModal({ show: true, stream });
    };

    const confirmUnlink = () => {
        if (unlinkModal.stream) {
            router.post(`/streams/${unlinkModal.stream.id}/unlink`, {}, {
                onSuccess: () => setUnlinkModal({ show: false, stream: null }),
            });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Streams" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-semibold text-gray-800">Streams</h2>
                                <Link
                                    href="/streams/create"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Stream
                                </Link>
                            </div>
                        </div>

                        <div className="p-6">
                            {streams.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No streams found. Create your first stream to get started.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grades</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {streams.map((stream) => (
                                                <tr key={stream.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{stream.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{stream.code || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{stream.grades_count} grade(s)</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            stream.status === 'active' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {stream.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                href={`/streams/${stream.id}`}
                                                                className="text-blue-600 hover:text-blue-900"
                                                                title="View"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <Link
                                                                href={`/streams/${stream.id}/edit`}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                            {stream.grades_count > 0 && (
                                                                <button
                                                                    onClick={() => handleUnlink(stream)}
                                                                    className="text-orange-600 hover:text-orange-900"
                                                                    title="Unlink from all grades"
                                                                >
                                                                    <Unlink className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(stream)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, stream: null })}
                onConfirm={confirmDelete}
                title="Delete Stream"
                message={`Are you sure you want to delete "${deleteModal.stream?.name}"? ${
                    deleteModal.stream?.grades_count > 0
                        ? 'This stream is currently used by ' + deleteModal.stream.grades_count + ' grade(s). Please unlink all grades first.'
                        : 'This action cannot be undone.'
                }`}
            />

            {/* Unlink Confirmation Modal */}
            <ConfirmationModal
                show={unlinkModal.show}
                onClose={() => setUnlinkModal({ show: false, stream: null })}
                onConfirm={confirmUnlink}
                title="Unlink Stream"
                message={`Are you sure you want to unlink "${unlinkModal.stream?.name}" from all ${unlinkModal.stream?.grades_count} grade(s)? The grades will no longer be associated with this stream.`}
            />
        </AuthenticatedLayout>
    );
}

