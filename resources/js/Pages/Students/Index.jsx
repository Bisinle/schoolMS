import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import GenerateReportModal from '@/Components/Students/GenerateReportModal';
import StudentsFilters from '@/Components/Students/StudentsFilters';
import StudentsTable from '@/Components/Students/StudentsTable';

export default function StudentsIndex({ students, grades, filters = {}, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [gradeId, setGradeId] = useState(filters.grade_id || '');
    const [gender, setGender] = useState(filters.gender || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/students', {
            search,
            grade_id: gradeId,
            gender,
            status,
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
            status,
        };

        if (filterType === 'grade') {
            params.grade_id = value;
            setGradeId(value);
        } else if (filterType === 'gender') {
            params.gender = value;
            setGender(value);
        } else if (filterType === 'status') {
            params.status = value;
            setStatus(value);
        }

        router.get('/students', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const confirmDelete = (student) => {
        setSelectedStudent(student);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedStudent) {
            router.delete(`/students/${selectedStudent.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedStudent(null);
                },
            });
        }
    };

    const handleGenerateReport = (student) => {
        setSelectedStudentForReport(student);
        setShowReportModal(true);
    };

    return (
        <AuthenticatedLayout header="Students">
            <Head title="Students" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                            <p className="text-sm text-gray-600">Manage student records and information</p>
                        </div>
                    </div>

                    {auth.user.role === 'admin' && (
                        <Link
                            href="/students/create"
                            className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Student
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <StudentsFilters
                    search={search}
                    setSearch={setSearch}
                    gradeId={gradeId}
                    gender={gender}
                    status={status}
                    grades={grades}
                    onFilterChange={handleFilterChange}
                    onSubmit={handleSearch}
                />

                {/* Students Table */}
                <StudentsTable
                    students={students}
                    auth={auth}
                    onDelete={confirmDelete}
                    onGenerateReport={handleGenerateReport}
                />
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Student"
                message={`Are you sure you want to delete ${selectedStudent?.first_name} ${selectedStudent?.last_name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />

            {/* Generate Report Modal */}
            <GenerateReportModal
                student={selectedStudentForReport}
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
            />
        </AuthenticatedLayout>
    );
}