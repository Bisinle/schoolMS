import { useState } from 'react';
import { X, Users, BookOpen, AlertTriangle } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function BulkTeacherChangeModal({ isOpen, onClose, template, subjects, teachers, classTeacher }) {
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!selectedSubject || !selectedTeacher) {
            alert('Please select both a subject and a teacher');
            return;
        }

        setIsSubmitting(true);

        router.post(
            route('timetables.templates.bulk-update-teacher', template.id),
            {
                subject_id: selectedSubject,
                teacher_id: selectedTeacher,
            },
            {
                onSuccess: () => {
                    onClose();
                    setSelectedSubject('');
                    setSelectedTeacher('');
                },
                onError: (errors) => {
                    console.error('Bulk update failed:', errors);
                    alert('Failed to update teachers. Please try again.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Users className="w-6 h-6 text-orange" />
                        <h3 className="text-xl font-bold text-gray-900">Bulk Change Teachers</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6">
                    <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Bulk Teacher Assignment</p>
                            <p>Select a subject and a teacher to assign that teacher to all slots of the selected subject. This will clear the auto-assigned flag.</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Subject Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <BookOpen className="w-4 h-4 inline mr-2" />
                            Select Subject
                        </label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                            required
                        >
                            <option value="">-- Select a subject --</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name} ({subject.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Teacher Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Users className="w-4 h-4 inline mr-2" />
                            Select Teacher
                        </label>
                        <select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                            required
                        >
                            <option value="">-- Select a teacher --</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.user?.name || teacher.name}
                                    {teacher.id === classTeacher?.id && ' ★ (Class Teacher)'}
                                    {teacher.subjects && teacher.subjects.length > 0 && 
                                        ` - ${teacher.subjects.map(s => s.name).join(', ')}`
                                    }
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedSubject || !selectedTeacher}
                            className="px-6 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Teachers'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

