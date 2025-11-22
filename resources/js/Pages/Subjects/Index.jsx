import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, BookOpen, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component
function MobileSubjectItem({ subject, auth, onDelete }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [swipeAction, setSwipeAction] = useState(null);

    const handlers = useSwipeable({
        onSwipedLeft: () => setSwipeAction('primary'),
        onSwipedRight: () => setSwipeAction('secondary'),
        onSwiping: () => {},
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: 60,
    });

    const getCategoryColor = (category) => {
        const colors = {
            'core': 'from-blue-500 to-blue-600',
            'elective': 'from-green-500 to-green-600',
            'co-curricular': 'from-purple-500 to-purple-600',
        };
        return colors[category] || 'from-gray-500 to-gray-600';
    };

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Eye className="w-5 h-5 text-white" />}
                        href={`/subjects/${subject.id}`}
                        onClick={() => setSwipeAction(null)}
                    />
                    <SwipeActionButton
                        icon={<Edit className="w-5 h-5 text-white" />}
                        href={`/subjects/${subject.id}/edit`}
                        onClick={() => setSwipeAction(null)}
                    />
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-start px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Trash2 className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onDelete(subject);
                            setSwipeAction(null);
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-32' :
                    swipeAction === 'secondary' ? 'translate-x-20' : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row */}
                <div
                    className="p-5 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => {
                        if (!swipeAction) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${getCategoryColor(subject.category)} rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl`}>
                                {subject.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {subject.name}
                                </h3>
                                <p className="text-sm text-gray-600 capitalize mt-1">{subject.category}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                                        {subject.code}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="flex-shrink-0 p-1">
                            {isExpanded ? (
                                <ChevronUp className="w-6 h-6 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-6 h-6 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                        {/* Info Grid */}
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Category</span>
                                    <span className="font-semibold text-gray-900 capitalize">{subject.category}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Subject Code</span>
                                    <span className="font-semibold text-gray-900">{subject.code}</span>
                                </div>
                            </div>
                            {subject.description && (
                                <div className="flex items-start gap-3">
                                    <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <span className="text-xs text-gray-500 block">Description</span>
                                        <span className="font-medium text-gray-900">{subject.description}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                            <Link
                                href={`/subjects/${subject.id}`}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors active:scale-95"
                            >
                                <Eye className="w-4 h-4" />
                                View
                            </Link>
                            <Link
                                href={`/subjects/${subject.id}/edit`}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors active:scale-95"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </Link>
                            <button
                                onClick={() => onDelete(subject)}
                                className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Subject
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SubjectsIndex({ subjects, filters, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/subjects', { search, category }, { preserveState: true });
    };

    // 🆕 NEW: Handle category change immediately
    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        setCategory(newCategory);
        // Trigger search immediately when category changes
        router.get('/subjects', { search, category: newCategory }, { preserveState: true });
    };

    const confirmDelete = (subject) => {
        setSelectedSubject(subject);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedSubject) {
            router.delete(`/subjects/${selectedSubject.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedSubject(null);
                },
            });
        }
    };

    return (
        <AuthenticatedLayout header="Subjects Management">
            <Head title="Subjects" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <form onSubmit={handleSearch} className="flex-1 w-full sm:max-w-md flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search subjects..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            />
                        </div>
                        <select
                            value={category}
                            onChange={handleCategoryChange}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                        >
                            <option value="">All Categories</option>
                            <option value="academic">Academic</option>
                            <option value="islamic">Islamic</option>
                        </select>
                    </form>

                    {auth.user.role === 'admin' && (
                        <Link
                            href="/subjects/create"
                            className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Subject
                        </Link>
                    )}
                </div>

                {/* Mobile List View */}
                <div className="block md:hidden bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {subjects.data.length > 0 ? (
                        subjects.data.map((subject) => (
                            <MobileSubjectItem
                                key={subject.id}
                                subject={subject}
                                auth={auth}
                                onDelete={confirmDelete}
                            />
                        ))
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No subjects found</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Subject Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Grades
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {subjects.data.length > 0 ? (
                                    subjects.data.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <BookOpen className="w-5 h-5 text-orange mr-2" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {subject.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {subject.code || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    subject.category === 'academic'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {subject.category === 'academic' ? 'Academic' : 'Islamic'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {subject.grades_count} grade(s)
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    subject.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {subject.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                <Link
                                                    href={`/subjects/${subject.id}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {auth.user.role === 'admin' && (
                                                    <>
                                                        <Link
                                                            href={`/subjects/${subject.id}/edit`}
                                                            className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                            title="Edit Subject"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => confirmDelete(subject)}
                                                            className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                                            title="Delete Subject"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-lg font-medium">No subjects found</p>
                                            <p className="text-sm mt-1">
                                                {search || category ? 'Try adjusting your filters' : 'Get started by adding a new subject'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {subjects.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{subjects.from}</span> to{' '}
                                    <span className="font-medium">{subjects.to}</span> of{' '}
                                    <span className="font-medium">{subjects.total}</span> results
                                </div>
                                <div className="flex gap-2">
                                    {subjects.links.map((link, index) => (
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
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Subject"
                message={`Are you sure you want to delete ${selectedSubject?.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}