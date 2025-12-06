import React, { useState, useEffect } from "react";
import { Head, router, useForm, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    UserCog,
    Save,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Copy,
    Calculator,
    AlertTriangle,
    FileText,
    RefreshCw,
    History,
    Clock,
    ExternalLink,
} from "lucide-react";

export default function Edit({
    auth,
    guardian,
    students,
    transportRoutes,
    tuitionFees,
    universalFees,
    selectedTerm,
    academicTerms,
    existingInvoice,
}) {
    const [expandedStudents, setExpandedStudents] = useState(
        students.reduce((acc, student) => ({ ...acc, [student.id]: true }), {})
    );
    const [selectedTermId, setSelectedTermId] = useState(selectedTerm?.id);
    const [showRegenerateOption, setShowRegenerateOption] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [preferenceHistory, setPreferenceHistory] = useState([]);

    // Initialize form with existing preferences or defaults
    const initialPreferences = students.map((student) => ({
        student_id: student.id,
        tuition_type: student.preference?.tuition_type || "full_day",
        transport_route_id: student.preference?.transport_route_id || "",
        transport_type: student.preference?.transport_type || "none",
        include_food: student.preference?.include_food || false,
        include_sports: student.preference?.include_sports || false,
        notes: student.preference?.notes || "",
    }));

    const form = useForm({
        academic_term_id: selectedTerm?.id,
        preferences: initialPreferences,
        regenerate_invoice: false,
    });

    // Check if any students are missing active tuition fees
    const studentsWithoutTuition = students.filter(student => !tuitionFees[student.grade_id]);

    const toggleStudent = (studentId) => {
        setExpandedStudents((prev) => ({
            ...prev,
            [studentId]: !prev[studentId],
        }));
    };

    const updatePreference = (studentIndex, field, value) => {
        const updatedPreferences = [...form.data.preferences];
        updatedPreferences[studentIndex][field] = value;

        // If transport_type is 'none', clear transport_route_id
        if (field === 'transport_type' && value === 'none') {
            updatedPreferences[studentIndex].transport_route_id = "";
        }

        form.setData("preferences", updatedPreferences);
    };

    const copyToAll = (studentIndex) => {
        const sourcePreference = form.data.preferences[studentIndex];
        const updatedPreferences = form.data.preferences.map((pref) => ({
            ...pref,
            tuition_type: sourcePreference.tuition_type,
            transport_route_id: sourcePreference.transport_route_id,
            transport_type: sourcePreference.transport_type,
            include_food: sourcePreference.include_food,
            include_sports: sourcePreference.include_sports,
        }));
        form.setData("preferences", updatedPreferences);
    };

    const calculateStudentTotal = (studentIndex) => {
        const preference = form.data.preferences[studentIndex];
        const student = students[studentIndex];
        let total = 0;

        // Tuition fee
        const tuitionFee = tuitionFees[student.grade_id];
        if (tuitionFee) {
            total += preference.tuition_type === "full_day"
                ? parseFloat(tuitionFee.amount_full_day)
                : parseFloat(tuitionFee.amount_half_day);
        }

        // Transport fee
        if (preference.transport_route_id && preference.transport_type !== 'none') {
            const route = transportRoutes.find((r) => r.id === parseInt(preference.transport_route_id));
            if (route) {
                total += preference.transport_type === "two_way"
                    ? parseFloat(route.amount_two_way)
                    : parseFloat(route.amount_one_way);
            }
        }

        // Universal fees
        if (preference.include_food && universalFees.food) {
            total += parseFloat(universalFees.food.amount);
        }
        if (preference.include_sports && universalFees.sports) {
            total += parseFloat(universalFees.sports.amount);
        }

        return total;
    };

    const calculateGrandTotal = () => {
        return students.reduce((total, student, index) => {
            return total + calculateStudentTotal(index);
        }, 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        form.put(route("fee-preferences.update", guardian.id), {
            onSuccess: () => {
                // Redirect handled by controller
            },
        });
    };

    const handleTermChange = (termId) => {
        router.get(route("fee-preferences.edit", {
            guardian: guardian.id,
            term: termId,
        }));
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(route('fee-preferences.history', {
                guardian: guardian.id,
                term: selectedTermId
            }));
            const data = await response.json();
            setPreferenceHistory(data.history);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Fee Preferences - ${guardian.full_name}`} />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl shadow-lg p-4 sm:p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route("fee-preferences.index", { term: selectedTermId })}
                                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-white" />
                                </Link>
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl">
                                        <UserCog className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                                            {guardian.full_name}
                                        </h1>
                                        <p className="text-orange-100 text-xs sm:text-sm">
                                            {guardian.guardian_id}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Active Term Display and History Button */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1">
                                    <label className="block text-white text-sm font-medium mb-2">
                                        Academic Term
                                    </label>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/20">
                                        <Clock className="w-4 h-4 text-white/80" />
                                        <span className="text-white font-semibold">
                                            {selectedTerm?.display_name || selectedTerm?.name}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={fetchHistory}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-3 min-h-[48px] rounded-lg transition-colors border border-white/20"
                                    >
                                        <History className="w-4 h-4" />
                                        <span className="hidden sm:inline">View History</span>
                                        <span className="sm:hidden">History</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Banner - Students Without Active Tuition Fees */}
                    {studentsWithoutTuition.length > 0 && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 sm:p-5 mx-4 sm:mx-6 mt-4 sm:mt-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-900 mb-2 text-sm sm:text-base">
                                        Missing Active Tuition Fees
                                    </h4>
                                    <p className="text-sm text-red-800 mb-3">
                                        The following student(s) cannot have preferences set because there is no active tuition fee configured for their grade:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                                        {studentsWithoutTuition.map(student => (
                                            <li key={student.id}>
                                                <span className="font-semibold">{student.full_name}</span> - {student.grade_name}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                                        <p className="text-sm text-red-700 font-medium">
                                            Please activate tuition fees for the above grade(s) before setting preferences.
                                        </p>
                                        <Link
                                            href={route('tuition-fees.index')}
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-2 rounded-lg transition-colors w-fit"
                                        >
                                            <span>Go to Tuition Fees</span>
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl shadow-lg">
                        <div className="p-4 sm:p-6 space-y-4">
                            {students.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">This guardian has no children enrolled.</p>
                                </div>
                            ) : (
                                students.map((student, studentIndex) => {
                                    const preference = form.data.preferences[studentIndex];
                                    const isExpanded = expandedStudents[student.id];
                                    const studentTotal = calculateStudentTotal(studentIndex);
                                    const tuitionFee = tuitionFees[student.grade_id];
                                    const hasTuitionFee = !!tuitionFee;

                                    return (
                                        <div
                                            key={student.id}
                                            className="border border-gray-200 rounded-xl overflow-hidden"
                                        >
                                            {/* Student Header */}
                                            <div
                                                onClick={() => toggleStudent(student.id)}
                                                className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                                            {student.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 text-lg">
                                                                {student.full_name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">{student.grade_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-xs text-gray-500">Total</p>
                                                            <p className="text-lg font-bold text-blue-600">
                                                                KSh {studentTotal.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Mobile Total */}
                                                <div className="sm:hidden mt-2 text-right">
                                                    <p className="text-xs text-gray-500">Total</p>
                                                    <p className="text-lg font-bold text-blue-600">
                                                        KSh {studentTotal.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Student Preferences Form */}
                                            {isExpanded && (
                                                <div className="p-4 space-y-4 bg-white">
                                                    {/* Tuition Type */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Tuition Type *
                                                        </label>

                                                        {!hasTuitionFee ? (
                                                            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                                                                <div className="flex items-start gap-3">
                                                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-semibold text-amber-900 mb-1">
                                                                            No Active Tuition Fee
                                                                        </p>
                                                                        <p className="text-sm text-amber-800 mb-3">
                                                                            There is no active tuition fee configured for <span className="font-semibold">{student.grade_name}</span>.
                                                                        </p>
                                                                        <Link
                                                                            href={route('tuition-fees.index')}
                                                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-lg transition-colors"
                                                                        >
                                                                            <span>Go to Tuition Fees</span>
                                                                            <ExternalLink className="w-4 h-4" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <label
                                                                    className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                                        preference.tuition_type === "full_day"
                                                                            ? "border-green-500 bg-green-50"
                                                                            : "border-gray-200 hover:border-gray-300"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="radio"
                                                                            name={`tuition_type_${student.id}`}
                                                                            value="full_day"
                                                                            checked={preference.tuition_type === "full_day"}
                                                                            onChange={(e) =>
                                                                                updatePreference(
                                                                                    studentIndex,
                                                                                    "tuition_type",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            className="w-4 h-4 text-green-600"
                                                                        />
                                                                        <span className="font-medium text-gray-900">
                                                                            Full Day
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-green-700">
                                                                        KSh {tuitionFee.amount_full_day.toLocaleString()}
                                                                    </span>
                                                                </label>

                                                                <label
                                                                    className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                                        preference.tuition_type === "half_day"
                                                                            ? "border-blue-500 bg-blue-50"
                                                                            : "border-gray-200 hover:border-gray-300"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="radio"
                                                                            name={`tuition_type_${student.id}`}
                                                                            value="half_day"
                                                                            checked={preference.tuition_type === "half_day"}
                                                                            onChange={(e) =>
                                                                                updatePreference(
                                                                                    studentIndex,
                                                                                    "tuition_type",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            className="w-4 h-4 text-blue-600"
                                                                        />
                                                                        <span className="font-medium text-gray-900">
                                                                            Half Day
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-blue-700">
                                                                        KSh {tuitionFee.amount_half_day.toLocaleString()}
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Transport */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Transport
                                                        </label>

                                                        {/* Transport Route */}
                                                        <select
                                                            value={preference.transport_route_id || ""}
                                                            onChange={(e) => {
                                                                updatePreference(studentIndex, "transport_route_id", e.target.value);
                                                                if (e.target.value && preference.transport_type === 'none') {
                                                                    updatePreference(studentIndex, "transport_type", "two_way");
                                                                }
                                                            }}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-3"
                                                        >
                                                            <option value="">No Transport</option>
                                                            {transportRoutes.map((route) => (
                                                                <option key={route.id} value={route.id}>
                                                                    {route.route_name}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {/* Transport Type */}
                                                        {preference.transport_route_id && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                {["two_way", "one_way", "none"].map((type) => {
                                                                    const route = transportRoutes.find(
                                                                        (r) => r.id === parseInt(preference.transport_route_id)
                                                                    );
                                                                    const amount =
                                                                        type === "two_way"
                                                                            ? route?.amount_two_way
                                                                            : type === "one_way"
                                                                            ? route?.amount_one_way
                                                                            : 0;

                                                                    return (
                                                                        <label
                                                                            key={type}
                                                                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                                                preference.transport_type === type
                                                                                    ? "border-purple-500 bg-purple-50"
                                                                                    : "border-gray-200 hover:border-gray-300"
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`transport_type_${student.id}`}
                                                                                    value={type}
                                                                                    checked={preference.transport_type === type}
                                                                                    onChange={(e) =>
                                                                                        updatePreference(
                                                                                            studentIndex,
                                                                                            "transport_type",
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    className="w-4 h-4 text-purple-600"
                                                                                />
                                                                                <span className="font-medium text-gray-900 text-sm">
                                                                                    {type === "two_way"
                                                                                        ? "2-Way"
                                                                                        : type === "one_way"
                                                                                        ? "1-Way"
                                                                                        : "None"}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-xs font-semibold text-purple-700">
                                                                                {amount > 0 ? `KSh ${amount.toLocaleString()}` : "-"}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Additional Fees */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Additional Fees
                                                        </label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {/* Food */}
                                                            {universalFees.food && (
                                                                <label
                                                                    className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                                        preference.include_food
                                                                            ? "border-green-500 bg-green-50"
                                                                            : "border-gray-200 hover:border-gray-300"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={preference.include_food}
                                                                            onChange={(e) =>
                                                                                updatePreference(
                                                                                    studentIndex,
                                                                                    "include_food",
                                                                                    e.target.checked
                                                                                )
                                                                            }
                                                                            className="w-4 h-4 text-green-600 rounded"
                                                                        />
                                                                        <span className="font-medium text-gray-900">Food</span>
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-green-700">
                                                                        KSh {universalFees.food.amount.toLocaleString()}
                                                                    </span>
                                                                </label>
                                                            )}

                                                            {/* Sports */}
                                                            {universalFees.sports && (
                                                                <label
                                                                    className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                                        preference.include_sports
                                                                            ? "border-blue-500 bg-blue-50"
                                                                            : "border-gray-200 hover:border-gray-300"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={preference.include_sports}
                                                                            onChange={(e) =>
                                                                                updatePreference(
                                                                                    studentIndex,
                                                                                    "include_sports",
                                                                                    e.target.checked
                                                                                )
                                                                            }
                                                                            className="w-4 h-4 text-blue-600 rounded"
                                                                        />
                                                                        <span className="font-medium text-gray-900">Sports</span>
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-blue-700">
                                                                        KSh {universalFees.sports.amount.toLocaleString()}
                                                                    </span>
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Notes */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Notes (Optional)
                                                        </label>
                                                        <textarea
                                                            value={preference.notes}
                                                            onChange={(e) =>
                                                                updatePreference(studentIndex, "notes", e.target.value)
                                                            }
                                                            rows="2"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                            placeholder="Any special notes or instructions..."
                                                        />
                                                    </div>

                                                    {/* Copy to All Button */}
                                                    {students.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToAll(studentIndex)}
                                                            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 min-h-[48px] rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                            Copy These Preferences to All Children
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer with Grand Total and Actions */}
                        {students.length > 0 && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 rounded-b-2xl">
                                {/* Grand Total */}
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-white">
                                            <Calculator className="w-5 h-5" />
                                            <span className="font-medium">Total for All Children</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl sm:text-3xl font-bold text-white">
                                                KSh {calculateGrandTotal().toLocaleString()}
                                            </p>
                                            <p className="text-xs text-orange-100">
                                                {students.length} {students.length === 1 ? "child" : "children"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Messages */}
                                {form.errors && Object.keys(form.errors).length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                        <p className="text-red-800 font-medium mb-2">Please fix the following errors:</p>
                                        <ul className="list-disc list-inside text-sm text-red-700">
                                            {Object.values(form.errors).map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Existing Invoice Warning */}
                                {existingInvoice && (
                                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    Invoice Already Exists
                                                </h4>
                                                <p className="text-sm text-amber-800 mb-2">
                                                    Invoice <span className="font-mono font-semibold">{existingInvoice.invoice_number}</span> already exists for this term.
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3 bg-white bg-opacity-50 rounded p-2">
                                                    <div>
                                                        <span className="text-amber-700">Status:</span>
                                                        <span className={`ml-1 font-semibold ${
                                                            existingInvoice.status === 'paid' ? 'text-green-700' :
                                                            existingInvoice.status === 'partial' ? 'text-blue-700' :
                                                            existingInvoice.status === 'overdue' ? 'text-red-700' :
                                                            'text-gray-700'
                                                        }`}>
                                                            {existingInvoice.status.charAt(0).toUpperCase() + existingInvoice.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-amber-700">Total:</span>
                                                        <span className="ml-1 font-semibold text-amber-900">
                                                            KSh {existingInvoice.total_amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-amber-700">Paid:</span>
                                                        <span className="ml-1 font-semibold text-green-700">
                                                            KSh {existingInvoice.amount_paid.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-amber-700">Balance:</span>
                                                        <span className="ml-1 font-semibold text-red-700">
                                                            KSh {existingInvoice.balance_due.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Regenerate Option */}
                                                {(existingInvoice.status === 'pending' || existingInvoice.status === 'partial') && (
                                                    <div className="bg-white bg-opacity-70 rounded p-3 border border-amber-200">
                                                        <label className="flex items-start gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={form.data.regenerate_invoice}
                                                                onChange={(e) => form.setData('regenerate_invoice', e.target.checked)}
                                                                className="mt-1 rounded border-amber-400 text-orange-600 focus:ring-orange-500"
                                                            />
                                                            <div className="flex-1">
                                                                <span className="text-sm font-medium text-amber-900 flex items-center gap-1">
                                                                    <RefreshCw className="w-4 h-4" />
                                                                    Regenerate existing invoice with new preferences
                                                                </span>
                                                                <p className="text-xs text-amber-700 mt-1">
                                                                    {existingInvoice.status === 'partial'
                                                                        ? 'The invoice will be regenerated. Existing payments will be preserved.'
                                                                        : 'The existing invoice will be deleted and regenerated with updated preferences.'
                                                                    }
                                                                </p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                )}

                                                {existingInvoice.status === 'paid' && (
                                                    <p className="text-sm text-amber-800 bg-white bg-opacity-70 rounded p-2 border border-amber-200">
                                                        <strong>Note:</strong> Invoice is fully paid. Preferences will be saved for next term only.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href={route("fee-preferences.index", { term: selectedTermId })}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium min-h-[48px]"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 min-h-[48px]"
                                    >
                                        <Save className="w-5 h-5" />
                                        {form.processing ? "Saving..." : "Save Preferences"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-white" />
                                    <h2 className="text-2xl font-bold text-white">
                                        Preference Change History
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-blue-100 mt-2">
                                {guardian.full_name} - {selectedTerm?.name}, {selectedTerm?.year}
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {preferenceHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No preference changes found for this term.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {preferenceHistory.map((history, index) => (
                                        <div
                                            key={history.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                        {history.student_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{history.term}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">Updated by</p>
                                                    <p className="text-sm font-medium text-gray-700">{history.updated_by}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{history.updated_at}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 rounded p-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Tuition</p>
                                                    <p className="text-sm font-medium text-gray-900 capitalize">
                                                        {history.tuition_type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Transport</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {history.transport_route || 'None'}
                                                        {history.transport_route && (
                                                            <span className="text-xs text-gray-600 ml-1">
                                                                ({history.transport_type})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Extras</p>
                                                    <div className="flex gap-2 mt-1">
                                                        {history.include_food && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                                Food
                                                            </span>
                                                        )}
                                                        {history.include_sports && (
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                                Sports
                                                            </span>
                                                        )}
                                                        {!history.include_food && !history.include_sports && (
                                                            <span className="text-xs text-gray-500">None</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-full sm:w-auto px-6 py-3 min-h-[48px] bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
