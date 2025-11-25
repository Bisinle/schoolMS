import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import TextInput from '@/Components/Forms/TextInput';
import SelectInput from '@/Components/Forms/SelectInput';
import TextareaInput from '@/Components/Forms/TextareaInput';
import FormSection, { FormField } from '@/Components/Forms/FormSection';
import FormActions from '@/Components/Forms/FormActions';
import ReadOnlyField from '@/Components/Forms/ReadOnlyField';

export default function TeachersEdit({ teacher, grades, assignedGradeIds, classTeacherGradeId }) {
    const [selectedGrades, setSelectedGrades] = useState(assignedGradeIds || []);
    const [classTeacherGrade, setClassTeacherGrade] = useState(classTeacherGradeId?.toString() || '');

    const { data, setData, put, processing, errors } = useForm({
        name: teacher.user?.name || '',
        email: teacher.user?.email || '',
        phone_number: teacher.phone_number || '',
        address: teacher.address || '',
        qualification: teacher.qualification || '',
        subject_specialization: teacher.subject_specialization || '',
        date_of_joining: teacher.date_of_joining || '',
        status: teacher.status || 'active',
        grade_ids: assignedGradeIds || [],
        class_teacher_grade_id: classTeacherGradeId?.toString() || '',
    });

    useEffect(() => {
        setData('grade_ids', selectedGrades);
    }, [selectedGrades]);

    const handleGradeToggle = (gradeId) => {
        const newSelectedGrades = selectedGrades.includes(gradeId)
            ? selectedGrades.filter(id => id !== gradeId)
            : [...selectedGrades, gradeId];

        setSelectedGrades(newSelectedGrades);

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
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/teachers/${teacher.id}`);
    };

    return (
        <AuthenticatedLayout header="Edit Teacher">
            <Head title="Edit Teacher" />

            <div className="max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information Section */}
                        <FormSection title="Personal Information">
                            <FormField span="full">
                                <ReadOnlyField
                                    label="Employee Number"
                                    value={teacher.employee_number}
                                    badge="Read-only"
                                    badgeColor="blue"
                                    helperText="Employee number cannot be changed"
                                    copyable
                                />
                            </FormField>

                            <TextInput
                                label="Full Name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                required
                            />

                            <TextInput
                                label="Email"
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                required
                            />

                            <TextInput
                                label="Phone Number"
                                name="phone_number"
                                value={data.phone_number}
                                onChange={(e) => setData('phone_number', e.target.value)}
                                error={errors.phone_number}
                                required
                            />

                            <TextInput
                                label="Date of Joining"
                                name="date_of_joining"
                                type="date"
                                value={data.date_of_joining}
                                onChange={(e) => setData('date_of_joining', e.target.value)}
                                error={errors.date_of_joining}
                                required
                            />
                        </FormSection>

                        {/* Professional Information Section */}
                        <FormSection title="Professional Information">
                            <TextInput
                                label="Qualification"
                                name="qualification"
                                value={data.qualification}
                                onChange={(e) => setData('qualification', e.target.value)}
                                error={errors.qualification}
                                placeholder="e.g., Masters in Education"
                            />

                            <TextInput
                                label="Subject Specialization"
                                name="subject_specialization"
                                value={data.subject_specialization}
                                onChange={(e) => setData('subject_specialization', e.target.value)}
                                error={errors.subject_specialization}
                                placeholder="e.g., Mathematics"
                            />

                            <SelectInput
                                label="Status"
                                name="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                error={errors.status}
                                required
                                options={['active', 'inactive']}
                                showPlaceholder={false}
                            />

                            <FormField span="full">
                                <TextareaInput
                                    label="Address"
                                    name="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    error={errors.address}
                                    rows={3}
                                />
                            </FormField>
                        </FormSection>

                        {/* Grade Assignment Section */}
                        <FormSection title="Grade Assignment" gridCols="1">
                            {/* Assigned Grades */}
                            <div>
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
                                <div className="mt-6">
                                    <SelectInput
                                        label="Class Teacher For (Optional)"
                                        name="class_teacher_grade_id"
                                        value={classTeacherGrade}
                                        onChange={(e) => handleClassTeacherChange(e.target.value)}
                                        error={errors.class_teacher_grade_id}
                                        placeholder="Select Grade (Optional)"
                                        helperText="Select a grade if this teacher will be the main class teacher for that grade"
                                        optionRenderer={(grade) => (
                                            <option key={grade.id} value={grade.id}>
                                                {grade.name} - {grade.level}
                                            </option>
                                        )}
                                        options={grades.filter(grade => selectedGrades.includes(grade.id))}
                                    />
                                </div>
                            )}
                        </FormSection>

                        <FormActions
                            submitLabel="Update Teacher"
                            cancelHref="/teachers"
                            processing={processing}
                        />
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}