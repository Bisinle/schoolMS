import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, BookOpen, ChevronDown, ChevronUp, Mail, Phone, User, GraduationCap } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component
function MobileTeacherItem({ teacher, auth, onDelete }) {
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

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Eye className="w-5 h-5 text-white" />}
                        href={`/teachers/${teacher.id}`}
                        onClick={() => setSwipeAction(null)}
                    />
                    <SwipeActionButton
                        icon={<Edit className="w-5 h-5 text-white" />}
                        href={`/teachers/${teacher.id}/edit`}
                        onClick={() => setSwipeAction(null)}
                    />
                    <SwipeActionButton
                        icon={<Trash2 className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onDelete(teacher);
                            setSwipeAction(null);
                        }}
                    />
                </div>
            )}
            {swipeAction === 'secondary' && teacher.user?.phone && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-start px-6 gap-3 z-10">
                    <SwipeActionButton
                        icon={<Phone className="w-6 h-6 text-white" />}
                        href={`tel:${teacher.user.phone}`}
                        onClick={() => setSwipeAction(null)}
                        size="large"
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-44' :
                    swipeAction === 'secondary' ? 'translate-x-24' : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row - Enhanced Design */}
                <div
                    className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => {
                        if (!swipeAction) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-gray-900 truncate">
                                    {teacher.user?.name}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                                    teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {teacher.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <p className="text-xs text-gray-600 truncate mb-2">{teacher.employee_number}</p>

                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 text-blue-700">
                                    {teacher.subject_specialization || 'No Subject'}
                                </span>
                                {teacher.grades && teacher.grades.length > 0 && (
                                    <>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                            {teacher.grades.length} class{teacher.grades.length !== 1 ? 'es' : ''}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Additional Info in Summary */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                                {teacher.user?.email && (
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{teacher.user.email}</span>
                                    </div>
                                )}
                                {teacher.user?.phone && (
                                    <>
                                        {teacher.user?.email && <span className="text-gray-400">•</span>}
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            <span>{teacher.user.phone}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Expanded Details - Enhanced Design */}
                {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 bg-gray-50">
                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                            {teacher.gender && (
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-600 capitalize">{teacher.gender}</span>
                                </div>
                            )}

                            {teacher.date_of_birth && (
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-600">
                                        DOB: {new Date(teacher.date_of_birth).toLocaleDateString()}
                                    </span>
                                </div>
                            )}

                            {teacher.qualification && (
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-600">{teacher.qualification}</span>
                                </div>
                            )}

                            {teacher.hire_date && (
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-600">
                                        Hired: {new Date(teacher.hire_date).toLocaleDateString()}
                                    </span>
                                </div>
                            )}

                            {teacher.grades && teacher.grades.length > 0 && (
                                <div className="flex items-start gap-2 border-t border-gray-100 mt-2 pt-2">
                                    <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Assigned Classes:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {teacher.grades.map((grade) => (
                                                <span
                                                    key={grade.id}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        grade.pivot.is_class_teacher
                                                            ? 'bg-orange-600 text-white'
                                                            : 'bg-orange-100 text-orange-700'
                                                    }`}
                                                >
                                                    {grade.name}
                                                    {grade.pivot.is_class_teacher && ' ★'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href={`/teachers/${teacher.id}`}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                View
                            </Link>
                            <Link
                                href={`/teachers/${teacher.id}/edit`}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                            </Link>

                            {teacher.user?.email && (
                                <a
                                    href={`mailto:${teacher.user.email}`}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    Email
                                </a>
                            )}

                            <button
                                onClick={() => onDelete(teacher)}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors ${teacher.user?.email ? '' : 'col-span-2'}`}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TeachersIndex({ teachers, filters, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/teachers', { search }, { preserveState: true });
    };

    const confirmDelete = (teacher) => {
        setSelectedTeacher(teacher);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedTeacher) {
            router.delete(`/teachers/${selectedTeacher.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedTeacher(null);
                },
            });
        }
    };

    return (
        <AuthenticatedLayout header="Teachers Management">
            <Head title="Teachers" />

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
                                placeholder="Search teachers..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            />
                        </div>
                    </form>

                    <Link
                        href="/teachers/create"
                        className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Teacher
                    </Link>
                </div>

                {/* Mobile List View */}
                <div className="block md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {teachers.data && teachers.data.length > 0 ? (
                        teachers.data.map((teacher) => (
                            <MobileTeacherItem
                                key={teacher.id}
                                teacher={teacher}
                                auth={auth}
                                onDelete={confirmDelete}
                            />
                        ))
                    ) : (
                        <div className="px-6 py-16 text-center">
                            <GraduationCap className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold text-lg">No teachers found</p>
                            <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table View - UNCHANGED */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Employee No.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Assigned Grades
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
                                {teachers.data.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                            {teacher.employee_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {teacher.user?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {teacher.user?.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {teacher.subject_specialization || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {teacher.grades && teacher.grades.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {teacher.grades.map((grade) => (
                                                        <span
                                                            key={grade.id}
                                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                grade.pivot.is_class_teacher
                                                                    ? 'bg-orange text-white'
                                                                    : 'bg-orange bg-opacity-10 text-orange'
                                                            }`}
                                                        >
                                                            <BookOpen className="w-3 h-3 mr-1" />
                                                            {grade.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                teacher.status === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {teacher.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Link
                                                href={`/teachers/${teacher.id}`}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/teachers/${teacher.id}/edit`}
                                                className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => confirmDelete(teacher)}
                                                className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{teachers.from}</span> to{' '}
                                <span className="font-medium">{teachers.to}</span> of{' '}
                                <span className="font-medium">{teachers.total}</span> results
                            </div>
                            <div className="flex gap-2">
                                {teachers.links.map((link, index) => (
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
                </div>
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Teacher"
                message={`Are you sure you want to delete ${selectedTeacher?.user?.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}