import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { useState } from 'react';

export default function TeachersCreate({ grades }) {
    const [selectedGrades, setSelectedGrades] = useState([]);
    const [classTeacherGrade, setClassTeacherGrade] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        employee_number: '',
        phone_number: '',
        address: '',
        qualification: '',
        subject_specialization: '',
        date_of_joining: '',
        status: 'active',
        grade_ids: [],
        class_teacher_grade_id: '',
    });

    const handleGradeToggle = (gradeId) => {
        const newSelectedGrades = selectedGrades.includes(gradeId)
            ? selectedGrades.filter(id => id !== gradeId)
            : [...selectedGrades, gradeId];
        
        setSelectedGrades(newSelectedGrades);
        setData('grade_ids', newSelectedGrades);

        // If unselecting the class teacher grade, reset it
        if (!newSelectedGrades.includes(parseInt(classTeacherGrade))) {
            setClassTeacherGrade('');
            setData('class_teacher_grade_id', '');
        }
    };

    const handleClassTeacherChange = (gradeId) => {
        setClassTeacherGrade(gradeId);
        setData('class_teacher_grade_id', gradeId);
        
        // Automatically add to selected grades if not already there
        if (gradeId && !selectedGrades.includes(parseInt(gradeId))) {
            const newSelectedGrades = [...selectedGrades, parseInt(gradeId)];
            setSelectedGrades(newSelectedGrades);
            setData('grade_ids', newSelectedGrades);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/teachers');
    };

    return (
        <AuthenticatedLayout header="Add New Teacher">
            <Head title="Add Teacher" />

            <div className="max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-navy mb-4 pb-2 border-b border-gray-200">
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                {/* Employee Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employee Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.employee_number}
                                        onChange={(e) => setData('employee_number', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.employee_number && (
                                        <p className="mt-1 text-sm text-red-600">{errors.employee_number}</p>
                                    )}
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone_number}
                                        onChange={(e) => setData('phone_number', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.phone_number && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                                    )}
                                </div>

                                {/* Date of Joining */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Joining <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.date_of_joining}
                                        onChange={(e) => setData('date_of_joining', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.date_of_joining && (
                                        <p className="mt-1 text-sm text-red-600">{errors.date_of_joining}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Professional Information Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-navy mb-4 pb-2 border-b border-gray-200">
                                Professional Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Qualification */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Qualification
                                    </label>
                                    <input
                                        type="text"
                                        value={data.qualification}
                                        onChange={(e) => setData('qualification', e.target.value)}
                                        placeholder="e.g., Masters in Education"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.qualification && (
                                        <p className="mt-1 text-sm text-red-600">{errors.qualification}</p>
                                    )}
                                </div>

                                {/* Subject Specialization */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subject Specialization
                                    </label>
                                    <input
                                        type="text"
                                        value={data.subject_specialization}
                                        onChange={(e) => setData('subject_specialization', e.target.value)}
                                        placeholder="e.g., Mathematics"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.subject_specialization && (
                                        <p className="mt-1 text-sm text-red-600">{errors.subject_specialization}</p>
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

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows="3"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                    {errors.address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Grade Assignment Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-navy mb-4 pb-2 border-b border-gray-200">
                                Grade Assignment
                            </h3>
                            
                            {/* Assigned Grades */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Assign Grades (Select multiple)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {grades.map((grade) => (
                                        <label
                                            key={grade.id}
                                            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                selectedGrades.includes(grade.id)
                                                    ? 'border-orange bg-orange bg-opacity-10'
                                                    : 'border-gray-300 hover:border-orange hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedGrades.includes(grade.id)}
                                                onChange={() => handleGradeToggle(grade.id)}
                                                className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-900">
                                                {grade.name}
                                                <span className="block text-xs text-gray-500">{grade.level}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.grade_ids && (
                                    <p className="mt-1 text-sm text-red-600">{errors.grade_ids}</p>
                                )}
                            </div>

                            {/* Class Teacher Grade */}
                            {selectedGrades.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Class Teacher For (Optional)
                                    </label>
                                    <select
                                        value={classTeacherGrade}
                                        onChange={(e) => handleClassTeacherChange(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    >
                                        <option value="">Select Grade (Optional)</option>
                                        {grades
                                            .filter(grade => selectedGrades.includes(grade.id))
                                            .map((grade) => (
                                                <option key={grade.id} value={grade.id}>
                                                    {grade.name} - {grade.level}
                                                </option>
                                            ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Select a grade if this teacher will be the main class teacher for that grade
                                    </p>
                                    {errors.class_teacher_grade_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.class_teacher_grade_id}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                            <Link
                                href="/teachers"
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
                                {processing ? 'Saving...' : 'Save Teacher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}