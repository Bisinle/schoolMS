import { Link } from '@inertiajs/react';
import { FileText, Users } from 'lucide-react';

export default function ReportsTable({ students, isGuardian, onGenerateReport }) {
    // Handle both paginated and non-paginated data with proper null checks
    const studentData = students?.data || students || [];
    const hasPagination = !!students?.data;
    
    // Ensure studentData is always an array
    const studentsList = Array.isArray(studentData) ? studentData : [];

    console.log('students:', students);
    console.log('studentData:', studentData);
    console.log('studentsList:', studentsList);
    console.log('isGuardian:', isGuardian);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Admission No.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Guardian
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {studentsList.length > 0 ? (
                            studentsList.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {student.admission_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange text-white flex items-center justify-center font-semibold">
                                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.first_name} {student.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {student.gender}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.grade?.name || 'Not Assigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.guardian?.user?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => onGenerateReport(student)}
                                            className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors text-sm font-medium"
                                            title="Generate Report"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Report
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                                    <p className="text-gray-600">
                                        {isGuardian 
                                            ? 'No students are assigned to your account'
                                            : 'Try adjusting your filters'}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination - Only show if paginated */}
            {hasPagination && studentsList.length > 0 && students.links && (
                <div className="bg-white px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{students.from || 0}</span> to{' '}
                            <span className="font-medium">{students.to || 0}</span> of{' '}
                            <span className="font-medium">{students.total || 0}</span> results
                        </div>
                        <div className="flex gap-2">
                            {students.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                        link.active
                                            ? 'bg-orange text-white shadow-sm'
                                            : link.url
                                            ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveState
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}