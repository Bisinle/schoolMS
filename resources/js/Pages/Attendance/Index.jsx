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
} from "lucide-react";
import { useState, useEffect } from "react";

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
                preserveState: false, // Changed to false to fully reload
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
                // Refresh the page to show updated data
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                        {/* View Reports Button */}
                        <div className="flex items-end">
                            <a
                                href="/attendance/reports"
                                className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
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

                {/* Stats Cards */}
                {attendanceData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Total Students
                                    </p>
                                    <p className="text-2xl font-bold text-navy mt-1">
                                        {stats.total}
                                    </p>
                                </div>
                                <Users className="w-10 h-10 text-gray-400" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-100">
                                        Present
                                    </p>
                                    <p className="text-2xl font-bold mt-1">
                                        {stats.present}
                                    </p>
                                </div>
                                <CheckCircle className="w-10 h-10 text-green-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-100">
                                        Absent
                                    </p>
                                    <p className="text-2xl font-bold mt-1">
                                        {stats.absent}
                                    </p>
                                </div>
                                <XCircle className="w-10 h-10 text-red-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-sm p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-yellow-100">
                                        Late
                                    </p>
                                    <p className="text-2xl font-bold mt-1">
                                        {stats.late}
                                    </p>
                                </div>
                                <Clock className="w-10 h-10 text-yellow-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-100">
                                        Excused
                                    </p>
                                    <p className="text-2xl font-bold mt-1">
                                        {stats.excused}
                                    </p>
                                </div>
                                <AlertCircle className="w-10 h-10 text-blue-200" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Rate */}
                {attendanceData && (
                    <div className="bg-gradient-to-r from-orange to-orange-dark rounded-xl shadow-sm p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-orange-100">
                                    Attendance Rate for{" "}
                                    {attendanceData.grade.name}
                                </p>
                                <p className="text-sm text-orange-100 mt-1">
                                    Date:{" "}
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
                                <p className="text-4xl font-bold mt-2">
                                    {attendanceRate}%
                                </p>
                            </div>
                            <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                <CheckCircle className="w-12 h-12" />
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
                                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
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
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => markAllAs("present")}
                                        className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-all text-sm font-medium"
                                    >
                                        <CheckCircle className="w-4 h-4 inline mr-1" />
                                        Mark All Present
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => markAllAs("absent")}
                                        className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                                    >
                                        <XCircle className="w-4 h-4 inline mr-1" />
                                        Mark All Absent
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => markAllAs("late")}
                                        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-all text-sm font-medium"
                                    >
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Mark All Late
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => markAllAs("excused")}
                                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                                    >
                                        <AlertCircle className="w-4 h-4 inline mr-1" />
                                        Mark All Excused
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Student List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-navy">
                                    Students in {attendanceData.grade.name}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Mark attendance for{" "}
                                    {attendanceData.total_students} students
                                </p>
                            </div>

                            <div className="overflow-x-auto">
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
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={handleLoadStudents}
                                    className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all shadow-sm hover:shadow-md font-medium"
                                >
                                    <Users className="w-5 h-5 mr-2" />
                                    Reload Students
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-all shadow-sm hover:shadow-md disabled:opacity-50 font-medium"
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
