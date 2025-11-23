import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Users, BookOpen, Tag, Search } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function GradesIndex({ grades, filters = {}, auth }) {
    const { school } = usePage().props;
    const isMadrasah = school?.school_type === 'madrasah';

    const [search, setSearch] = useState(filters.search || '');
    const [level, setLevel] = useState(filters.level || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/grades', { search, level }, { preserveState: true });
    };

    const handleLevelChange = (e) => {
        const newLevel = e.target.value;
        setLevel(newLevel);
        router.get('/grades', { search, level: newLevel }, { preserveState: true });
    };

    const confirmDelete = (grade) => {
        setSelectedGrade(grade);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedGrade) {
            router.delete(route('grades.destroy', selectedGrade.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedGrade(null);
                },
                onError: (errors) => {
                    // Keep modal open to show error
                    console.error('Delete error:', errors);
                },
            });
        }
    };

    const getLevelBadgeColor = (level) => {
        const colors = {
            'ECD': 'bg-purple-100 text-purple-800',
            'LOWER PRIMARY': 'bg-blue-100 text-blue-800',
            'UPPER PRIMARY': 'bg-green-100 text-green-800',
            'JUNIOR SECONDARY': 'bg-orange-100 text-orange-800',
        };
        return colors[level] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout header="Grades Management">
            <Head title="Grades" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <BookOpen className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Grades</h2>
                            <p className="text-sm text-gray-600">
                                Manage grades and class levels
                            </p>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1 lg:flex-initial">
                            <div className="relative flex-1 lg:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search grades..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                            </div>
                            {!isMadrasah && (
                            <select
                                value={level}
                                onChange={handleLevelChange}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            >
                                <option value="">All Levels</option>
                                <option value="ECD">ECD</option>
                                <option value="LOWER PRIMARY">Lower Primary</option>
                                <option value="UPPER PRIMARY">Upper Primary</option>
                                <option value="JUNIOR SECONDARY">Junior Secondary</option>
                            </select>
                            )}
                        </form>

                        {auth.user.role === 'admin' && (
                            <Link
                                href="/grades/create"
                                className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Grade
                            </Link>
                        )}
                    </div>
                </div>

                {/* Grades Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grades.length > 0 ? (
                        grades.map((grade) => (
                            <div
                                key={grade.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
                            >
                                {/* Card Header */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                {grade.name}
                                            </h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {grade.code && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                                        <Tag className="w-3 h-3 mr-1" />
                                                        {grade.code}
                                                    </span>
                                                )}
                                                {!isMadrasah && grade.level && (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelBadgeColor(grade.level)}`}>
                                                    {grade.level}
                                                </span>
                                                )}
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                grade.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {grade.status}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center text-blue-600">
                                            <Users className="w-4 h-4 mr-1" />
                                            <span className="font-medium">
                                                {grade.students_count} student{grade.students_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-green-600">
                                            <BookOpen className="w-4 h-4 mr-1" />
                                            <span className="font-medium">
                                                {grade.subjects_count} subject{grade.subjects_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/grades/${grade.id}`}
                                            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Link>
                                        {auth.user.role === 'admin' && (
                                            <>
                                                <Link
                                                    href={`/grades/${grade.id}/edit`}
                                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-orange bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => confirmDelete(grade)}
                                                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No grades found</h3>
                                <p className="text-gray-600 mb-6">
                                    {search || level ? 'Try adjusting your filters' : 'Get started by creating your first grade'}
                                </p>
                                {auth.user.role === 'admin' && !search && !level && (
                                    <Link
                                        href="/grades/create"
                                        className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add First Grade
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Grade"
                message={`Are you sure you want to delete ${selectedGrade?.name}? This action cannot be undone. Make sure to transfer all students to another grade first.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}