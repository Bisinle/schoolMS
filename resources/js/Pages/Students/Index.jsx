import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Users, Eye, Edit, Trash2, FileText, ChevronDown, ChevronUp, Mail, Phone, User, Calendar, GraduationCap } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import GenerateReportModal from '@/Components/Students/GenerateReportModal';
import StudentsFilters from '@/Components/Students/StudentsFilters';
import { useSwipeable } from 'react-swipeable';

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
                    <Link
                        href={`/students/${student.id}`}
                        className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                        onClick={() => setSwipeAction(null)}
                    >
                        <Eye className="w-5 h-5 text-white" />
                    </Link>
                    {auth.user.role === 'admin' && (
                        <>
                            <Link
                                href={`/students/${student.id}/edit`}
                                className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                                onClick={() => setSwipeAction(null)}
                            >
                                <Edit className="w-5 h-5 text-white" />
                            </Link>
                            <button
                                onClick={() => {
                                    onDelete(student);
                                    setSwipeAction(null);
                                }}
                                className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                            >
                                <Trash2 className="w-5 h-5 text-white" />
                            </button>
                        </>
                    )}
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-start px-4 gap-2 z-10">
                    <button
                        onClick={() => {
                            onGenerateReport(student);
                            setSwipeAction(null);
                        }}
                        className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                    >
                        <FileText className="w-5 h-5 text-white" />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-36' :
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
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl">
                                {student.first_name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {student.first_name} {student.last_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="text-sm text-gray-600">{student.grade?.name || 'No Grade'}</span>
                                    <span>•</span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                        student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {student.status === 'active' ? '● Active' : '● Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button className="flex-shrink-0 p-2 -mr-2 active:bg-gray-100 rounded-lg transition-colors">
                            {isExpanded ? (
                                <ChevronUp className="w-6 h-6 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-6 h-6 text-gray-500" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4 bg-gray-50">
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Admission No</p>
                                    <p className="text-sm font-bold text-gray-900">{student.admission_number}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100"></div>
                            
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Gender</p>
                                    <p className="text-sm font-bold text-gray-900 capitalize">{student.gender}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100"></div>
                            
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date of Birth</p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(student.date_of_birth).toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            {student.guardian && (
                                <>
                                    <div className="border-t border-gray-100"></div>
                                    
                                    <div className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Guardian</p>
                                            <p className="text-sm font-bold text-gray-900">{student.guardian.user?.name}</p>
                                        </div>
                                    </div>
                                    
                                    {student.guardian.phone_number && (
                                        <>
                                            <div className="border-t border-gray-100"></div>
                                            <div className="flex items-start gap-3">
                                                <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Guardian Phone</p>
                                                    <p className="text-sm font-bold text-gray-900">{student.guardian.phone_number}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href={`/students/${student.id}`}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Eye className="w-5 h-5" />
                                    View
                                </Link>
                                {auth.user.role === 'admin' && (
                                    <Link
                                        href={`/students/${student.id}/edit`}
                                        className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                    >
                                        <Edit className="w-5 h-5" />
                                        Edit
                                    </Link>
                                )}
                            </div>
                            
                            <button
                                onClick={() => onGenerateReport(student)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                            >
                                <FileText className="w-5 h-5" />
                                Generate Report
                            </button>
                            
                            {auth.user.role === 'admin' && (
                                <button
                                    onClick={() => onDelete(student)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Delete Student
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
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admission No</th>
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
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.admission_number}
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