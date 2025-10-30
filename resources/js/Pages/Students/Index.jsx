import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Plus, Search, Eye, Edit, Trash2, ClipboardCheck } from "lucide-react";
import ConfirmationModal from "@/Components/ConfirmationModal";

export default function StudentsIndex({ students, filters, auth }) {
    const [search, setSearch] = useState(filters.search || "");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get("/students", { search }, { preserveState: true });
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

    return (
        <AuthenticatedLayout header="Students Management">
            <Head title="Students" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <form
                        onSubmit={handleSearch}
                        className="flex-1 w-full sm:max-w-md"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search students..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            />
                        </div>
                    </form>

                    {auth.user.role === "admin" && (
                        <Link
                            href="/students/create"
                            className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Student
                        </Link>
                    )}
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Admission No.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Grade
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Guardian
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.data.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                            {student.admission_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.first_name} {student.last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {student.grade ? student.grade.name : 'Not Assigned'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {student.guardian?.user?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                student.status === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                            <Link
                                                href={`/students/${student.id}`}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/attendance/student/${student.id}`}
                                                className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
                                                title="View Attendance"
                                            >
                                                <ClipboardCheck className="w-4 h-4" />
                                            </Link>
                                            {auth.user.role === 'admin' && (
                                                <>
                                                    <Link
                                                        href={`/students/${student.id}/edit`}
                                                        className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                        title="Edit Student"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => confirmDelete(student)}
                                                        className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                                        title="Delete Student"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Showing{" "}
                                <span className="font-medium">
                                    {students.from}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium">
                                    {students.to}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium">
                                    {students.total}
                                </span>{" "}
                                results
                            </div>
                            <div className="flex gap-2">
                                {students.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                            link.active
                                                ? "bg-orange text-white shadow-sm"
                                                : link.url
                                                ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
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
        </AuthenticatedLayout>
    );
}