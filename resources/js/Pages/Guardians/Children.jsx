import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { GraduationCap, Award, BookOpen, FileText, Download, Trophy, BarChart3, School } from 'lucide-react';

export default function Children({ students, currentYear, currentTerm }) {
    const getGradeColor = (grade) => {
        switch(grade) {
            case 'EE': return 'text-green-700 bg-green-100';
            case 'ME': return 'text-blue-700 bg-blue-100';
            case 'AE': return 'text-yellow-700 bg-yellow-100';
            case 'BE': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getMarkColor = (marks) => {
        if (marks >= 90) return 'text-green-700 font-semibold';
        if (marks >= 75) return 'text-blue-700 font-semibold';
        if (marks >= 50) return 'text-yellow-700 font-semibold';
        return 'text-red-700 font-semibold';
    };

    return (
        <AuthenticatedLayout header="Academic Performance">
            <Head title="My Children - Academic Performance" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-navy mb-2">Children's Academic Performance</h1>
                            <p className="text-gray-600">Academic Year {currentYear} • Term {currentTerm}</p>
                        </div>
                        <Link
                            href={route('dashboard')}
                            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>

                {/* Children Cards */}
                {students && students.length > 0 ? (
                    students.map((student) => (
                        <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Student Header */}
                            <div className="bg-gradient-to-r from-orange to-orange-dark p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                                            <School className="w-8 h-8 text-orange" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">{student.first_name} {student.last_name}</h2>
                                            <p className="text-sm opacity-90">{student.class_name} • {student.admission_number}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/reports/generate?student_id=${student.id}&term=${currentTerm}&academic_year=${currentYear}`}
                                        className="px-4 py-2 bg-white text-orange font-semibold rounded-lg hover:bg-gray-100 transition-all flex items-center"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Report
                                    </Link>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Performance Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Overall Performance */}
                                    {student.overall_average !== null && (
                                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <Trophy className="w-6 h-6 text-blue-600 mr-2" />
                                                    <span className="text-sm font-semibold text-gray-700">Overall Performance (Year)</span>
                                                </div>
                                                <Award className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-5xl font-bold text-blue-600 mb-1">{student.overall_average}%</p>
                                                    <p className="text-sm text-gray-600">Total: {student.total_exams_this_year} exams</p>
                                                </div>
                                                <span className={`px-4 py-2 rounded-lg text-lg font-bold ${getGradeColor(student.overall_grade)}`}>
                                                    {student.overall_grade}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Current Term */}
                                    {student.term_average !== null && (
                                        <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-semibold text-gray-700">Current Term (Term {currentTerm})</span>
                                                <BarChart3 className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-5xl font-bold text-purple-600 mb-1">{student.term_average}%</p>
                                                    <p className="text-sm text-gray-600">{student.total_exams_this_term} exams completed</p>
                                                </div>
                                                <span className={`px-4 py-2 rounded-lg text-lg font-bold ${getGradeColor(student.term_grade)}`}>
                                                    {student.term_grade}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Subject-wise Performance */}
                                {(student.academic_subjects?.length > 0 || student.islamic_subjects?.length > 0) && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-navy mb-4 flex items-center">
                                            <BookOpen className="w-5 h-5 mr-2 text-orange" />
                                            Subject Performance (Term {currentTerm})
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Academic Subjects */}
                                            {student.academic_subjects?.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-sm font-semibold text-blue-700">Academic Subjects</h4>
                                                        {student.academic_average && (
                                                            <span className="text-sm font-bold text-blue-700">
                                                                Average: {student.academic_average}% ({student.academic_grade})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {student.academic_subjects.map((subject) => (
                                                            <div key={subject.subject_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{subject.subject_name}</p>
                                                                    <p className="text-xs text-gray-600">{subject.exams_count} exam(s)</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-lg font-bold ${getMarkColor(subject.average)}`}>
                                                                        {subject.average}%
                                                                    </p>
                                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getGradeColor(subject.grade)}`}>
                                                                        {subject.grade}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Islamic Subjects */}
                                            {student.islamic_subjects?.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-sm font-semibold text-green-700">Islamic Studies</h4>
                                                        {student.islamic_average && (
                                                            <span className="text-sm font-bold text-green-700">
                                                                Average: {student.islamic_average}% ({student.islamic_grade})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {student.islamic_subjects.map((subject) => (
                                                            <div key={subject.subject_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{subject.subject_name}</p>
                                                                    <p className="text-xs text-gray-600">{subject.exams_count} exam(s)</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-lg font-bold ${getMarkColor(subject.average)}`}>
                                                                        {subject.average}%
                                                                    </p>
                                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getGradeColor(subject.grade)}`}>
                                                                        {subject.grade}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Exams */}
                                {student.recent_exams && student.recent_exams.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-navy mb-4 flex items-center">
                                            <FileText className="w-5 h-5 mr-2 text-orange" />
                                            Recent Exam Results
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {student.recent_exams.map((exam, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-navy">{exam.subject}</p>
                                                        <p className="text-xs text-gray-500 capitalize">
                                                            {exam.exam_type.replace('_', ' ')} • Term {exam.term}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-orange">{exam.marks}%</p>
                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getGradeColor(exam.grade)}`}>
                                                            {exam.grade}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No students found.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}