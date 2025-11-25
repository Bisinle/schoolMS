import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, BookOpen, Users } from 'lucide-react';

export default function SubjectsShow({ subject, auth }) {
    return (
        <AuthenticatedLayout header={`Subject: ${subject.name}`}>
            <Head title={subject.name} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <Link
                        href={route('subjects.index')}
                        className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Link>
                    {auth.user.role === 'admin' && (
                        <Link
                            href={`/subjects/${subject.id}/edit`}
                            className="inline-flex items-center px-4 py-2 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Subject
                        </Link>
                    )}
                </div>

                {/* Subject Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                            <BookOpen className="w-6 h-6 text-orange mr-3" />
                            <h2 className="text-lg font-semibold text-gray-900">Subject Details</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Subject Name</p>
                                <p className="text-base text-gray-900">{subject.name}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Subject Code</p>
                                <p className="text-base text-gray-900">{subject.code || 'N/A'}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    subject.category === 'academic'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {subject.category === 'academic' ? 'Academic' : 'Islamic'}
                                </span>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    subject.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {subject.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assigned Grades Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                            <Users className="w-6 h-6 text-orange mr-3" />
                            <h2 className="text-lg font-semibold text-gray-900">Assigned Grades</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        {subject.grades && subject.grades.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subject.grades.map((grade) => (
                                    <div
                                        key={grade.id}
                                        className="p-4 border border-gray-200 rounded-lg hover:border-orange transition-colors"
                                    >
                                        <h3 className="font-semibold text-gray-900 mb-1">{grade.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            {grade.students_count} student{grade.students_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No grades assigned to this subject yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
