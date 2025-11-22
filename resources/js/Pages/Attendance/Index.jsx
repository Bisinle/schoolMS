import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import {
    Calendar,
    Save,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    FileText,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";

// Mobile Student Attendance Item Component
function MobileAttendanceItem({ student, index, attendance, updateStudentStatus, canMarkAttendance }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'absent':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'late':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'excused':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return '✓';
            case 'absent':
                return '✗';
            case 'late':
                return '⏰';
            case 'excused':
                return '📝';
            default:
                return '?';
        }
    };

    return (
        <div className="border-b border-gray-200 bg-white">
            {/* Summary Row */}
            <div
                className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                                {student.student_name}
                            </h3>
                            <p className="text-sm text-gray-600">{student.admission_number}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 ${getStatusColor(attendance?.status || 'present')}`}>
                            {getStatusIcon(attendance?.status || 'present')}
                        </span>
                        <button className="flex-shrink-0 p-1">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                    {/* Status Selection */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Attendance Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => updateStudentStatus(student.student_id, 'status', 'present')}
                                disabled={!canMarkAttendance}
                                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                    attendance?.status === 'present'
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                            >
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Present
                            </button>
                            <button
                                type="button"
                                onClick={() => updateStudentStatus(student.student_id, 'status', 'absent')}
                                disabled={!canMarkAttendance}
                                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                    attendance?.status === 'absent'
                                        ? 'bg-red-500 text-white shadow-lg'
                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                            >
                                <XCircle className="w-4 h-4 inline mr-1" />
                                Absent
                            </button>
                            <button
                                type="button"
                                onClick={() => updateStudentStatus(student.student_id, 'status', 'late')}
                                disabled={!canMarkAttendance}
                                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                    attendance?.status === 'late'
                                        ? 'bg-yellow-500 text-white shadow-lg'
                                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                }`}
                            >
                                <Clock className="w-4 h-4 inline mr-1" />
                                Late
                            </button>
                            <button
                                type="button"
                                onClick={() => updateStudentStatus(student.student_id, 'status', 'excused')}
                                disabled={!canMarkAttendance}
                                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                    attendance?.status === 'excused'
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                            >
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                Excused
                            </button>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Remarks (Optional)
                        </label>
                        <textarea
                            value={attendance?.remarks || ''}
                            onChange={(e) => updateStudentStatus(student.student_id, 'remarks', e.target.value)}
                            disabled={!canMarkAttendance}
                            placeholder="Add any notes..."
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent text-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AttendanceIndex({
    grades,
    selectedGradeId,
    selectedDate,
    attendanceData,
    canMarkAttendance,
}) {
    const [localGradeId, setLocalGradeId] = useState(selectedGradeId || "");
    const [localDate, setLocalDate] = useState(
        selectedDate || new Date().toISOString().split("T")[0]
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        grade_id: selectedGradeId || "",
        attendance_date: selectedDate || new Date().toISOString().split("T")[0],
        attendances: [],
    });

    // Initialize attendance data when component mounts or data changes
    useEffect(() => {
        if (attendanceData?.students) {
            const initialAttendances = attendanceData.students.map(
                (student) => ({
                    student_id: student.student_id,
                    status: student.status,
                    remarks: student.remarks || "",
                })
            );
            setData("attendances", initialAttendances);
            setData("grade_id", selectedGradeId);
            setData("attendance_date", selectedDate);
        }
    }, [attendanceData]);

    // Handle filter changes - Load students
    const handleLoadStudents = () => {
        if (!localGradeId) {
            alert("Please select a grade first");
            return;
        }

        router.get(
            "/attendance",
            {
                grade_id: localGradeId,
                date: localDate,
            },
            {
                preserveState: false,
                preserveScroll: true,
            }
        );
    };

    // Update student status
    const updateStudentStatus = (studentId, field, value) => {
        const updatedAttendances = data.attendances.map((att) =>
            att.student_id === studentId ? { ...att, [field]: value } : att
        );
        setData("attendances", updatedAttendances);
    };

    // Bulk actions
    const markAllAs = (status) => {
        const updatedAttendances = data.attendances.map((att) => ({
            ...att,
            status: status,
        }));
        setData("attendances", updatedAttendances);
    };

    // Submit attendance
    const handleSubmit = (e) => {
        e.preventDefault();
        post("/attendance/mark", {
            onSuccess: () => {
                router.get(
                    "/attendance",
                    {
                        grade_id: localGradeId,
                        date: localDate,
                    },
                    {
                        preserveState: false,
                    }
                );
            },
        });
    };

    // Calculate stats
    const stats = attendanceData?.students
        ? {
              total: attendanceData.students.length,
              present: data.attendances.filter((a) => a.status === "present")
                  .length,
              absent: data.attendances.filter((a) => a.status === "absent")
                  .length,
              late: data.attendances.filter((a) => a.status === "late").length,
              excused: data.attendances.filter((a) => a.status === "excused")
                  .length,
          }
        : { total: 0, present: 0, absent: 0, late: 0, excused: 0 };

    const attendanceRate =
        stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

    return (
        <AuthenticatedLayout header="Attendance Management">
            <Head title="Attendance" />

            <div className="space-y-6">
                {/* Top Actions Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            {/* Grade Selection */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Grade{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={localGradeId}
                                    onChange={(e) =>
                                        setLocalGradeId(e.target.value)
                                    }
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

                            {/* Date Selection */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        value={localDate}
                                        onChange={(e) =>
                                            setLocalDate(e.target.value)
                                        }
                                        max={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Apply Filter Button */}
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={handleLoadStudents}
                                    disabled={!localGradeId}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-navy text-white rounded-lg hover:bg-navy-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Load Students
                                </button>
                            </div>
                        </div>

                        {/* View Reports Button */}
                        <div className="flex items-end">
                            <a
                                href="/attendance/reports"
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                View Reports
                            </a>
                        </div>
                    </div>
                </div>

                {/* Show message if no grade selected */}
                {!attendanceData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                        <Users className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            Ready to Mark Attendance
                        </h3>
                        <p className="text-blue-700 text-sm">
                            Select a grade and date above, then click "Load
                            Students" to begin marking attendance.
                        </p>
                    </div>
                )}

                {/* Stats Cards - Mobile Optimized */}
                {attendanceData && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex flex-col items-center text-center">
                                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mb-2" />
                                <p className="text-xs text-gray-500">
                                    Total
                                </p>
                                <p className="text-xl sm:text-2xl font-bold text-navy mt-1">
                                    {stats.total}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-4 text-white">
                            <div className="flex flex-col items-center text-center">
                                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-100 mb-2" />
                                <p className="text-xs text-green-100">
                                    Present
                                </p>
                                <p className="text-xl sm:text-2xl font-bold mt-1">
                                    {stats.present}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md p-4 text-white">
                            <div className="flex flex-col items-center text-center">
                                <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-100 mb-2" />
                                <p className="text-xs text-red-100">
                                    Absent
                                </p>
                                <p className="text-xl sm:text-2xl font-bold mt-1">
                                    {stats.absent}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md p-4 text-white">
                            <div className="flex flex-col items-center text-center">
                                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-100 mb-2" />
                                <p className="text-xs text-yellow-100">
                                    Late
                                </p>
                                <p className="text-xl sm:text-2xl font-bold mt-1">
                                    {stats.late}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-4 text-white col-span-2 sm:col-span-1">
                            <div className="flex flex-col items-center text-center">
                                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-blue-100 mb-2" />
                                <p className="text-xs text-blue-100">
                                    Excused
                                </p>
                                <p className="text-xl sm:text-2xl font-bold mt-1">
                                    {stats.excused}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Rate */}
                {attendanceData && (
                    <div className="bg-gradient-to-r from-orange to-orange-dark rounded-xl shadow-md p-6 text-white">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <p className="text-sm text-orange-100">
                                    Attendance Rate for{" "}
                                    {attendanceData.grade.name}
                                </p>
                                <p className="text-xs sm:text-sm text-orange-100 mt-1">
                                    {new Date(selectedDate).toLocaleDateString(
                                        "en-US",
                                        {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        }
                                    )}
                                </p>
                                <p className="text-3xl sm:text-4xl font-bold mt-2">
                                    {attendanceRate}%
                                </p>
                            </div>
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Form */}
                {attendanceData ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Already Marked Notice */}
                        {attendanceData.marked_count > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Attendance Already Marked
                                        </p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Attendance has already been marked
                                            for {attendanceData.marked_count}{" "}
                                            out of{" "}
                                            {attendanceData.total_students}{" "}
                                            students on this date. You can
                                            update the records below.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bulk Actions */}
                        {canMarkAttendance && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                    Quick Actions:
                                </p>
                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => markAllAs("present")}
                                        className="px-3 sm:px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-all text-xs sm:text-sm font-medium"
                                    >
                                        <CheckCircle className="w-4 h-4 inline mr-1" />
                                        All Present
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => markAllAs("absent")}
                                        className="px-3 sm:px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-all text-xs sm:text-sm font-medium"
                                    >
                                        <XCircle className="w-4 h-4 inline mr-1" />
                                        All Absent
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => markAllAs("late")}
                                        className="px-3 sm:px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-all text-xs sm:text-sm font-medium"
                                    >
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        All Late
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => markAllAs("excused")}
                                        className="px-3 sm:px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-all text-xs sm:text-sm font-medium"
                                    >
                                        <AlertCircle className="w-4 h-4 inline mr-1" />
                                        All Excused
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Student List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-navy">
                                    Students in {attendanceData.grade.name}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Mark attendance for{" "}
                                    {attendanceData.total_students} students
                                </p>
                            </div>

                            {/* Mobile List View */}
                            <div className="block md:hidden">
                                {attendanceData.students.map((student, index) => {
                                    const attendance = data.attendances.find(
                                        (a) => a.student_id === student.student_id
                                    );
                                    return (
                                        <MobileAttendanceItem
                                            key={student.student_id}
                                            student={student}
                                            index={index}
                                            attendance={attendance}
                                            updateStudentStatus={updateStudentStatus}
                                            canMarkAttendance={canMarkAttendance}
                                        />
                                    );
                                })}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Admission No.
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Remarks
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {attendanceData.students.map(
                                            (student, index) => {
                                                const attendance =
                                                    data.attendances.find(
                                                        (a) =>
                                                            a.student_id ===
                                                            student.student_id
                                                    );

                                                return (
                                                    <tr
                                                        key={student.student_id}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {
                                                                    student.student_name
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {
                                                                student.admission_number
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <select
                                                                value={
                                                                    attendance?.status ||
                                                                    "present"
                                                                }
                                                                onChange={(e) =>
                                                                    updateStudentStatus(
                                                                        student.student_id,
                                                                        "status",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                disabled={
                                                                    !canMarkAttendance
                                                                }
                                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-orange focus:outline-none transition-all ${
                                                                    attendance?.status ===
                                                                    "present"
                                                                        ? "bg-green-100 text-green-800 border-2 border-green-300"
                                                                        : attendance?.status ===
                                                                          "absent"
                                                                        ? "bg-red-100 text-red-800 border-2 border-red-300"
                                                                        : attendance?.status ===
                                                                          "late"
                                                                        ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                                                                        : "bg-blue-100 text-blue-800 border-2 border-blue-300"
                                                                }`}
                                                            >
                                                                <option value="present">
                                                                    ✓ Present
                                                                </option>
                                                                <option value="absent">
                                                                    ✗ Absent
                                                                </option>
                                                                <option value="late">
                                                                    ⏰ Late
                                                                </option>
                                                                <option value="excused">
                                                                    📝 Excused
                                                                </option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    attendance?.remarks ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    updateStudentStatus(
                                                                        student.student_id,
                                                                        "remarks",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                disabled={
                                                                    !canMarkAttendance
                                                                }
                                                                placeholder="Optional remarks..."
                                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange focus:border-transparent"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Submit Button */}
                        {canMarkAttendance && (
                            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                                <button
                                    type="button"
                                    onClick={handleLoadStudents}
                                    className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all shadow-sm hover:shadow-md font-medium"
                                >
                                    <Users className="w-5 h-5 mr-2" />
                                    Reload Students
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-all shadow-sm hover:shadow-md disabled:opacity-50 font-medium"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {processing
                                        ? "Saving..."
                                        : attendanceData.marked_count > 0
                                        ? "Update Attendance"
                                        : "Save Attendance"}
                                </button>
                            </div>
                        )}

                        {errors && Object.keys(errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800 font-medium">
                                    Error:
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                    {errors.attendances ||
                                        errors.grade_id ||
                                        "There was an error saving attendance. Please try again."}
                                </p>
                            </div>
                        )}
                    </form>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}