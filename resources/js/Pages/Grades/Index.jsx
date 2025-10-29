import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function GradesIndex({ grades, filters, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/grades', { search }, { preserveState: true });
    };

    const confirmDelete = (grade) => {
        setSelectedGrade(grade);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedGrade) {
            router.delete(`/grades/${selectedGrade.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedGrade(null);
                },
            });
        }
    
    console.log(grades);
    };

    return (
        <AuthenticatedLayout header="Grades Management">
            <Head title="Grades" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <form onSubmit={handleSearch} className="flex-1 w-full sm:max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search grades..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            />
                        </div>
                    </form>

                    {auth.user.role === 'admin' && (
                        <Link
                            href="/grades/create"
                            className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Grade
                        </Link>
                    )}
                </div>

                {/* Grades Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grades.data.map((grade) => (
                        <div
                            key={grade.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="bg-gradient-to-r from-orange to-orange-dark px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{grade.name}</h3>
                                            <p className="text-orange-100 text-sm">{grade.level}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        grade.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {grade.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-navy">{grade.students_count}</p>
                                        <p className="text-xs text-gray-600">Students</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-navy">{grade.capacity - grade.students_count}</p>
                                        <p className="text-xs text-gray-600">Available</p>
                                    </div>
                                </div>

                                {/* Teachers */}
                              {/* Teachers */}
<div>
    <p className="text-xs font-semibold text-gray-600 mb-2">Teachers:</p>
    {grade.teachers && grade.teachers.length > 0 ? (
        <div className="space-y-1">
            {grade.teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center text-sm">
                    <span className="text-gray-700">
                        {teacher.user ? teacher.user.name : 'Unknown Teacher'}
                    </span>
                    {teacher.pivot && teacher.pivot.is_class_teacher && (
                        <span className="ml-2 px-2 py-0.5 bg-orange bg-opacity-10 text-orange text-xs rounded-full">
                            Class Teacher
                        </span>
                    )}
                </div>
            ))}
        </div>
    ) : (
        <p className="text-sm text-gray-500 italic">No teachers assigned</p>
    )}
</div>

                                {/* Description */}
                                {grade.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">{grade.description}</p>
                                )}

                                {/* Progress Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>Capacity</span>
                                        <span>{grade.students_count} / {grade.capacity}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-orange rounded-full h-2 transition-all"
                                            style={{ width: `${(grade.students_count / grade.capacity) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                                    <Link
                                        href={`/grades/${grade.id}`}
                                        className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                    </Link>
                                    {auth.user.role === 'admin' && (
                                        <>
                                            <Link
                                                href={`/grades/${grade.id}/edit`}
                                                className="inline-flex items-center px-3 py-1.5 text-sm text-orange hover:bg-orange hover:bg-opacity-10 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => confirmDelete(grade)}
                                                className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {grades.last_page > 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{grades.from}</span> to{' '}
                                <span className="font-medium">{grades.to}</span> of{' '}
                                <span className="font-medium">{grades.total}</span> results
                            </div>
                            <div className="flex gap-2">
                                {grades.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                            link.active
                                                ? 'bg-orange text-white shadow-sm'
                                                : link.url
                                                ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Grade"
                message={`Are you sure you want to delete ${selectedGrade?.name}? This action cannot be undone. Note: You cannot delete grades with enrolled students.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}