import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

export default function GradesCreate({ subjects, teachers, levels }) {
    const { school } = usePage().props;
    const isMadrasah = school?.school_type === 'madrasah';

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        level: isMadrasah ? null : 'LOWER PRIMARY',
        status: 'active',
        subject_ids: [],
        teacher_ids: [],
        class_teacher_id: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/grades');
    };

    const handleSubjectToggle = (subjectId) => {
        const currentSubjects = [...data.subject_ids];
        const index = currentSubjects.indexOf(subjectId);
        
        if (index > -1) {
            currentSubjects.splice(index, 1);
        } else {
            currentSubjects.push(subjectId);
        }
        
        setData('subject_ids', currentSubjects);
    };

    const handleTeacherToggle = (teacherId) => {
        const currentTeachers = [...data.teacher_ids];
        const index = currentTeachers.indexOf(teacherId);
        
        if (index > -1) {
            currentTeachers.splice(index, 1);
            // If removing the class teacher, clear class_teacher_id
            if (data.class_teacher_id === teacherId) {
                setData('class_teacher_id', null);
            }
        } else {
            currentTeachers.push(teacherId);
        }
        
        setData('teacher_ids', currentTeachers);
    };

    const handleClassTeacherChange = (teacherId) => {
        if (data.class_teacher_id === teacherId) {
            setData('class_teacher_id', null);
        } else {
            setData('class_teacher_id', teacherId);
            // Ensure the teacher is also selected
            if (!data.teacher_ids.includes(teacherId)) {
                setData('teacher_ids', [...data.teacher_ids, teacherId]);
            }
        }
    };

    const selectAllSubjects = () => {
        setData('subject_ids', subjects.map(s => s.id));
    };

    const deselectAllSubjects = () => {
        setData('subject_ids', []);
    };

    const selectAllTeachers = () => {
        setData('teacher_ids', teachers.map(t => t.id));
    };

    const deselectAllTeachers = () => {
        setData('teacher_ids', []);
        setData('class_teacher_id', null);
    };

    const academicSubjects = subjects.filter(s => s.category === 'academic');
    const islamicSubjects = subjects.filter(s => s.category === 'islamic');

    return (
        <AuthenticatedLayout header="Add New Grade">
            <Head title="Add Grade" />

            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Grade Information</h2>
                            <Link
                                href="/grades"
                                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to List
                            </Link>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Grade Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Grade Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., Grade 1, Grade 2, Pre-Primary 1"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Grade Code */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                Grade Code
                            </label>
                            <input
                                type="text"
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.code ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., G1, PP1, G2"
                            />
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Optional short code for the grade (e.g., G1 for Grade 1, PP1 for Pre-Primary 1)
                            </p>
                        </div>

                        {/* Level - Hidden for Madrasah */}
                        {!isMadrasah && (
                        <div>
                            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                                Level <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="level"
                                value={data.level}
                                onChange={(e) => setData('level', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.level ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                {Object.entries(levels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {errors.level && (
                                <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Academic level classification (ECD, Lower Primary, Upper Primary, Junior Secondary)
                            </p>
                        </div>
                        )}

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

                        {/* Assign Teachers */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    <UserPlus className="w-4 h-4 inline mr-2" />
                                    Assign Teachers
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllTeachers}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={deselectAllTeachers}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                                {teachers.length > 0 ? (
                                    <div className="space-y-2">
                                        {teachers.map((teacher) => (
                                            <div
                                                key={teacher.id}
                                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <label className="flex items-center flex-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.teacher_ids.includes(teacher.id)}
                                                        onChange={() => handleTeacherToggle(teacher.id)}
                                                        className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                                    />
                                                    <div className="ml-3">
                                                        <span className="text-sm font-medium text-gray-900">{teacher.name}</span>
                                                        {teacher.employee_number && (
                                                            <span className="ml-2 text-xs text-gray-500">({teacher.employee_number})</span>
                                                        )}
                                                    </div>
                                                </label>
                                                
                                                {data.teacher_ids.includes(teacher.id) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleClassTeacherChange(teacher.id)}
                                                        className={`ml-3 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                            data.class_teacher_id === teacher.id
                                                                ? 'bg-orange text-white'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                    >
                                                        {data.class_teacher_id === teacher.id ? 'Class Teacher' : 'Set as Class Teacher'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-8">
                                        No teachers available. Create teachers first to assign them to grades.
                                    </p>
                                )}
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                                Selected: {data.teacher_ids.length} teacher(s)
                                {data.class_teacher_id && (
                                    <span className="ml-2 text-orange font-medium">
                                        • Class Teacher: {teachers.find(t => t.id === data.class_teacher_id)?.name}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Assign Subjects */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Assign Subjects
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllSubjects}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={deselectAllSubjects}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                                {/* Academic Subjects */}
                                {academicSubjects.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            Academic Subjects
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {academicSubjects.map((subject) => (
                                                <label
                                                    key={subject.id}
                                                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={data.subject_ids.includes(subject.id)}
                                                        onChange={() => handleSubjectToggle(subject.id)}
                                                        className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                                    />
                                                    <span className="ml-3 text-sm text-gray-900">{subject.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Islamic Subjects */}
                                {islamicSubjects.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Islamic Subjects
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {islamicSubjects.map((subject) => (
                                                <label
                                                    key={subject.id}
                                                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={data.subject_ids.includes(subject.id)}
                                                        onChange={() => handleSubjectToggle(subject.id)}
                                                        className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                                    />
                                                    <span className="ml-3 text-sm text-gray-900">{subject.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {subjects.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-8">
                                        No subjects available. Create subjects first to assign them to grades.
                                    </p>
                                )}
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                                Selected: {data.subject_ids.length} subject(s)
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href="/grades"
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
                                {processing ? 'Saving...' : 'Save Grade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}