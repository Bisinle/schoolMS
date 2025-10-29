import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, X, Search } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

export default function GradesEdit({ grade, teachers, assignedTeacherIds, classTeacherId }) {
    const { data, setData, put, processing, errors } = useForm({
        name: grade.name || '',
        level: grade.level || 'ECD',
        capacity: grade.capacity || 40,
        description: grade.description || '',
        status: grade.status || 'active',
        teacher_ids: assignedTeacherIds || [],
        class_teacher_id: classTeacherId || '',
    });

    const [teacherSearch, setTeacherSearch] = useState('');
    const [selectedTeachers, setSelectedTeachers] = useState(assignedTeacherIds || []);

    // Update form data when selectedTeachers changes
    useEffect(() => {
        setData('teacher_ids', selectedTeachers);
    }, [selectedTeachers]);

    // Filter teachers based on search
    const filteredTeachers = useMemo(() => {
        if (!teacherSearch) return teachers;
        return teachers.filter(teacher =>
            teacher.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            teacher.employee_number.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            (teacher.subject_specialization && teacher.subject_specialization.toLowerCase().includes(teacherSearch.toLowerCase()))
        );
    }, [teachers, teacherSearch]);

    // Handle teacher selection
    const handleTeacherToggle = (teacherId) => {
        const newSelection = selectedTeachers.includes(teacherId)
            ? selectedTeachers.filter(id => id !== teacherId)
            : [...selectedTeachers, teacherId];
        
        setSelectedTeachers(newSelection);

        // If deselecting the class teacher, clear class_teacher_id
        if (!newSelection.includes(data.class_teacher_id)) {
            setData('class_teacher_id', '');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/grades/${grade.id}`);
    };

    return (
        <AuthenticatedLayout header="Edit Grade">
            <Head title="Edit Grade" />

            <div className="max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Grade Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Grade Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., Grade 1, Pre-Primary 1"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.level}
                                    onChange={(e) => setData('level', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    <option value="ECD">ECD (Pre-Primary 1-2)</option>
                                    <option value="Lower Primary">Lower Primary (Grade 1-3)</option>
                                    <option value="Upper Primary">Upper Primary (Grade 4-6)</option>
                                    <option value="Junior Secondary">Junior Secondary (Grade 7-9)</option>
                                </select>
                                {errors.level && (
                                    <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                                )}
                            </div>

                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Capacity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', e.target.value)}
                                    min="1"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.capacity && (
                                    <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
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

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows="4"
                                    placeholder="Brief description of this grade..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Teacher Assignment Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-navy mb-4">Manage Teachers</h3>
                            
                            {/* Teacher Search */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search Teachers
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={teacherSearch}
                                        onChange={(e) => setTeacherSearch(e.target.value)}
                                        placeholder="Search by name, employee number, or subject..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Teacher Selection Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                                {filteredTeachers.map((teacher) => (
                                    <label
                                        key={teacher.id}
                                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            selectedTeachers.includes(teacher.id)
                                                ? 'border-orange bg-orange bg-opacity-10'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTeachers.includes(teacher.id)}
                                            onChange={() => handleTeacherToggle(teacher.id)}
                                            className="mt-1 mr-3 h-4 w-4 text-orange border-gray-300 rounded focus:ring-orange"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{teacher.name}</p>
                                            <p className="text-sm text-gray-500">{teacher.employee_number}</p>
                                            {teacher.subject_specialization && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {teacher.subject_specialization}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                                {filteredTeachers.length === 0 && (
                                    <div className="col-span-2 text-center py-8 text-gray-500">
                                        No teachers found matching your search.
                                    </div>
                                )}
                            </div>
                            {errors.teacher_ids && (
                                <p className="mt-2 text-sm text-red-600">{errors.teacher_ids}</p>
                            )}

                            {/* Class Teacher Selection */}
                            {selectedTeachers.length > 0 && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Class Teacher (Optional)
                                    </label>
                                    <select
                                        value={data.class_teacher_id}
                                        onChange={(e) => setData('class_teacher_id', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                    >
                                        <option value="">Select Class Teacher</option>
                                        {teachers
                                            .filter(t => selectedTeachers.includes(t.id))
                                            .map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.name} ({teacher.employee_number})
                                                </option>
                                            ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        The class teacher will be the primary teacher for this grade.
                                    </p>
                                    {errors.class_teacher_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.class_teacher_id}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                            <Link
                                href="/grades"
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
                                {processing ? 'Saving...' : 'Update Grade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}