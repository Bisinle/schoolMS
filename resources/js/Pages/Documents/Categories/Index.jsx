import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Pencil, Trash2, Plus, Search, Filter, Eye, ChevronDown, ChevronUp, Tag, FileText, HardDrive } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component
function MobileCategoryItem({ category, onDelete }) {
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

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Eye className="w-5 h-5 text-white" />}
                        href={route("document-categories.show", category.id)}
                        onClick={() => setSwipeAction(null)}
                    />
                    <SwipeActionButton
                        icon={<Pencil className="w-5 h-5 text-white" />}
                        href={route("document-categories.edit", category.id)}
                        onClick={() => setSwipeAction(null)}
                    />
                </div>
            )}
            {swipeAction === 'secondary' && category.documents_count === 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-start px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Trash2 className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onDelete(category.id, category.name);
                            setSwipeAction(null);
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-32' :
                    swipeAction === 'secondary' ? 'translate-x-20' : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row */}
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
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl">
                                {category.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{category.slug}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        {category.entity_type || "Global"}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {category.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="flex-shrink-0 p-1">
                            {isExpanded ? (
                                <ChevronUp className="w-6 h-6 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-6 h-6 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                        {/* Info Grid */}
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Entity Type</span>
                                    <span className="font-semibold text-gray-900">{category.entity_type || "Global (All Entities)"}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <HardDrive className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Max File Size</span>
                                    <span className="font-semibold text-gray-900">{Math.round(category.max_file_size / 1024)} MB</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Documents</span>
                                    <span className="font-semibold text-gray-900">{category.documents_count}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Required</span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        category.is_required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {category.is_required ? 'Required' : 'Optional'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                            <Link
                                href={route("document-categories.show", category.id)}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors active:scale-95"
                            >
                                <Eye className="w-4 h-4" />
                                View
                            </Link>
                            <Link
                                href={route("document-categories.edit", category.id)}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors active:scale-95"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit
                            </Link>
                            {category.documents_count === 0 && (
                                <button
                                    onClick={() => onDelete(category.id, category.name)}
                                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Category
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Index({ categories, filters, entityTypes }) {
    const [search, setSearch] = useState(filters.search || "");
    const [entityType, setEntityType] = useState(filters.entity_type || "all");
    const [status, setStatus] = useState(filters.status || "all");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("document-categories.index"),
            { search, entity_type: entityType, status },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDelete = (id, name) => {
        if (
            confirm(
                `Are you sure you want to delete "${name}"? This action cannot be undone.`
            )
        ) {
            router.delete(route("document-categories.destroy", id));
        }
    };

    return (
        <AuthenticatedLayout header="Document Categories">
            <Head title="Document Categories" />
            <Link
                                href="/documents"
                                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to List
                            </Link>
            <div className="space-y-6">
                {/* Header with Add Button */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-navy">
                        Manage Document Categories
                    </h2>
                    <Link
                        href={route("document-categories.create")}
                        className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Search categories..."
                                        className="pl-10 w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Entity Type
                                </label>
                                <select
                                    value={entityType}
                                    onChange={(e) =>
                                        setEntityType(e.target.value)
                                    }
                                    className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                >
                                    <option value="all">All Types</option>
                                    <option value="global">
                                        Global (All Entities)
                                    </option>
                                    {entityTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Apply Filters
                            </button>
                        </div>
                    </form>
                </div>

                {/* Mobile List View */}
                <div className="block md:hidden bg-white rounded-lg shadow-sm overflow-hidden">
                    {categories.data.length > 0 ? (
                        categories.data.map((category) => (
                            <MobileCategoryItem
                                key={category.id}
                                category={category}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No document categories found</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Entity Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Required
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Max Size
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Documents
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            No document categories found.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.data.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-navy">
                                                    {category.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {category.slug}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {category.entity_type ||
                                                        "Global"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {category.is_required ? (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                        Required
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                        Optional
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {Math.round(
                                                    category.max_file_size /
                                                        1024
                                                )}{" "}
                                                MB
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {category.documents_count}
                                            </td>
                                            <td className="px-6 py-4">
                                                {category.status ===
                                                "active" ? (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <Link
                                                    href={route(
                                                        "document-categories.show",
                                                        category.id
                                                    )}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={route(
                                                        "document-categories.edit",
                                                        category.id
                                                    )}
                                                    className="inline-flex items-center text-orange hover:text-orange-dark"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                {category.documents_count ===
                                                    0 && (
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                category.id,
                                                                category.name
                                                            )
                                                        }
                                                        className="inline-flex items-center text-red-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {categories.links && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-700">
                                    Showing {categories.from} to{" "}
                                    {categories.to} of {categories.total}{" "}
                                    categories
                                </div>
                                <div className="flex space-x-2">
                                    {categories.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 rounded-lg text-sm ${
                                                link.active
                                                    ? "bg-orange text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            } ${
                                                !link.url
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}