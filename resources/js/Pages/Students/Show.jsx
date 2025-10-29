import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Calendar, GraduationCap, Users, MapPin, Phone, BookOpen } from 'lucide-react';

export default function StudentsShow({ student }) {
    const InfoCard = ({ icon: Icon, label, value }) => (
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-orange" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="mt-1 text-sm text-navy font-medium truncate">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header="Student Details">
            <Head title={`Student - ${student.first_name} ${student.last_name}`} />

            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href="/students"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Students
                </Link>

                {/* Main Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange to-orange-dark px-6 py-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-orange">
                                {student.first_name.charAt(0).toUpperCase()}{student.last_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{student.first_name} {student.last_name}</h2>
                                <p className="text-orange-100 mt-1">Admission No: {student.admission_number}</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                                    student.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {student.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4">Student Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <InfoCard icon={User} label="Gender" value={student.gender.charAt(0).toUpperCase() + student.gender.slice(1)} />
                            <InfoCard icon={Calendar} label="Date of Birth" value={new Date(student.date_of_birth).toLocaleDateString()} />
                            <InfoCard 
                                icon={BookOpen} 
                                label="Grade" 
                                value={student.grade ? `${student.grade.name} - ${student.grade.level}` : 'Not Assigned'} 
                            />
                            <InfoCard icon={Calendar} label="Enrollment Date" value={new Date(student.enrollment_date).toLocaleDateString()} />
                        </div>

                        <h3 className="text-lg font-semibold text-navy mb-4 mt-6">Guardian Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoCard icon={Users} label="Guardian Name" value={student.guardian?.user?.name} />
                            <InfoCard icon={Phone} label="Guardian Phone" value={student.guardian?.phone_number} />
                            <InfoCard icon={User} label="Relationship" value={student.guardian?.relationship} />
                            <InfoCard icon={MapPin} label="Address" value={student.guardian?.address} />
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <Link
                            href={`/students/${student.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all"
                        >
                            Edit Student
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}