import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Eye, Edit, Trash2, School, Users, TrendingUp, RefreshCw, ChevronDown, ChevronUp, Power, UserCog, Mail, Phone, MapPin, Calendar, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component - Redesigned
function MobileSchoolItem({ school, onDelete, onImpersonate }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [swipeAction, setSwipeAction] = useState(null);

    const handlers = useSwipeable({
        onSwipedLeft: () => setSwipeAction('primary'),
        onSwipedRight: () => setSwipeAction('secondary'),
        onSwiping: () => {},
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: 60,
    });

    const handleToggleActive = () => {
        router.post(route('super-admin.schools.toggle-active', school.id), {}, {
            preserveScroll: true,
            onSuccess: () => setSwipeAction(null),
        });
    };

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-6 gap-3 z-10">
                    <SwipeActionButton
                        icon={<Eye className="w-6 h-6 text-white" />}
                        href={route('super-admin.schools.show', school.id)}
                        onClick={() => setSwipeAction(null)}
                        size="large"
                    />
                    <SwipeActionButton
                        icon={<Edit className="w-6 h-6 text-white" />}
                        href={route('super-admin.schools.edit', school.id)}
                        onClick={() => setSwipeAction(null)}
                        size="large"
                    />
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-start px-6 gap-3 z-10">
                    <SwipeActionButton
                        icon={<Power className="w-6 h-6 text-white" />}
                        onClick={handleToggleActive}
                        size="large"
                    />
                    <SwipeActionButton
                        icon={<Trash2 className="w-6 h-6 text-white" />}
                        onClick={() => {
                            onDelete(school);
                            setSwipeAction(null);
                        }}
                        size="large"
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-44' :
                    swipeAction === 'secondary' ? 'translate-x-44' : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row - Touch Optimized */}
                <div
                    className="p-5 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => {
                        if (!swipeAction) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Avatar - Larger */}
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl">
                                {school.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">{school.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-gray-600 truncate">{school.slug || 'N/A'}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                        school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {school.is_active ? '● Active' : '● Inactive'}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                        school.school_type === 'madrasah'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-cyan-100 text-cyan-700'
                                    }`}>
                                        {school.school_type === 'madrasah' ? 'Madrasah' : 'Islamic School'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Expand Button - Larger Touch Target */}
                        <button className="flex-shrink-0 p-2 -mr-2 active:bg-gray-100 rounded-lg transition-colors">
                            {isExpanded ? (
                                <ChevronUp className="w-6 h-6 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-6 h-6 text-gray-500" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Details - Redesigned */}
                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4 bg-gray-50">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Students</span>
                                </div>
                                <p className="text-2xl font-black text-gray-900">{school.students_count || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Teachers</span>
                                </div>
                                <p className="text-2xl font-black text-gray-900">{school.teachers_count || 0}</p>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCog className="w-5 h-5 text-purple-600" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Guardians</span>
                                </div>
                                <p className="text-2xl font-black text-gray-900">{school.guardians_count || 0}</p>
                            </div>
                        </div>

                        {/* Info List - Improved Spacing */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                                    <p className="text-sm font-bold text-gray-900 break-words">{school.admin_email}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100"></div>
                            
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                                    <p className="text-sm font-bold text-gray-900">{school.admin_phone || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100"></div>
                            
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Domain</p>
                                    <p className="text-sm font-bold text-gray-900 break-all">{school.domain}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100"></div>
                            
                            <div className="flex items-start gap-3">
                                <UserCog className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Admin</p>
                                    <p className="text-sm font-bold text-gray-900">{school.admin_name}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100"></div>
                            
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Subscription</p>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                                        school.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                        school.status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {school.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Larger & More Spacing */}
                        <div className="space-y-3 pt-2">
                            {/* Primary Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href={route('super-admin.schools.show', school.id)}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Eye className="w-5 h-5" />
                                    View
                                </Link>
                                <Link
                                    href={route('super-admin.schools.edit', school.id)}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Edit className="w-5 h-5" />
                                    Edit
                                </Link>
                            </div>
                            
                            {/* Secondary Actions */}
                            <button
                                onClick={() => onImpersonate(school)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                            >
                                <UserCog className="w-5 h-5" />
                                Impersonate Admin
                            </button>
                            
                            <button
                                onClick={handleToggleActive}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform ${
                                    school.is_active
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                }`}
                            >
                                <Power className="w-5 h-5" />
                                {school.is_active ? 'Disable School' : 'Enable School'}
                            </button>
                            
                            <button
                                onClick={() => onDelete(school)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete School
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Index({ schools, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [impersonateSchool, setImpersonateSchool] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('super-admin.schools.index'), { search }, { preserveState: true });
    };

    const handleDelete = (school) => {
        if (confirm(`Are you sure you want to delete ${school.name}? This action cannot be undone.`)) {
            if (confirm(`This will permanently delete all students, teachers, grades, and other data for ${school.name}. Type the school name to confirm.`)) {
                router.delete(route('super-admin.schools.destroy', school.id));
            }
        }
    };

    const handleImpersonate = (school) => {
        setImpersonateSchool(school);
    };

    const confirmImpersonate = () => {
        if (impersonateSchool) {
            router.post(route('super-admin.schools.impersonate', impersonateSchool.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-800">
                    Schools Management
                </h2>
            }
        >
            <Head title="Schools Management" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header Section - Mobile Optimized */}
                    <div className="mb-6 flex flex-col gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Schools Directory</h1>
                            <p className="text-sm text-gray-600 mt-2">Manage and monitor all schools in your network</p>
                        </div>
                        <Link
                            href={route('super-admin.schools.create')}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-300 text-base"
                        >
                            <Plus className="w-6 h-6" />
                            Add New School
                        </Link>
                    </div>

                    {/* Search Card - Mobile Optimized */}
                    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search schools by name..."
                                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all duration-300 text-base"
                                    >
                                        <Search className="w-5 h-5" />
                                        Search
                                    </button>
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                router.get(route('super-admin.schools.index'));
                                            }}
                                            className="inline-flex items-center justify-center px-5 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl active:bg-gray-200 transition-all duration-300"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Mobile List View */}
                    <div className="block md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {schools.data && schools.data.length > 0 ? (
                            schools.data.map((school) => (
                                <MobileSchoolItem
                                    key={school.id}
                                    school={school}
                                    onDelete={handleDelete}
                                    onImpersonate={handleImpersonate}
                                />
                            ))
                        ) : (
                            <div className="px-6 py-16 text-center">
                                <School className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold text-lg">No schools found</p>
                                <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">School</th>
                                        <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Admin Email</th>
                                        <th className="hidden lg:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Students</th>
                                        <th className="hidden xl:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Guardians</th>
                                        <th className="hidden sm:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Users</th>
                                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {schools.data && schools.data.length > 0 ? (
                                        schools.data.map((school) => (
                                            <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                                                            {school.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-gray-900 truncate">{school.name}</div>
                                                            <div className="text-xs text-gray-500 truncate">{school.domain}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-medium">{school.admin_email}</div>
                                                </td>
                                                <td className="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs leading-5 font-bold rounded-full ${
                                                        school.school_type === 'madrasah'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-cyan-100 text-cyan-800'
                                                    }`}>
                                                        {school.school_type === 'madrasah' ? 'Madrasah' : 'Islamic School'}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-bold text-gray-900">{school.students_count || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="hidden xl:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <UserCog className="w-4 h-4 text-purple-600" />
                                                        <span className="text-sm font-bold text-gray-900">{school.guardians_count || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-bold text-gray-900">{school.users_count || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex px-2 py-1 text-xs leading-5 font-bold rounded-full ${
                                                            school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {school.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                        <span className={`inline-flex px-2 py-1 text-xs leading-5 font-bold rounded-full ${
                                                            school.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                            school.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {school.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route('super-admin.schools.show', school.id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <Link
                                                            href={route('super-admin.schools.edit', school.id)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(school)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <School className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-500 font-medium">No schools found</p>
                                                <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Impersonation Modal - Mobile Optimized */}
            {impersonateSchool && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md transform transition-all animate-slide-up">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                                    <UserCog className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Impersonate School</h3>
                                    <p className="text-sm text-gray-500 mt-1">Login as administrator</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 mb-6 border-2 border-purple-100">
                                <p className="text-sm text-gray-700 mb-3 font-medium">
                                    You are about to login as:
                                </p>
                                <p className="font-black text-xl text-gray-900 mb-2">{impersonateSchool.name}</p>
                                <p className="text-sm text-gray-600">Domain: {impersonateSchool.domain}</p>
                            </div>

                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                                <p className="text-sm text-yellow-800 font-semibold">
                                    ⚠️ You will have full admin access to this school's data
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmImpersonate}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black shadow-xl active:scale-95 transition-all text-base"
                                >
                                    Confirm & Login
                                </button>
                                <button
                                    onClick={() => setImpersonateSchool(null)}
                                    className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold active:bg-gray-200 transition-colors text-base"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}