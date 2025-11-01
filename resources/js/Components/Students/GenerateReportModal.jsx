import { useState } from 'react';
import { FileText } from 'lucide-react';

export default function GenerateReportModal({ student, show, onClose }) {
    const [term, setTerm] = useState('1');
    const [academicYear, setAcademicYear] = useState(new Date().getFullYear());

    const handleGenerate = () => {
        window.location.href = `/reports/generate?student_id=${student.id}&term=${term}&academic_year=${academicYear}`;
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Generate Report Card
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {student.first_name} {student.last_name}
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Term
                        </label>
                        <select
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                        >
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Academic Year
                        </label>
                        <input
                            type="number"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                            min="2020"
                            max="2100"
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
}