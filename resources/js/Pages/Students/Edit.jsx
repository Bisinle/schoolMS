import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function StudentsEdit({ student, guardians, grades }) {
    const { data, setData, put, processing, errors } = useForm({
        admission_number: student.admission_number || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'male',
        date_of_birth: student.date_of_birth || '',
        grade_id: student.grade_id || '',
        guardian_id: student.guardian_id || '',
        enrollment_date: student.enrollment_date || '',
        status: student.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/students/${student.id}`);
    };

    return (
        <AuthenticatedLayout header="Edit Student">
            <Head title={`Edit ${student.first_name} ${student.last_name}`} />

            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Student Information</h2>
                            <Link
                                href="/students"
                                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to List
                            </Link>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Personal Information Section */}
                        <div>
                            <h3 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Admission Number */}
                                <div>
                                    <label htmlFor="admission_number" className="block text-sm font-medium text-gray-700 mb-2">
                                        Admission Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="admission_number"
                                        value={data.admission_number}
                                        onChange={(e) => setData('admission_number', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.admission_number ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., S2024001"
                                    />
                                    {errors.admission_number && (
                                        <p className="mt-1 text-sm text-red-600">{errors.admission_number}</p>
                                    )}
                                </div>

                                {/* First Name */}
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.first_name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., John"
                                    />
                                    {errors.first_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.last_name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., Doe"
                                    />
                                    {errors.last_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                                    )}
                                </div>

                                {/* Gender */}
                                <div>
                                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                                        Gender <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="gender"
                                        value={data.gender}
                                        onChange={(e) => setData('gender', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.gender ? 'border-red-500' : 'border-gray-300'
                                        }`}
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
                                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                                        Date of Birth <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="date_of_birth"
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.date_of_birth && (
                                        <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Academic Information Section */}
                        <div>
                            <h3 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Academic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Grade */}
                                <div>
                                    <label htmlFor="grade_id" className="block text-sm font-medium text-gray-700 mb-2">
                                        Grade <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="grade_id"
                                        value={data.grade_id}
                                        onChange={(e) => setData('grade_id', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.grade_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select Grade</option>
                                        {grades.map((grade) => (
                                            <option key={grade.id} value={grade.id}>
                                                {grade.name} ({grade.level})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.grade_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.grade_id}</p>
                                    )}
                                </div>

                                {/* Enrollment Date */}
                                <div>
                                    <label htmlFor="enrollment_date" className="block text-sm font-medium text-gray-700 mb-2">
                                        Enrollment Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="enrollment_date"
                                        value={data.enrollment_date}
                                        onChange={(e) => setData('enrollment_date', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.enrollment_date ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.enrollment_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.enrollment_date}</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.status ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    {errors.status && (
                                        <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Guardian Information Section */}
                        <div>
                            <h3 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Guardian Information
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                {/* Guardian */}
                                <div>
                                    <label htmlFor="guardian_id" className="block text-sm font-medium text-gray-700 mb-2">
                                        Guardian <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="guardian_id"
                                        value={data.guardian_id}
                                        onChange={(e) => setData('guardian_id', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                            errors.guardian_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select Guardian</option>
                                        {guardians.map((guardian) => (
                                            <option key={guardian.id} value={guardian.id}>
                                                {guardian.name} ({guardian.relationship}) - {guardian.phone}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.guardian_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.guardian_id}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href="/students"
                                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Updating...' : 'Update Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}