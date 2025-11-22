import { Link } from '@inertiajs/react';
import { FileText, Users, ChevronDown, ChevronUp, GraduationCap, User } from 'lucide-react';
import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component
function MobileStudentReportItem({ student, onGenerateReport }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [swipeAction, setSwipeAction] = useState(null);

    const handlers = useSwipeable({
        onSwipedLeft: () => setSwipeAction('primary'),
        onSwipedRight: () => {},
        onSwiping: () => {},
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: 60,
    });

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-orange-500 to-red-600 flex items-center justify-end px-4 gap-2 z-10">
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
                    swipeAction === 'primary' ? '-translate-x-20' : ''
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
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-lg">
                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {student.first_name} {student.last_name}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{student.admission_number}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        {student.grade?.name || 'Not Assigned'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        student.gender === 'Male' ? 'bg-indigo-100 text-indigo-800' : 'bg-pink-100 text-pink-800'
                                    }`}>
                                        {student.gender}
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
                                <GraduationCap className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Grade</span>
                                    <span className="font-semibold text-gray-900">{student.grade?.name || 'Not Assigned'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Guardian</span>
                                    <span className="font-semibold text-gray-900">{student.guardian?.user?.name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={() => onGenerateReport(student)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange text-white rounded-xl font-bold text-sm hover:bg-orange-dark transition-colors active:scale-95"
                            >
                                <FileText className="w-4 h-4" />
                                Generate Report
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ReportsTable({ students, isGuardian, onGenerateReport }) {
    // Handle both paginated and non-paginated data with proper null checks
    const studentData = students?.data || students || [];
    const hasPagination = !!students?.data;
    
    // Ensure studentData is always an array
    const studentsList = Array.isArray(studentData) ? studentData : [];

    console.log('students:', students);
    console.log('studentData:', studentData);
    console.log('studentsList:', studentsList);
    console.log('isGuardian:', isGuardian);

    return (
        <>
            {/* Mobile List View */}
            <div className="block md:hidden bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {studentsList.length > 0 ? (
                    studentsList.map((student) => (
                        <MobileStudentReportItem
                            key={student.id}
                            student={student}
                            onGenerateReport={onGenerateReport}
                        />
                    ))
                ) : (
                    <div className="px-6 py-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                        <p className="text-gray-600">
                            {isGuardian
                                ? 'No students are assigned to your account'
                                : 'Try adjusting your filters'}
                        </p>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Admission No.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Guardian
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {studentsList.length > 0 ? (
                            studentsList.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {student.admission_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange text-white flex items-center justify-center font-semibold">
                                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.first_name} {student.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {student.gender}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.grade?.name || 'Not Assigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.guardian?.user?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => onGenerateReport(student)}
                                            className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors text-sm font-medium"
                                            title="Generate Report"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Report
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                                    <p className="text-gray-600">
                                        {isGuardian 
                                            ? 'No students are assigned to your account'
                                            : 'Try adjusting your filters'}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

                {/* Pagination - Only show if paginated */}
                {hasPagination && studentsList.length > 0 && students.links && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{students.from || 0}</span> to{' '}
                                <span className="font-medium">{students.to || 0}</span> of{' '}
                                <span className="font-medium">{students.total || 0}</span> results
                            </div>
                            <div className="flex gap-2">
                                {students.links.map((link, index) => (
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
        </>
    );
}