import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Users, User, Award, TrendingUp, Hash } from 'lucide-react';
import { MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import Avatar from '@/Components/Avatar';

// Mobile Student Item Component - Moved outside to prevent re-creation on parent re-renders
const MobileStudentItem = React.memo(({ student, index, currentMark, rubric, isSaved, hasMark, onMarkChange }) => {
    return (
        <div className="p-4 bg-white border-b border-gray-200 last:border-b-0">
            <div className="flex items-start gap-3 mb-3">
                {/* Avatar */}
                <Avatar
                    name={`${student.first_name} ${student.last_name}`}
                    imagePath={student.profile_picture}
                    size="md"
                />

                <div className="flex-1 min-w-0">
                    {/* Top Row: Admission Number & Saved Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="primary" value={student.admission_number} size="sm" />
                        {isSaved && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Saved
                            </span>
                        )}
                    </div>

                    {/* Student Name */}
                    <h3 className="text-base font-bold text-gray-900 truncate mb-2">
                        {student.first_name} {student.last_name}
                    </h3>

                    {/* Current Mark & Rubric */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {hasMark ? (
                            <>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <TrendingUp className="w-3.5 h-3.5 text-orange" />
                                    <span className="font-bold text-orange">{currentMark}%</span>
                                </div>
                                {rubric && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rubric.color}`}>
                                            {rubric.text}
                                        </span>
                                    </>
                                )}
                            </>
                        ) : (
                            <span className="text-xs text-gray-400 italic">No marks entered</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Mark Input Section - Always Visible */}
            <div className="pt-3 border-t border-gray-100">
                <label htmlFor={`mark-input-${student.id}`} className="block text-xs font-semibold text-gray-700 mb-2">
                    Enter Marks (0-100)
                </label>
                <input
                    id={`mark-input-${student.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={currentMark}
                    onChange={(e) => onMarkChange(student.id, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange transition-all text-center text-2xl font-bold text-gray-900 placeholder-gray-400"
                    placeholder="0"
                />
            </div>
        </div>
    );
});

MobileStudentItem.displayName = 'MobileStudentItem';

export default function ExamResultsIndex({ exam, students }) {
    const [marks, setMarks] = useState(() => {
        const initialMarks = {};
        students.forEach(student => {
            initialMarks[student.id] = student.marks !== null ? student.marks : '';
        });
        return initialMarks;
    });

    const [saving, setSaving] = useState(false);
    const [savedStudents, setSavedStudents] = useState(new Set());

    const handleMarkChange = useCallback((studentId, value) => {
        // Allow empty string or valid numbers between 0-100
        if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
            setMarks(prev => ({
                ...prev,
                [studentId]: value
            }));
        }
    }, []);

    const handleSaveAll = (e) => {
        e.preventDefault();
        setSaving(true);

        // Prepare results data - only include students with marks
        const results = Object.entries(marks)
            .filter(([_, mark]) => mark !== '' && mark !== null)
            .map(([studentId, mark]) => ({
                student_id: parseInt(studentId),
                marks: parseFloat(mark)
            }));

        if (results.length === 0) {
            alert('Please enter at least one mark before saving.');
            setSaving(false);
            return;
        }

        router.post(`/exams/${exam.id}/results`, 
            { results },
            {
                onSuccess: () => {
                    setSaving(false);
                    const studentIds = results.map(r => r.student_id);
                    setSavedStudents(new Set(studentIds));
                    
                    // Clear the saved indicator after 3 seconds
                    setTimeout(() => {
                        setSavedStudents(new Set());
                    }, 3000);
                },
                onError: () => {
                    setSaving(false);
                }
            }
        );
    };

    const getRubric = (mark) => {
        if (mark === '' || mark === null) return null;
        const numMark = parseFloat(mark);
        if (numMark >= 90) return { text: 'Exceeding Expectation', color: 'bg-green-100 text-green-800' };
        if (numMark >= 75) return { text: 'Meeting Expectation', color: 'bg-blue-100 text-blue-800' };
        if (numMark >= 50) return { text: 'Approaching Expectation', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Below Expectation', color: 'bg-red-100 text-red-800' };
    };

    const getExamTypeBadge = (type) => {
        const badges = {
            opening: { class: 'bg-blue-100 text-blue-800', label: 'Opening' },
            midterm: { class: 'bg-yellow-100 text-yellow-800', label: 'Mid-Term' },
            end_term: { class: 'bg-green-100 text-green-800', label: 'End-Term' }
        };
        return badges[type] || { class: 'bg-gray-100 text-gray-800', label: type };
    };

    const badge = getExamTypeBadge(exam.exam_type);
    const filledCount = Object.values(marks).filter(m => m !== '' && m !== null).length;
    const completionPercentage = students.length > 0 ? Math.round((filledCount / students.length) * 100) : 0;

    return (
        <AuthenticatedLayout header={
            <span className="block truncate">
                <span className="hidden md:inline">Enter Marks: {exam.name}</span>
                <span className="md:hidden">Enter Marks</span>
            </span>
        }>
            <Head title={`Enter Marks - ${exam.name}`} />

            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 px-4 md:px-0">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <Link
                        href={`/exams/${exam.id}`}
                        className="inline-flex items-center px-3 py-2 md:px-4 md:py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Back to Exam</span>
                        <span className="sm:hidden">Back</span>
                    </Link>
                </div>

                {/* Exam Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-orange to-orange-dark">
                        {/* Mobile: Compact Layout */}
                        <div className="md:hidden">
                            <h2 className="text-base font-bold text-white mb-2 line-clamp-1">{exam.subject?.name}</h2>
                            <div className="flex flex-wrap gap-1.5 text-xs">
                                <span className="inline-flex items-center px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                                    {exam.grade?.name}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                                    {badge.label}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                                    T{exam.term} {exam.academic_year}
                                </span>
                            </div>
                        </div>

                        {/* Desktop: Full Layout */}
                        <div className="hidden md:block">
                            <h2 className="text-xl font-bold text-white mb-2">{exam.name}</h2>
                            <div className="flex flex-wrap gap-3 text-sm">
                                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                                    {exam.grade?.name}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                                    {exam.subject?.name}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                                    Term {exam.term} - {exam.academic_year}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                                    {badge.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-4 py-3 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs md:text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-xs md:text-sm font-bold text-gray-900">
                                {filledCount} / {students.length} ({completionPercentage}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                            <div
                                className="bg-orange h-full transition-all duration-500"
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Instructions Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 flex items-start">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-xs md:text-sm text-blue-800">
                        <p className="font-medium mb-1">Instructions:</p>
                        <ul className="list-disc list-inside space-y-0.5 md:space-y-1">
                            <li>Enter marks between 0 and 100 for each student</li>
                            <li className="hidden md:list-item">You can save partial results - students without marks will be skipped</li>
                            <li>Changes are saved when you click "Save All Marks"</li>
                            <li className="hidden md:list-item">Marks will automatically appear in student reports</li>
                        </ul>
                    </div>
                </div>

                {/* Mobile View - Student Cards */}
                <div className="md:hidden">
                    <MobileListContainer>
                        {students.length > 0 ? (
                            students.map((student, index) => {
                                const currentMark = marks[student.id] ?? '';
                                const rubric = getRubric(currentMark);
                                const isSaved = savedStudents.has(student.id);
                                const hasMark = currentMark !== '' && currentMark !== null;

                                return (
                                    <MobileStudentItem
                                        key={student.id}
                                        student={student}
                                        index={index}
                                        currentMark={currentMark}
                                        rubric={rubric}
                                        isSaved={isSaved}
                                        hasMark={hasMark}
                                        onMarkChange={handleMarkChange}
                                    />
                                );
                            })
                        ) : (
                            <div className="text-center py-12 px-4">
                                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium text-gray-900 mb-1">No students found</p>
                                <p className="text-sm text-gray-500">There are no active students in {exam.grade?.name}</p>
                            </div>
                        )}
                    </MobileListContainer>

                    {/* Mobile Save Button */}
                    {students.length > 0 && (
                        <div className="mt-4">
                            <button
                                onClick={handleSaveAll}
                                disabled={saving || filledCount === 0}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-white bg-orange rounded-xl hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
                            >
                                <Save className="w-5 h-5" />
                                {saving ? 'Saving...' : `Save All Marks (${filledCount}/${students.length})`}
                            </button>
                        </div>
                    )}
                </div>

                {/* Desktop View - Table */}
                <form onSubmit={handleSaveAll} className="hidden md:block">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center">
                                <Users className="w-6 h-6 text-orange mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Student Marks</h3>
                            </div>
                            <button
                                type="submit"
                                disabled={saving || filledCount === 0}
                                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save All Marks'}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Admission No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Marks (%)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Rubric
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.length > 0 ? (
                                        students.map((student, index) => {
                                            const rubric = getRubric(marks[student.id]);
                                            const isSaved = savedStudents.has(student.id);

                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {student.admission_number}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange flex items-center justify-center text-white font-semibold">
                                                                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {student.first_name} {student.last_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={marks[student.id]}
                                                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all text-center font-semibold"
                                                            placeholder="0-100"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {rubric && (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rubric.color}`}>
                                                                {rubric.text}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {isSaved && (
                                                            <span className="inline-flex items-center text-green-600">
                                                                <CheckCircle className="w-5 h-5" />
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-lg font-medium">No students found</p>
                                                <p className="text-sm mt-1">There are no active students in {exam.grade?.name}</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer with Save Button */}
                        {students.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    {filledCount === 0 && 'No marks entered yet'}
                                    {filledCount > 0 && filledCount < students.length && `${filledCount} of ${students.length} marks entered`}
                                    {filledCount === students.length && '✓ All marks entered'}
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving || filledCount === 0}
                                    className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? 'Saving...' : 'Save All Marks'}
                                </button>
                            </div>
                        )}
                    </div>
                </form>

                {/* Rubric Reference */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-20 md:mb-0">
                    <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Grading Rubric</h3>
                    </div>
                    <div className="p-4 md:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            <div className="flex items-center p-3 border border-green-200 bg-green-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="text-xs md:text-sm font-semibold text-green-800">Exceeding Expectation</p>
                                    <p className="text-xs text-green-600">90% - 100%</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 border border-blue-200 bg-blue-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="text-xs md:text-sm font-semibold text-blue-800">Meeting Expectation</p>
                                    <p className="text-xs text-blue-600">75% - 89%</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="text-xs md:text-sm font-semibold text-yellow-800">Approaching Expectation</p>
                                    <p className="text-xs text-yellow-600">50% - 74%</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 border border-red-200 bg-red-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="text-xs md:text-sm font-semibold text-red-800">Below Expectation</p>
                                    <p className="text-xs text-red-600">0% - 49%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}