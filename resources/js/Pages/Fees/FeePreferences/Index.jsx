import React, { useState } from "react";
import { Head, router, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Users,
    Search,
    CheckCircle,
    AlertCircle,
    XCircle,
    Settings,
    Filter,
    UserCog,
} from "lucide-react";
import Badge from "@/Components/UI/Badge";

export default function Index({ auth, guardians, academicTerms, selectedTerm, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [selectedTermId, setSelectedTermId] = useState(filters.term || selectedTerm?.id);

    const handleSearch = () => {
        router.get(
            route("fee-preferences.index"),
            {
                search: searchTerm,
                status: statusFilter,
                term: selectedTermId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'status') {
            setStatusFilter(value);
        } else if (filterType === 'term') {
            setSelectedTermId(value);
        }
        
        router.get(
            route("fee-preferences.index"),
            {
                search: searchTerm,
                status: filterType === 'status' ? value : statusFilter,
                term: filterType === 'term' ? value : selectedTermId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'complete':
                return (
                    <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Complete
                    </Badge>
                );
            case 'incomplete':
                return (
                    <Badge variant="warning" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Incomplete
                    </Badge>
                );
            case 'none':
                return (
                    <Badge variant="danger" className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        None
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Fee Preferences" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl shadow-lg p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl">
                                    <UserCog className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                                        Guardian Fee Preferences
                                    </h1>
                                    <p className="text-orange-100 text-xs sm:text-sm mt-1">
                                        Manage fee preferences for each guardian's children
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white border-x border-gray-200 p-4">
                        <div className="flex flex-col gap-3">
                            {/* Term and Status Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Academic Term Filter */}
                                <select
                                    value={selectedTermId || ""}
                                    onChange={(e) => handleFilterChange('term', e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base min-h-[48px]"
                                >
                                    <option value="">All Terms</option>
                                    {academicTerms.map((term) => (
                                        <option key={term.id} value={term.id}>
                                            {term.display_name}
                                        </option>
                                    ))}
                                </select>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base min-h-[48px]"
                                >
                                    <option value="">All Status</option>
                                    <option value="complete">Complete</option>
                                    <option value="incomplete">Incomplete</option>
                                    <option value="none">None</option>
                                </select>
                            </div>

                            {/* Search Bar */}
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by guardian name or ID..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base min-h-[48px]"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg min-h-[48px]"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-b-2xl shadow-lg p-4 sm:p-6">
                        {guardians.data.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No guardians found
                                </h3>
                                <p className="text-gray-500">
                                    {filters.search || filters.status
                                        ? "Try adjusting your filters"
                                        : "No guardians available"}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Guardian
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Children
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Preferences
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {guardians.data.map((guardian) => (
                                                <tr key={guardian.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {guardian.full_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {guardian.guardian_id}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm text-gray-900">{guardian.email}</div>
                                                        <div className="text-sm text-gray-500">{guardian.phone}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                                                            {guardian.total_children}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm text-gray-900">
                                                            {guardian.children_with_preferences} / {guardian.total_children}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {getStatusBadge(guardian.preference_status)}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <Link
                                                            href={route("fee-preferences.edit", {
                                                                guardian: guardian.id,
                                                                term: selectedTermId,
                                                            })}
                                                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 min-h-[48px] rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                            Set Preferences
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-4">
                                    {guardians.data.map((guardian) => (
                                        <div
                                            key={guardian.id}
                                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                        {guardian.full_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{guardian.guardian_id}</p>
                                                </div>
                                                {getStatusBadge(guardian.preference_status)}
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Email:</span>
                                                    <span className="text-gray-900">{guardian.email}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Phone:</span>
                                                    <span className="text-gray-900">{guardian.phone}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Children:</span>
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                                                        {guardian.total_children}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Preferences Set:</span>
                                                    <span className="text-gray-900 font-medium">
                                                        {guardian.children_with_preferences} / {guardian.total_children}
                                                    </span>
                                                </div>
                                            </div>

                                            <Link
                                                href={route("fee-preferences.edit", {
                                                    guardian: guardian.id,
                                                    term: selectedTermId,
                                                })}
                                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium w-full min-h-[48px]"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Set Preferences
                                            </Link>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {guardians.links && guardians.links.length > 3 && (
                                    <div className="mt-6 flex justify-center">
                                        <nav className="flex gap-2">
                                            {guardians.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || "#"}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        link.active
                                                            ? "bg-orange-600 text-white"
                                                            : link.url
                                                            ? "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
