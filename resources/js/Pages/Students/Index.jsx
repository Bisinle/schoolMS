import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Users, Eye, Edit, Trash2, FileText, ChevronDown, ChevronUp, Mail, Phone, User, Calendar, GraduationCap } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import GenerateReportModal from '@/Components/Students/GenerateReportModal';
import StudentsFilters from '@/Components/Students/StudentsFilters';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component
function MobileStudentItem({ student, auth, onDelete, onGenerateReport }) {
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
                        href={`/students/${student.id}`}
                        onClick={() => setSwipeAction(null)}
                    />
                    {auth.user.role === 'admin' && (
                        <>
                            <SwipeActionButton
                                icon={<Edit className="w-5 h-5 text-white" />}
                                href={`/students/${student.id}/edit`}
                                onClick={() => setSwipeAction(null)}
                            />
                            <SwipeActionButton
                                icon={<Trash2 className="w-5 h-5 text-white" />}
                                onClick={() => {
                                    onDelete(student);
                                    setSwipeAction(null);
                                }}
                            />
                        </>
                    )}
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-start px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<FileText className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onGenerateReport(student);
                            setSwipeAction(null);
                        }}
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
                {/* Summary Row - Compact Design */}
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
                            {/* Admission Number Badge at Top */}
                            <div className="mb-2">
                                <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-navy text-white">
                                    {student.admission_number}
                                </span>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-gray-900 truncate">
                                    {student.first_name} {student.last_name}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                                    student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {student.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-orange-100 text-orange-700">
                                    {student.grade?.name || 'No Grade'}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs text-gray-500 capitalize">{student.gender}</span>
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

                {/* Expanded Details - Compact Design */}
                {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 bg-gray-50">
                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{new Date(student.date_of_birth).toLocaleDateString()}</span>
                            </div>

                            {student.guardian && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-600 truncate">{student.guardian.user?.name}</span>
                                    </div>

                                    {student.guardian.phone_number && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-xs text-gray-600">{student.guardian.phone_number}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href={`/students/${student.id}`}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                View
                            </Link>
                            {auth.user.role === 'admin' && (
                                <Link
                                    href={`/students/${student.id}/edit`}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit
                                </Link>
                            )}
                            <button
                                onClick={() => onGenerateReport(student)}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors ${auth.user.role === 'admin' ? '' : 'col-span-2'}`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Report
                            </button>

                            {auth.user.role === 'admin' && (
                                <button
                                    onClick={() => onDelete(student)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function StudentsIndex({ students, grades, filters = {}, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [gradeId, setGradeId] = useState(filters.grade_id || '');
    const [gender, setGender] = useState(filters.gender || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/students', {
            search,
            grade_id: gradeId,
            gender,
            status,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (filterType, value) => {
        const params = {
            search,
            grade_id: gradeId,
            gender,
            status,
        };

        if (filterType === 'grade') {
            params.grade_id = value;
            setGradeId(value);
        } else if (filterType === 'gender') {
            params.gender = value;
            setGender(value);
        } else if (filterType === 'status') {
            params.status = value;
            setStatus(value);
        }

        router.get('/students', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const confirmDelete = (student) => {
        setSelectedStudent(student);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedStudent) {
            router.delete(`/students/${selectedStudent.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedStudent(null);
                },
            });
        }
    };

    const handleGenerateReport = (student) => {
        setSelectedStudentForReport(student);
        setShowReportModal(true);
    };

    return (
        <AuthenticatedLayout header="Students">
            <Head title="Students" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                            <p className="text-sm text-gray-600">Manage student records and information</p>
                        </div>
                    </div>

                    {auth.user.role === 'admin' && (
                        <Link
                            href="/students/create"
                            className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Student
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <StudentsFilters
                    search={search}
                    setSearch={setSearch}
                    gradeId={gradeId}
                    gender={gender}
                    status={status}
                    grades={grades}
                    onFilterChange={handleFilterChange}
                    onSubmit={handleSearch}
                />

                {/* Mobile List View */}
                <div className="block md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {students.data && students.data.length > 0 ? (
                        students.data.map((student) => (
                            <MobileStudentItem
                                key={student.id}
                                student={student}
                                auth={auth}
                                onDelete={confirmDelete}
                                onGenerateReport={handleGenerateReport}
                            />
                        ))
                    ) : (
                        <div className="px-6 py-16 text-center">
                            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold text-lg">No students found</p>
                            <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table View - UNCHANGED */}
                <div className="hidden md:block">
                    {/* Your existing StudentsTable component or table markup */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                {/* Keep your existing desktop table exactly as it is */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admission No</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gender</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.data && students.data.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                                {student.admission_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.grade?.name || 'No Grade'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                                {student.gender}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <Link
                                                    href={`/students/${student.id}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {auth.user.role === 'admin' && (
                                                    <>
                                                        <Link
                                                            href={`/students/${student.id}/edit`}
                                                            className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => confirmDelete(student)}
                                                            className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Student"
                message={`Are you sure you want to delete ${selectedStudent?.first_name} ${selectedStudent?.last_name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />

            <GenerateReportModal
                student={selectedStudentForReport}
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
            />
        </AuthenticatedLayout>
    );
}