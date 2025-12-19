import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { Head } from "@inertiajs/react";
import AdminDashboardContent from "./Dashboard/Components/AdminDashboardContent";
import TeacherDashboardContent from "./Dashboard/Components/TeacherDashboardContent";
import GuardianDashboardContent from "./Dashboard/Components/GuardianDashboardContent";

export default function Dashboard({
    role,
    stats,
    recentStudents,
    students,
    guardianInfo,
    currentMonth,
    currentYear,
    currentTerm,
    documentStats,
    quranStats,
    quranTrackingData,
    // Admin specific
    studentsByGrade,
    studentsByGender,
    topStudents,
    examsWithCompletion,
    teachersByGrade,
    subjectsByCategory,
    quickStats,
    feeStats,
    invoicesByStatus,
    monthlyCollections,
    // Teacher specific
    isClassTeacher,
    classTeacherGrade,
    myGrades,
    examsNeedingAttention,
}) {
    const { flash } = usePage().props;
    const { auth } = usePage().props;
    const dashboardTitle = auth?.user?.role ?? 'User';
    const passedDashboardTitle = `${role} Dashboard`;

    return (
        <AuthenticatedLayout header={passedDashboardTitle}>
            <Head title="Dashboardfgsdfgd" />
            

            {/* Success message for password reset */}
            {flash?.status && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-green-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">
                                {flash.status}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Role-Based Dashboard Content */}
        
            {role === "admin" && (
                <AdminDashboardContent
                    stats={stats}
                    currentYear={currentYear}
                    currentTerm={currentTerm}
                    documentStats={documentStats}
                    quranStats={quranStats}
                    studentsByGrade={studentsByGrade}
                    topStudents={topStudents}
                    recentStudents={recentStudents}
                    examsWithCompletion={examsWithCompletion}
                    teachersByGrade={teachersByGrade}
                    subjectsByCategory={subjectsByCategory}
                    quickStats={quickStats}
                    feeStats={feeStats}
                    invoicesByStatus={invoicesByStatus}
                    monthlyCollections={monthlyCollections}
                />
            )}

            {role === "teacher" && (
                <TeacherDashboardContent
                    stats={stats}
                    currentYear={currentYear}
                    currentTerm={currentTerm}
                    isClassTeacher={isClassTeacher}
                    classTeacherGrade={classTeacherGrade}
                    documentStats={documentStats}
                    myGrades={myGrades}
                    examsNeedingAttention={examsNeedingAttention}
                    topStudents={topStudents}
                    recentStudents={recentStudents}
                />
            )}

            {role === "guardian" && (
                <GuardianDashboardContent
                    guardianInfo={guardianInfo}
                    currentYear={currentYear}
                    currentTerm={currentTerm}
                    currentMonth={currentMonth}
                    students={students}
                    documentStats={documentStats}
                    quranStats={quranStats}
                    quranTrackingData={quranTrackingData}
                />
            )}
        </AuthenticatedLayout>
    );
}
