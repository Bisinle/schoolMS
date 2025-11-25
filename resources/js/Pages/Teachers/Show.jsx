import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar, Award, BookOpen, Users } from 'lucide-react';

export default function TeachersShow({ teacher }) {
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
        <AuthenticatedLayout header="Teacher Details">
            <Head title={`Teacher - ${teacher.user?.name}`} />

            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href={route('teachers.index')}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Teachers
                </Link>

                {/* Main Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange to-orange-dark px-6 py-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-orange">
                                {teacher.user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="mb-2">
                                    <span className="inline-block px-3 py-1.5 text-sm font-bold rounded-md bg-white text-orange">
                                        {teacher.employee_number}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white">{teacher.user?.name}</h2>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                                    teacher.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {teacher.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <InfoCard icon={Mail} label="Email" value={teacher.user?.email} />
                            <InfoCard icon={Phone} label="Phone Number" value={teacher.phone_number} />
                            <InfoCard icon={Calendar} label="Date of Joining" value={new Date(teacher.date_of_joining).toLocaleDateString()} />
                            <InfoCard icon={MapPin} label="Address" value={teacher.address} />
                        </div>

                        <h3 className="text-lg font-semibold text-navy mb-4 mt-6">Professional Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <InfoCard icon={Award} label="Qualification" value={teacher.qualification} />
                            <InfoCard icon={BookOpen} label="Subject Specialization" value={teacher.subject_specialization} />
                        </div>

                        {/* Assigned Grades Section */}
                        <h3 className="text-lg font-semibold text-navy mb-4 mt-6 flex items-center">
                            <BookOpen className="w-5 h-5 mr-2 text-orange" />
                            Assigned Grades
                        </h3>
                        {teacher.grades && teacher.grades.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teacher.grades.map((grade) => (
                                    <Link
                                        key={grade.id}
                                        href={`/grades/${grade.id}`}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-orange"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-orange bg-opacity-10 flex items-center justify-center mr-3">
                                                    <BookOpen className="w-5 h-5 text-orange" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-navy">{grade.name}</h4>
                                                    <p className="text-xs text-gray-500">{grade.level}</p>
                                                </div>
                                            </div>
                                            {grade.pivot.is_class_teacher && (
                                                <span className="px-2 py-1 bg-orange bg-opacity-10 text-orange text-xs font-medium rounded-full">
                                                    Class Teacher
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Users className="w-4 h-4 mr-1" />
                                            <span>{grade.students?.length || 0} Students</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No grades assigned yet.</p>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <Link
                            href={`/teachers/${teacher.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all"
                        >
                            Edit Teacher
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}