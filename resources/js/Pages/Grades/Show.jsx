import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Users, BookOpen, Tag, GraduationCap } from 'lucide-react';

export default function GradesShow({ grade, availableTeachers, auth }) {
    const { school } = usePage().props;
    const isMadrasah = school?.school_type === 'madrasah';

    const getLevelBadgeColor = (level) => {
        const colors = {
            'ECD': 'bg-purple-100 text-purple-800',
            'LOWER PRIMARY': 'bg-blue-100 text-blue-800',
            'UPPER PRIMARY': 'bg-green-100 text-green-800',
            'JUNIOR SECONDARY': 'bg-orange-100 text-orange-800',
        };
        return colors[level] || 'bg-gray-100 text-gray-800';
    };

    const academicSubjects = grade.subjects?.filter(s => s.category === 'academic') || [];
    const islamicSubjects = grade.subjects?.filter(s => s.category === 'islamic') || [];

    return (
        <AuthenticatedLayout header={`Grade: ${grade.name}`}>
            <Head title={grade.name} />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <Link
                        href="/grades"
                        className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Link>
                    {auth.user.role === 'admin' && (
                        <Link
                            href={`/grades/${grade.id}/edit`}
                            className="inline-flex items-center px-4 py-2 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Grade
                        </Link>
                    )}
                </div>

                {/* Grade Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                            <BookOpen className="w-6 h-6 text-orange mr-3" />
                            <h2 className="text-lg font-semibold text-gray-900">Grade Details</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Grade Name</p>
                                <p className="text-base text-gray-900 font-semibold">{grade.name}</p>
                            </div>

                            {grade.code && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Grade Code</p>
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                                        <Tag className="w-4 h-4 mr-1" />
                                        {grade.code}
                                    </span>
                                </div>
                            )}

                            {!isMadrasah && grade.level && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Level</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeColor(grade.level)}`}>
                                    {grade.level}
                                </span>
                            </div>
                            )}

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    grade.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {grade.status}
                                </span>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Students</p>
                                <div className="flex items-center">
                                    <Users className="w-5 h-5 text-blue-600 mr-2" />
                                    <p className="text-base text-gray-900 font-semibold">{grade.students?.length || 0}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Subjects</p>
                                <div className="flex items-center">
                                    <BookOpen className="w-5 h-5 text-green-600 mr-2" />
                                    <p className="text-base text-gray-900 font-semibold">{grade.subjects?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assigned Subjects Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <BookOpen className="w-6 h-6 text-orange mr-3" />
                                <h2 className="text-lg font-semibold text-gray-900">Assigned Subjects</h2>
                            </div>
                            <span className="text-sm text-gray-600">
                                {grade.subjects?.length || 0} subject(s)
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        {grade.subjects && grade.subjects.length > 0 ? (
                            <div className="space-y-6">
                                {/* Academic Subjects */}
                                {academicSubjects.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                            Academic Subjects ({academicSubjects.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {academicSubjects.map((subject) => (
                                                <div
                                                    key={subject.id}
                                                    className="flex items-center p-3 border border-blue-200 bg-blue-50 rounded-lg"
                                                >
                                                    <BookOpen className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Islamic Subjects */}
                                {islamicSubjects.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                            Islamic Subjects ({islamicSubjects.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {islamicSubjects.map((subject) => (
                                                <div
                                                    key={subject.id}
                                                    className="flex items-center p-3 border border-green-200 bg-green-50 rounded-lg"
                                                >
                                                    <BookOpen className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-600 mb-2">No subjects assigned to this grade yet.</p>
                                {auth.user.role === 'admin' && (
                                    <Link
                                        href={`/grades/${grade.id}/edit`}
                                        className="inline-flex items-center text-orange hover:text-orange-dark font-medium"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Assign Subjects
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assigned Teachers Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                            <GraduationCap className="w-6 h-6 text-orange mr-3" />
                            <h2 className="text-lg font-semibold text-gray-900">Assigned Teachers</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        {grade.teachers && grade.teachers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {grade.teachers.map((teacher) => (
                                    <div
                                        key={teacher.id}
                                        className="p-4 border border-gray-200 rounded-lg hover:border-orange transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{teacher.user?.name}</h3>
                                                <p className="text-sm text-gray-600">{teacher.user?.email}</p>
                                            </div>
                                            {teacher.pivot?.is_class_teacher && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange text-white">
                                                    Class Teacher
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No teachers assigned to this grade yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Students Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Users className="w-6 h-6 text-orange mr-3" />
                                <h2 className="text-lg font-semibold text-gray-900">Students</h2>
                            </div>
                            <span className="text-sm text-gray-600">
                                {grade.students?.length || 0} student(s)
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        {grade.students && grade.students.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {grade.students.map((student) => (
                                    <Link
                                        key={student.id}
                                        href={`/students/${student.id}`}
                                        className="p-4 border border-gray-200 rounded-lg hover:border-orange hover:bg-orange-50 transition-all"
                                    >
                                        <h3 className="font-semibold text-gray-900">
                                            {student.first_name} {student.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-600">{student.admission_number}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No students enrolled in this grade yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}