import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, UserCheck, UserCircle, GraduationCap, TrendingUp, Calendar, 
    ClipboardCheck, BarChart3, Award, AlertCircle, CheckCircle, BookOpen,
    FileText, Target, Clock, Trophy, AlertTriangle, UserPlus, School
} from 'lucide-react';

export default function Dashboard({ 
    role, 
    stats, 
    recentStudents, 
    students, 
    guardianInfo, 
    currentMonth,
    currentYear,
    currentTerm,
    // Admin specific
    studentsByGrade,
    studentsByGender,
    topStudents,
    examsWithCompletion,
    teachersByGrade,
    subjectsByCategory,
    quickStats,
    // Teacher specific
    isClassTeacher,
    classTeacherGrade,
    myGrades,
    examsNeedingAttention
}) {
    const StatCard = ({ icon: Icon, label, value, color = 'orange', trend, link }) => {
        const CardContent = (
            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 group">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                        <p className={`text-3xl font-bold text-${color} mb-1`}>{value}</p>
                        {trend && (
                            <p className="text-xs text-gray-500 flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {trend}
                            </p>
                        )}
                    </div>
                    <div className={`p-4 bg-${color} bg-opacity-10 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-8 h-8 text-${color}`} />
                    </div>
                </div>
            </div>
        );

        return link ? <Link href={link}>{CardContent}</Link> : CardContent;
    };

    const ProgressBar = ({ percentage, color = 'orange' }) => (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
                className={`h-full bg-${color} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
            />
        </div>
    );

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            {/* Admin Dashboard */}
            {role === 'admin' && (
                <div className="space-y-6">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 rounded-2xl shadow-lg p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Welcome Back, Administrator!</h1>
                                <p className="text-blue-100 text-lg">
                                    Academic Year {currentYear} • Term {currentTerm} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <School className="w-20 h-20 opacity-20" />
                        </div>
                    </div>

                    {/* Primary Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            icon={Users} 
                            label="Total Students" 
                            value={stats?.totalStudents || 0}
                            color="orange"
                            trend={stats?.recentEnrollments > 0 ? `+${stats.recentEnrollments} this month` : ''}
                            link="/students"
                        />
                        <StatCard 
                            icon={UserCheck} 
                            label="Active Students" 
                            value={stats?.activeStudents || 0}
                            color="green-500"
                            link="/students"
                        />
                        <StatCard 
                            icon={UserCircle} 
                            label="Total Guardians" 
                            value={stats?.totalGuardians || 0}
                            color="blue-500"
                            link="/guardians"
                        />
                        <StatCard 
                            icon={GraduationCap} 
                            label="Total Teachers" 
                            value={stats?.totalTeachers || 0}
                            color="purple-500"
                            link="/teachers"
                        />
                    </div>

                    {/* Secondary Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            icon={School} 
                            label="Active Grades" 
                            value={stats?.totalGrades || 0}
                            color="indigo-500"
                            link="/grades"
                        />
                        <StatCard 
                            icon={BookOpen} 
                            label="Active Subjects" 
                            value={stats?.totalSubjects || 0}
                            color="pink-500"
                            link="/subjects"
                        />
                        <StatCard 
                            icon={FileText} 
                            label="Total Exams (This Year)" 
                            value={stats?.totalExams || 0}
                            color="cyan-500"
                            link="/exams"
                        />
                        <StatCard 
                            icon={Target} 
                            label="Exams This Term" 
                            value={stats?.examsThisTerm || 0}
                            color="teal-500"
                            link="/exams"
                        />
                    </div>

                    {/* Action Required Cards */}
                    {quickStats && (quickStats.students_without_guardian > 0 || 
                        quickStats.students_without_grade > 0 || 
                        quickStats.grades_without_class_teacher > 0 || 
                        quickStats.pending_exam_results > 0) && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">Action Required</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {quickStats.students_without_guardian > 0 && (
                                            <Link href="/students" className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Students without Guardian</p>
                                                        <p className="text-2xl font-bold text-yellow-600">{quickStats.students_without_guardian}</p>
                                                    </div>
                                                    <UserCircle className="w-8 h-8 text-yellow-600" />
                                                </div>
                                            </Link>
                                        )}
                                        {quickStats.students_without_grade > 0 && (
                                            <Link href="/students" className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Students without Grade</p>
                                                        <p className="text-2xl font-bold text-yellow-600">{quickStats.students_without_grade}</p>
                                                    </div>
                                                    <School className="w-8 h-8 text-yellow-600" />
                                                </div>
                                            </Link>
                                        )}
                                        {quickStats.grades_without_class_teacher > 0 && (
                                            <Link href="/grades" className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Grades without Class Teacher</p>
                                                        <p className="text-2xl font-bold text-yellow-600">{quickStats.grades_without_class_teacher}</p>
                                                    </div>
                                                    <GraduationCap className="w-8 h-8 text-yellow-600" />
                                                </div>
                                            </Link>
                                        )}
                                        {quickStats.pending_exam_results > 0 && (
                                            <Link href="/exams" className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Exams with Pending Results</p>
                                                        <p className="text-2xl font-bold text-yellow-600">{quickStats.pending_exam_results}</p>
                                                    </div>
                                                    <FileText className="w-8 h-8 text-yellow-600" />
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Students by Grade */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <BarChart3 className="w-5 h-5 mr-2 text-orange" />
                                    Students by Grade
                                </h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {studentsByGrade && studentsByGrade.length > 0 ? (
                                    studentsByGrade.map((grade, index) => (
                                        <div key={index}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">{grade.name}</span>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-navy">{grade.count}/{grade.capacity}</span>
                                                    <span className={`ml-2 text-xs ${grade.percentage > 90 ? 'text-red-600' : grade.percentage > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        ({grade.percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <ProgressBar 
                                                percentage={grade.percentage} 
                                                color={grade.percentage > 90 ? 'red-500' : grade.percentage > 70 ? 'yellow-500' : 'green-500'}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No grade data available</p>
                                )}
                            </div>
                        </div>

                        {/* Students by Gender */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-orange" />
                                    Students by Gender
                                </h3>
                            </div>
                            <div className="p-6">
                                {studentsByGender ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-around">
                                            <div className="text-center">
                                                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                                                    <span className="text-3xl font-bold text-blue-600">{studentsByGender.male || 0}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700">Male Students</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {stats.totalStudents > 0 ? Math.round((studentsByGender.male || 0) / stats.totalStudents * 100) : 0}%
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                                                    <span className="text-3xl font-bold text-pink-600">{studentsByGender.female || 0}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700">Female Students</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {stats.totalStudents > 0 ? Math.round((studentsByGender.female || 0) / stats.totalStudents * 100) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Gender Ratio</span>
                                                <span className="font-semibold text-navy">
                                                    {studentsByGender.male || 0} : {studentsByGender.female || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No gender data available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Exam Completion & Top Students */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Exam Completion Status */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Target className="w-5 h-5 mr-2 text-orange" />
                                    Recent Exam Completion Status
                                </h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {examsWithCompletion && examsWithCompletion.length > 0 ? (
                                    examsWithCompletion.map((exam) => (
                                        <Link 
                                            key={exam.id} 
                                            href={`/exams/${exam.id}/results`}
                                            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-navy text-sm mb-1">{exam.subject}</h4>
                                                    <p className="text-xs text-gray-600">{exam.grade}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                        exam.completion_rate === 100 ? 'bg-green-100 text-green-800' :
                                                        exam.completion_rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {exam.completion_rate}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                <span>{exam.students_marked} of {exam.total_students} students marked</span>
                                            </div>
                                            <ProgressBar 
                                                percentage={exam.completion_rate}
                                                color={exam.completion_rate === 100 ? 'green-500' : exam.completion_rate >= 50 ? 'yellow-500' : 'red-500'}
                                            />
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No exam data available</p>
                                )}
                            </div>
                        </div>

                        {/* Top Performing Students */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Trophy className="w-5 h-5 mr-2 text-orange" />
                                    Top Performing Students ({currentYear})
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {topStudents && topStudents.length > 0 ? (
                                    topStudents.map((student, index) => (
                                        <Link
                                            key={student.id}
                                            href={`/students/${student.id}`}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                                index === 0 ? 'bg-yellow-100' :
                                                index === 1 ? 'bg-gray-100' :
                                                index === 2 ? 'bg-orange-100' :
                                                'bg-blue-100'
                                            }`}>
                                                <span className={`font-bold ${
                                                    index === 0 ? 'text-yellow-600' :
                                                    index === 1 ? 'text-gray-600' :
                                                    index === 2 ? 'text-orange-600' :
                                                    'text-blue-600'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-navy text-sm">{student.name}</h4>
                                                <p className="text-xs text-gray-600">{student.grade} • {student.admission_number}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-orange">{student.average}%</div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    student.grade_rubric === 'EE' ? 'bg-green-100 text-green-800' :
                                                    student.grade_rubric === 'ME' ? 'bg-blue-100 text-blue-800' :
                                                    student.grade_rubric === 'AE' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {student.grade_rubric}
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No performance data available yet</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Students Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <UserPlus className="w-5 h-5 mr-2 text-orange" />
                                    Recently Added Students
                                </h3>
                                <Link href="/students" className="text-sm text-orange hover:text-orange-dark font-medium">
                                    View All →
                                </Link>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Admission No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Class
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Guardian
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentStudents && recentStudents.length > 0 ? (
                                        recentStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                                    {student.admission_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link 
                                                        href={`/students/${student.id}`}
                                                        className="text-sm font-medium text-navy hover:text-orange"
                                                    >
                                                        {student.first_name} {student.last_name}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {student.grade?.name || 'Not Assigned'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {student.guardian?.user?.name || 'Not Assigned'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {student.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                No students found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Dashboard */}
            {role === 'teacher' && (
                <div className="space-y-6">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Welcome Back, Teacher!</h1>
                                <p className="text-purple-100 text-lg">
                                    Academic Year {currentYear} • Term {currentTerm}
                                    {isClassTeacher && classTeacherGrade && (
                                        <span className="ml-4 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                                            Class Teacher - {classTeacherGrade}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <GraduationCap className="w-20 h-20 opacity-20" />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <StatCard 
                            icon={School} 
                            label="My Grades" 
                            value={stats?.assignedGrades || 0}
                            color="purple-500"
                        />
                        <StatCard 
                            icon={Users} 
                            label="My Students" 
                            value={stats?.totalStudents || 0}
                            color="orange"
                        />
                        <StatCard 
                            icon={FileText} 
                            label="My Exams" 
                            value={stats?.myExams || 0}
                            color="blue-500"
                        />
                        <StatCard 
                            icon={Target} 
                            label="Exams This Term" 
                            value={stats?.examsThisTerm || 0}
                            color="green-500"
                        />
                        <StatCard 
                            icon={AlertCircle} 
                            label="Pending Results" 
                            value={stats?.pendingResults || 0}
                            color="red-500"
                        />
                    </div>

                    {/* My Grades & Exams Needing Attention */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* My Grades */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <School className="w-5 h-5 mr-2 text-orange" />
                                    My Assigned Grades
                                </h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {myGrades && myGrades.length > 0 ? (
                                    myGrades.map((grade) => (
                                        <div key={grade.id} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-navy">{grade.name}</h4>
                                                    <p className="text-xs text-gray-600 mt-1">{grade.level}</p>
                                                </div>
                                                <div className="text-right">
                                                    {grade.is_class_teacher && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange bg-opacity-10 text-orange mb-1">
                                                            Class Teacher
                                                        </span>
                                                    )}
                                                    <p className="text-sm font-bold text-navy">{grade.students_count}/{grade.capacity}</p>
                                                </div>
                                            </div>
                                            <ProgressBar 
                                                percentage={grade.percentage}
                                                color={grade.percentage > 90 ? 'red-500' : grade.percentage > 70 ? 'yellow-500' : 'green-500'}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No grades assigned yet</p>
                                )}
                            </div>
                        </div>

                        {/* Exams Needing Attention */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <AlertCircle className="w-5 h-5 mr-2 text-orange" />
                                    Exams Needing Attention
                                </h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {examsNeedingAttention && examsNeedingAttention.length > 0 ? (
                                    examsNeedingAttention.map((exam) => (
                                        <Link 
                                            key={exam.id} 
                                            href={`/exams/${exam.id}/results`}
                                            className="block p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-navy text-sm mb-1">{exam.subject?.name}</h4>
                                                    <p className="text-xs text-gray-600">{exam.grade?.name} • Term {exam.term}</p>
                                                </div>
                                                <Clock className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                                <span>{exam.results_count} of {exam.grade?.students?.length || 0} students marked</span>
                                                <span className="font-medium text-red-600">
                                                    {exam.grade?.students?.length > 0 
                                                        ? Math.round((exam.results_count / exam.grade.students.length) * 100)
                                                        : 0}% Complete
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                        <p className="text-gray-600 font-medium">All caught up!</p>
                                        <p className="text-sm text-gray-500 mt-1">No pending exam results</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Top Students & Recent Students */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Students */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Trophy className="w-5 h-5 mr-2 text-orange" />
                                    Top Students in My Grades
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {topStudents && topStudents.length > 0 ? (
                                    topStudents.map((student, index) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                                index === 0 ? 'bg-yellow-100' :
                                                index === 1 ? 'bg-gray-100' :
                                                index === 2 ? 'bg-orange-100' :
                                                'bg-blue-100'
                                            }`}>
                                                <span className={`font-bold ${
                                                    index === 0 ? 'text-yellow-600' :
                                                    index === 1 ? 'text-gray-600' :
                                                    index === 2 ? 'text-orange-600' :
                                                    'text-blue-600'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-navy text-sm">{student.name}</h4>
                                                <p className="text-xs text-gray-600">{student.grade}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-orange">{student.average}%</div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    student.grade_rubric === 'EE' ? 'bg-green-100 text-green-800' :
                                                    student.grade_rubric === 'ME' ? 'bg-blue-100 text-blue-800' :
                                                    student.grade_rubric === 'AE' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {student.grade_rubric}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No performance data available yet</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Students */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-orange" />
                                    Recent Students
                                </h3>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                Adm. No.
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                Class
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentStudents && recentStudents.length > 0 ? (
                                            recentStudents.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-navy">
                                                        {student.admission_number}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {student.first_name} {student.last_name}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {student.grade?.name || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                                    No students found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Guardian Dashboard */}
            {role === 'guardian' && (
                <div className="space-y-6">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl shadow-lg p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Welcome Back, Parent/Guardian!</h1>
                                <p className="text-green-100 text-lg">
                                    Academic Year {currentYear} • Attendance for {currentMonth}
                                </p>
                            </div>
                            <UserCircle className="w-20 h-20 opacity-20" />
                        </div>
                    </div>

                    {/* Children Cards */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-navy flex items-center">
                                <Users className="w-6 h-6 mr-2 text-orange" />
                                My Children
                            </h3>
                            <span className="text-sm text-gray-500">Detailed Performance Overview</span>
                        </div>
                        {students && students.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {students.map((student) => (
                                    <div key={student.id} className="border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all hover:border-orange">
                                        <div className="p-6">
                                            {/* Student Header */}
                                            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange to-orange-dark flex items-center justify-center mr-4">
                                                    <GraduationCap className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-xl text-navy mb-1">
                                                        {student.first_name} {student.last_name}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600">{student.class_name}</span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                            student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {student.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Student Details */}
                                            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">Admission No.</p>
                                                    <p className="font-semibold text-navy">{student.admission_number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">Gender</p>
                                                    <p className="font-semibold text-navy capitalize">{student.gender}</p>
                                                </div>
                                            </div>

                                            {/* Academic Performance */}
                                            {student.overall_average && (
                                                <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-semibold text-gray-700">Academic Performance</span>
                                                        <Award className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <p className="text-3xl font-bold text-blue-600">{student.overall_average}%</p>
                                                            <p className="text-xs text-gray-600 mt-1">Overall Average</p>
                                                        </div>
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold ${
                                                            student.overall_grade === 'EE' ? 'bg-green-100 text-green-800' :
                                                            student.overall_grade === 'ME' ? 'bg-blue-100 text-blue-800' :
                                                            student.overall_grade === 'AE' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {student.overall_grade}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Exams */}
                                            {student.recent_exams && student.recent_exams.length > 0 && (
                                                <div className="mb-6">
                                                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                        <FileText className="w-4 h-4 mr-2 text-orange" />
                                                        Recent Exam Results
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {student.recent_exams.slice(0, 3).map((exam, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-navy">{exam.subject}</p>
                                                                    <p className="text-xs text-gray-500 capitalize">
                                                                        {exam.exam_type.replace('_', ' ')} - Term {exam.term}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-bold text-orange">{exam.marks}%</p>
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                        exam.grade === 'EE' ? 'bg-green-100 text-green-800' :
                                                                        exam.grade === 'ME' ? 'bg-blue-100 text-blue-800' :
                                                                        exam.grade === 'AE' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {exam.grade}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Attendance Summary */}
                                            {student.attendance_stats && (
                                                <div className="border-t border-gray-200 pt-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                                                            <Calendar className="w-4 h-4 mr-2 text-orange" />
                                                            Attendance ({currentMonth})
                                                        </h5>
                                                        <span className="text-2xl font-bold text-orange">
                                                            {student.attendance_stats.attendance_rate}%
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                                            <p className="text-xs text-gray-600 mb-1">Present</p>
                                                            <p className="text-xl font-bold text-green-600">{student.attendance_stats.present}</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                                            <p className="text-xs text-gray-600 mb-1">Absent</p>
                                                            <p className="text-xl font-bold text-red-600">{student.attendance_stats.absent}</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                                            <p className="text-xs text-gray-600 mb-1">Late</p>
                                                            <p className="text-xl font-bold text-yellow-600">{student.attendance_stats.late}</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                            <p className="text-xs text-gray-600 mb-1">Excused</p>
                                                            <p className="text-xl font-bold text-blue-600">{student.attendance_stats.excused}</p>
                                                        </div>
                                                    </div>
                                                    <Link
                                                        href={`/attendance/student/${student.id}`}
                                                        className="block w-full text-center px-4 py-3 bg-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-dark transition-all shadow-md hover:shadow-lg"
                                                    >
                                                        <ClipboardCheck className="w-4 h-4 inline mr-2" />
                                                        View Full Attendance Record
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-12 text-lg">No students found.</p>
                        )}
                    </div>

                    {/* Guardian Information */}
                    {guardianInfo && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-navy mb-6 flex items-center">
                                <UserCircle className="w-6 h-6 mr-2 text-orange" />
                                My Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-2">Phone Number</p>
                                    <p className="font-semibold text-navy text-lg">{guardianInfo.phone_number}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-2">Relationship</p>
                                    <p className="font-semibold text-navy text-lg capitalize">{guardianInfo.relationship}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-2">Occupation</p>
                                    <p className="font-semibold text-navy text-lg">{guardianInfo.occupation || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-2">Address</p>
                                    <p className="font-semibold text-navy text-lg">{guardianInfo.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}