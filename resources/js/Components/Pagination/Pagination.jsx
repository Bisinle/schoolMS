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
                    <Link
                        href={links[0].url || '#'}
                        preserveScroll
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            links[0].url
                                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Previous
                    </Link>
                    <Link
                        href={links[links.length - 1].url || '#'}
                        preserveScroll
                        className={`ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            links[links.length - 1].url
                                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Next
                    </Link>
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
                            <Link
                                href={links[0].url || '#'}
                                preserveScroll
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                                    links[0].url
                                        ? 'bg-white text-gray-500 hover:bg-gray-50'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeft className="h-5 w-5" />
                            </Link>

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

                                return (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                            isActive
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {/* Next Button */}
                            <Link
                                href={links[links.length - 1].url || '#'}
                                preserveScroll
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                                    links[links.length - 1].url
                                        ? 'bg-white text-gray-500 hover:bg-gray-50'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRight className="h-5 w-5" />
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}

