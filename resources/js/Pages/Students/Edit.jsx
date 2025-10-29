import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, X, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function StudentsEdit({ student, guardians, grades }) {
    const [guardianSearch, setGuardianSearch] = useState('');

    const { data, setData, put, processing, errors } = useForm({
        admission_number: student.admission_number || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'male',
        date_of_birth: student.date_of_birth || '',
        guardian_id: student.guardian_id || '',
        grade_id: student.grade_id || '',
        enrollment_date: student.enrollment_date || '',
        status: student.status || 'active',
    });

    const filteredGuardians = useMemo(() => {
        if (!guardianSearch) return guardians;
        return guardians.filter(guardian =>
            guardian.name.toLowerCase().includes(guardianSearch.toLowerCase())
        );
    }, [guardians, guardianSearch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/students/${student.id}`);
    };

    return (
        <AuthenticatedLayout header="Edit Student">
            <Head title="Edit Student" />

            <div className="max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Admission Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admission Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.admission_number}
                                    onChange={(e) => setData('admission_number', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.admission_number && (
                                    <p className="mt-1 text-sm text-red-600">{errors.admission_number}</p>
                                )}
                            </div>

                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.first_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.last_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                                )}
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.gender}
                                    onChange={(e) => setData('gender', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                                {errors.gender && (
                                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                                )}
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.date_of_birth && (
                                    <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                                )}
                            </div>

                            {/* Grade */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Grade <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.grade_id}
                                    onChange={(e) => setData('grade_id', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    <option value="">Select Grade</option>
                                    {grades.map((grade) => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name} - {grade.level}
                                        </option>
                                    ))}
                                </select>
                                {errors.grade_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.grade_id}</p>
                                )}
                            </div>

                            {/* Guardian */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Guardian <span className="text-red-500">*</span>
                                </label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={guardianSearch}
                                        onChange={(e) => setGuardianSearch(e.target.value)}
                                        placeholder="Search guardian..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                                <select
                                    value={data.guardian_id}
                                    onChange={(e) => setData('guardian_id', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    size="5"
                                >
                                    <option value="">Select Guardian</option>
                                    {filteredGuardians.map((guardian) => (
                                        <option key={guardian.id} value={guardian.id}>
                                            {guardian.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.guardian_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.guardian_id}</p>
                                )}
                            </div>

                            {/* Enrollment Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Enrollment Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.enrollment_date}
                                    onChange={(e) => setData('enrollment_date', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.enrollment_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.enrollment_date}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                            <Link
                                href="/students"
                                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Saving...' : 'Update Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}