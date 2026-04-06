import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Traditional Pagination Component for Desktop
 * Shows page numbers with prev/next buttons
 * 
 * @param {Object} props
 * @param {Array} props.links - Laravel pagination links array
 * @param {number} props.currentPage - Current page number
 * @param {number} props.lastPage - Last page number
 * @param {number} props.total - Total number of items
 * @param {number} props.from - Starting item number on current page
 * @param {number} props.to - Ending item number on current page
 */
export default function Pagination({ links, currentPage, lastPage, total, from, to }) {
    if (!links || links.length <= 3) {
        // No pagination needed (only prev, current, next)
        return null;
    }

    // Remove first and last items (prev/next buttons) to get page links
    const pageLinks = links.slice(1, -1);

    return (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
                {/* Results count - Left side */}
                <div className="flex-1 flex justify-between sm:hidden">
                    {links[0].url ? (
                        <Link
                            href={links[0].url}
                            preserveScroll
                            preserveState
                            className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Previous
                        </Link>
                    ) : (
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed">
                            Previous
                        </span>
                    )}
                    {links[links.length - 1].url ? (
                        <Link
                            href={links[links.length - 1].url}
                            preserveScroll
                            preserveState
                            className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Next
                        </Link>
                    ) : (
                        <span className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed">
                            Next
                        </span>
                    )}
                </div>

                {/* Desktop pagination */}
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{from}</span> to{' '}
                            <span className="font-medium">{to}</span> of{' '}
                            <span className="font-medium">{total}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            {/* Previous Button */}
                            {links[0].url ? (
                                <Link
                                    href={links[0].url}
                                    preserveScroll
                                    preserveState
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" />
                                </Link>
                            ) : (
                                <span className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed">
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" />
                                </span>
                            )}

                            {/* Page Numbers */}
                            {pageLinks.map((link, index) => {
                                const isActive = link.active;
                                const isEllipsis = link.label === '...';

                                if (isEllipsis) {
                                    return (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                        >
                                            ...
                                        </span>
                                    );
                                }

                                if (isActive || !link.url) {
                                    return (
                                        <span
                                            key={index}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                isActive
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {link.label}
                                        </span>
                                    );
                                }

                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        preserveState
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {/* Next Button */}
                            {links[links.length - 1].url ? (
                                <Link
                                    href={links[links.length - 1].url}
                                    preserveScroll
                                    preserveState
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" />
                                </Link>
                            ) : (
                                <span className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed">
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" />
                                </span>
                            )}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}

