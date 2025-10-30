import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Calendar, BarChart3, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

export default function AttendanceReports({ 
    grades, 
    selectedGradeId, 
    startDate, 
    endDate,
    reportData,
}) {
    const [localGradeId, setLocalGradeId] = useState(selectedGradeId || '');
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);

    // Handle filter changes
    const handleGenerateReport = () => {
        router.get('/attendance/reports', {
            grade_id: localGradeId,
            start_date: localStartDate,
            end_date: localEndDate,
        }, {
            preserveState: true,
        });
    };

    // Export to CSV
    const exportToCSV = () => {
        if (!reportData) return;

        const headers = ['Student Name', 'Admission No.', 'Total Days', 'Present', 'Absent', 'Late', 'Excused', 'Attendance Rate'];
        const rows = reportData.students.map(student => [
            student.student_name,
            student.admission_number,
            student.total_days,
            student.present,
            student.absent,
            student.late,
            student.excused,
            `${student.attendance_rate}%`,
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${reportData.grade.name}_${startDate}_${endDate}.csv`;
        a.click();
    };

    return (
        <AuthenticatedLayout header="Attendance Reports">
            <Head title="Attendance Reports" />

            <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-navy mb-4">Generate Report</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Grade Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Grade
                            </label>
                            <select
                                value={localGradeId}
                                onChange={(e) => setLocalGradeId(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            >
                                <option value="">-- Select Grade --</option>
                                {grades.map((grade) => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.name} ({grade.level})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={localStartDate}
                                    onChange={(e) => setLocalStartDate(e.target.value)}
                                    max={localEndDate}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={localEndDate}
                                    onChange={(e) => setLocalEndDate(e.target.value)}
                                    min={localStartDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerateReport}
                                disabled={!localGradeId}
                                className="w-full px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                <BarChart3 className="w-4 h-4 inline mr-2" />
                                Generate
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                {reportData ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-blue-100">Total Students</p>
                                    <BarChart3 className="w-8 h-8 text-blue-200" />
                                </div>
                                <p className="text-3xl font-bold">{reportData.summary.total_students}</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-purple-100">Total Days</p>
                                    <Calendar className="w-8 h-8 text-purple-200" />
                                </div>
                                <p className="text-3xl font-bold">{reportData.summary.total_days}</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-green-100">Total Present</p>
                                    <TrendingUp className="w-8 h-8 text-green-200" />
                                </div>
                                <p className="text-3xl font-bold">{reportData.summary.total_present}</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange to-orange-dark rounded-xl shadow-sm p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-orange-100">Attendance Rate</p>
                                    <BarChart3 className="w-8 h-8 text-orange-200" />
                                </div>
                                <p className="text-3xl font-bold">{reportData.summary.grade_attendance_rate}%</p>
                            </div>
                        </div>

                        {/* Grade Info & Export */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-navy">
                                        {reportData.grade.name} - Attendance Report
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Level: {reportData.grade.level}
                                    </p>
                                </div>
                                <button
                                    onClick={exportToCSV}
                                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Student-wise Report Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h4 className="text-lg font-semibold text-navy">Student-wise Attendance</h4>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No.</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Excused</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData.students.map((student, index) => (
                                            <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.student_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.admission_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                                    {student.total_days}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {student.present}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        {student.absent}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        {student.late}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {student.excused}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                                            student.attendance_rate >= 90 ? 'bg-green-100 text-green-800' :
                                                            student.attendance_rate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {student.attendance_rate >= 90 ? (
                                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                            ) : student.attendance_rate < 75 ? (
                                                                <TrendingDown className="w-3 h-3 mr-1" />
                                                            ) : null}
                                                            {student.attendance_rate}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                    <a
                                                        href={`/attendance/student/${student.student_id}?start_date=${startDate}&end_date=${endDate}`}
                                                        className="text-orange hover:text-orange-dark font-medium"
                                                    >
                                                        View Details
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Performance Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-gray-700">Excellent Attendance</h4>
                                    <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                        ≥90%
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-green-600">
                                    {reportData.students.filter(s => s.attendance_rate >= 90).length}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">students</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-gray-700">Good Attendance</h4>
                                    <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                        75-89%
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {reportData.students.filter(s => s.attendance_rate >= 75 && s.attendance_rate < 90).length}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">students</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-gray-700">Needs Attention</h4>
                                    <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                        &lt;75%
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-red-600">
                                    {reportData.students.filter(s => s.attendance_rate < 75).length}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">students</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Report Generated
                        </h3>
                        <p className="text-gray-500">
                            Please select a grade and date range to generate an attendance report.
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
