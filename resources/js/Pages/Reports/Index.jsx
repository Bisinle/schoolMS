import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { FileText, Users } from 'lucide-react';
import GenerateReportModal from '@/Components/Students/GenerateReportModal';
import ReportsFilters from '@/Components/Reports/ReportsFilters';
import ReportsTable from '@/Components/Reports/ReportsTable';

export default function ReportsIndex({ students, grades, filters = {}, isGuardian, currentYear, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [gradeId, setGradeId] = useState(filters.grade_id || '');
    const [gender, setGender] = useState(filters.gender || '');
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/reports', {
            search,
            grade_id: gradeId,
            gender,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (filterType, value) => {
        const params = {
            search,
            grade_id: gradeId,
            gender,
        };

        if (filterType === 'grade') {
            params.grade_id = value;
            setGradeId(value);
        } else if (filterType === 'gender') {
            params.gender = value;
            setGender(value);
        }

        router.get('/reports', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleGenerateReport = (student) => {
        setSelectedStudentForReport(student);
        setShowReportModal(true);
    };

    return (
        <AuthenticatedLayout header="Reports">
            <Head title="Reports" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-orange" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Student Reports</h2>
                        <p className="text-sm text-gray-600">Generate and view student report cards</p>
                    </div>
                </div>

                {/* Filters - Only for non-guardians */}
                {!isGuardian && (
                    <ReportsFilters
                        search={search}
                        setSearch={setSearch}
                        gradeId={gradeId}
                        gender={gender}
                        grades={grades}
                        onFilterChange={handleFilterChange}
                        onSubmit={handleSearch}
                    />
                )}

                {/* Students Table */}
                <ReportsTable
                    students={students}
                    isGuardian={isGuardian}
                    onGenerateReport={handleGenerateReport}
                />
            </div>

            {/* Generate Report Modal */}
            <GenerateReportModal
                student={selectedStudentForReport}
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
            />
        </AuthenticatedLayout>
    );
}