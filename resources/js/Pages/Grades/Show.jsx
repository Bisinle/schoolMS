import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Users, BookOpen, User, GraduationCap, Search, Plus, X, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function GradesShow({ grade, studentCount, availableSpots, availableTeachers, auth }) {
    const [teacherSearch, setTeacherSearch] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        teacher_id: '',
        is_class_teacher: false,
    });

    // Filter available teachers based on search
    const filteredTeachers = useMemo(() => {
        if (!teacherSearch) return availableTeachers;
        return availableTeachers.filter(teacher =>
            teacher.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            teacher.employee_number.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            (teacher.subject_specialization && teacher.subject_specialization.toLowerCase().includes(teacherSearch.toLowerCase()))
        );
    }, [availableTeachers, teacherSearch]);

    // Get teachers not yet assigned to this grade
    const unassignedTeachers = useMemo(() => {
        const assignedIds = grade.teachers.map(t => t.id);
        return filteredTeachers.filter(t => !assignedIds.includes(t.id));
    }, [filteredTeachers, grade.teachers]);

    const handleAssignTeacher = (e) => {
        e.preventDefault();
        post(`/grades/${grade.id}/assign-teacher`, {
            onSuccess: () => {
                setShowAssignModal(false);
                reset();
                setTeacherSearch('');
            },
        });
    };

    const confirmRemoveTeacher = (teacher) => {
        setSelectedTeacher(teacher);
        setShowRemoveModal(true);
    };

    const handleRemoveTeacher = () => {
        if (selectedTeacher) {
            router.delete(`/grades/${grade.id}/remove-teacher/${selectedTeacher.id}`, {
                onSuccess: () => {
                    setShowRemoveModal(false);
                    setSelectedTeacher(null);
                },
            });
        }
    };

    const handleToggleClassTeacher = (teacher) => {
        router.patch(`/grades/${grade.id}/update-teacher/${teacher.id}`, {
            is_class_teacher: !teacher.pivot.is_class_teacher,
        });
    };

    return (
        <AuthenticatedLayout header="Grade Details">
            <Head title={`Grade - ${grade.name}`} />

            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href="/grades"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Grades
                </Link>

                {/* Main Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange to-orange-dark px-6 py-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                                <BookOpen className="w-10 h-10 text-orange" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{grade.name}</h2>
                                <p className="text-orange-100 mt-1">{grade.level}</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                                    grade.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {grade.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 border-b border-gray-200">
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-navy">{studentCount}</p>
                            <p className="text-sm text-gray-600">Total Students</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <BookOpen className="w-8 h-8 text-orange mx-auto mb-2" />
                            <p className="text-3xl font-bold text-navy">{grade.capacity}</p>
                            <p className="text-sm text-gray-600">Capacity</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <User className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-navy">{availableSpots}</p>
                            <p className="text-sm text-gray-600">Available Spots</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Description */}
                        {grade.description && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-navy mb-2">Description</h3>
                                <p className="text-gray-700">{grade.description}</p>
                            </div>
                        )}

                        {/* Capacity Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-navy">Capacity</h3>
                                <span className="text-sm text-gray-600">
                                    {studentCount} / {grade.capacity} ({Math.round((studentCount / grade.capacity) * 100)}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div 
                                    className={`h-4 rounded-full transition-all ${
                                        (studentCount / grade.capacity) > 0.9 ? 'bg-red-500' :
                                        (studentCount / grade.capacity) > 0.7 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    }`}
                                    style={{ width: `${(studentCount / grade.capacity) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Teachers Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <GraduationCap className="w-5 h-5 mr-2 text-orange" />
                                    Assigned Teachers
                                </h3>
                                {auth.user.role === 'admin' && (
                                    <button
                                        onClick={() => setShowAssignModal(true)}
                                        className="inline-flex items-center px-3 py-1.5 text-sm bg-orange text-white rounded-lg hover:bg-orange-dark transition-all"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Assign Teacher
                                    </button>
                                )}
                            </div>

                            {grade.teachers && grade.teachers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {grade.teachers.map((teacher) => (
                                        <div key={teacher.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-navy">{teacher.user.name}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{teacher.subject_specialization || 'No specialization'}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{teacher.user.email}</p>
                                                </div>
                                                {auth.user.role === 'admin' && (
                                                    <button
                                                        onClick={() => confirmRemoveTeacher(teacher)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                                {auth.user.role === 'admin' ? (
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={teacher.pivot.is_class_teacher}
                                                            onChange={() => handleToggleClassTeacher(teacher)}
                                                            className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">Class Teacher</span>
                                                    </label>
                                                ) : (
                                                    teacher.pivot.is_class_teacher && (
                                                        <span className="px-2 py-1 bg-orange bg-opacity-10 text-orange text-xs font-medium rounded-full">
                                                            Class Teacher
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No teachers assigned yet.</p>
                            )}
                        </div>

                        {/* Students Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-navy mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-orange" />
                                Students in {grade.name}
                            </h3>
                            {grade.students && grade.students.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Admission No.
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Gender
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Guardian
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {grade.students.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                                        {student.admission_number}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {student.first_name} {student.last_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                                        {student.gender}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {student.guardian?.user?.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            student.status === 'active' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <Link
                                                            href={`/students/${student.id}`}
                                                            className="text-orange hover:text-orange-dark font-medium"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No students enrolled yet.</p>
                            )}
                        </div>
                    </div>

                    {auth.user.role === 'admin' && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <Link
                                href={`/grades/${grade.id}/edit`}
                                className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all"
                            >
                                Edit Grade
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Teacher Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-navy">Assign Teacher to {grade.name}</h3>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    reset();
                                    setTeacherSearch('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignTeacher} className="p-6">
                            {/* Teacher Search */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Teacher
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={teacherSearch}
                                        onChange={(e) => setTeacherSearch(e.target.value)}
                                        placeholder="Search by name, employee number, or subject..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Teacher Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Teacher <span className="text-red-500">*</span>
                                </label>
                                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                                    {unassignedTeachers.length > 0 ? (
                                        <div className="divide-y divide-gray-200">
                                            {unassignedTeachers.map((teacher) => (
                                                <label
                                                    key={teacher.id}
                                                    className={`flex items-start p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                        data.teacher_id === teacher.id ? 'bg-orange bg-opacity-10' : ''
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="teacher_id"
                                                        value={teacher.id}
                                                        checked={data.teacher_id === teacher.id}
                                                        onChange={(e) => setData('teacher_id', parseInt(e.target.value))}
                                                        className="mt-1 w-4 h-4 text-orange border-gray-300 focus:ring-orange"
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <p className="font-medium text-navy">{teacher.name}</p>
                                                        <p className="text-sm text-gray-600">{teacher.employee_number}</p>
                                                        {teacher.subject_specialization && (
                                                            <p className="text-xs text-gray-500 mt-1">{teacher.subject_specialization}</p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center py-8 text-gray-500">
                                            {teacherSearch ? 'No teachers found matching your search.' : 'All teachers are already assigned to this grade.'}
                                        </p>
                                    )}
                                </div>
                                {errors.teacher_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.teacher_id}</p>
                                )}
                            </div>

                            {/* Class Teacher Checkbox */}
                            {data.teacher_id && (
                                <div className="mb-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.is_class_teacher}
                                            onChange={(e) => setData('is_class_teacher', e.target.checked)}
                                            className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            Set as Class Teacher for {grade.name}
                                        </span>
                                    </label>
                                    <p className="ml-6 mt-1 text-xs text-gray-500">
                                        Class teachers have primary responsibility for this grade
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        reset();
                                        setTeacherSearch('');
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.teacher_id}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-all disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {processing ? 'Assigning...' : 'Assign Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Remove Teacher Confirmation Modal */}
            <ConfirmationModal
                show={showRemoveModal}
                onClose={() => {
                    setShowRemoveModal(false);
                    setSelectedTeacher(null);
                }}
                onConfirm={handleRemoveTeacher}
                title="Remove Teacher"
                message={`Are you sure you want to remove ${selectedTeacher?.user?.name} from ${grade.name}? This will not delete the teacher, only remove them from this grade.`}
                confirmText="Remove"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}