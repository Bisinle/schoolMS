import { useState } from 'react';
import { BookOpen, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * QuranPageImage Component
 * 
 * Displays Quran page images from Quran.com CDN with zoom and navigation controls.
 * 
 * @param {Object} props
 * @param {number} props.pageNumber - Page number (1-604)
 * @param {number} [props.pageFrom] - Starting page for range display
 * @param {number} [props.pageTo] - Ending page for range display
 * @param {string} [props.quality='medium'] - Image quality: 'high', 'medium', 'low'
 * @param {boolean} [props.showControls=true] - Show zoom and navigation controls
 * @param {string} [props.className] - Additional CSS classes
 */
export default function QuranPageImage({ 
    pageNumber, 
    pageFrom, 
    pageTo, 
    quality = 'medium',
    showControls = true,
    className = '' 
}) {
    const [currentPage, setCurrentPage] = useState(pageNumber || pageFrom || 1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Determine if we're showing a range
    const hasRange = pageFrom && pageTo;
    const minPage = hasRange ? Math.min(pageFrom, pageTo) : currentPage;
    const maxPage = hasRange ? Math.max(pageFrom, pageTo) : currentPage;

    // Generate image URL - CORRECTED CDN format
    const getImageUrl = (page, imageQuality = quality) => {
        const qualityPaths = {
            'high': 'w1920',
            'medium': 'w960',
            'low': 'w480',
        };

        const width = qualityPaths[imageQuality] || 'w960';
        const paddedPage = String(page).padStart(3, '0');

        // CORRECTED: Using cdn.qurancdn.com with 'w' prefix for width
        return `https://cdn.qurancdn.com/images/${width}/page${paddedPage}.png`;
    };

    const handlePrevPage = () => {
        if (currentPage > minPage) {
            setCurrentPage(currentPage - 1);
            setImageError(false);
        }
    };

    const handleNextPage = () => {
        if (currentPage < maxPage) {
            setCurrentPage(currentPage + 1);
            setImageError(false);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleImageError = () => {
        setImageError(true);
    };

    if (imageError) {
        return (
            <div className={`bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center ${className}`}>
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Unable to load page image</p>
                <p className="text-sm text-gray-500 mt-1">Page {currentPage}</p>
            </div>
        );
    }

    return (
        <>
            {/* Main Image Container */}
            <div className={`relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
                {/* Page Number Badge */}
                <div className="absolute top-4 left-4 z-10 bg-navy text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    Page {currentPage}
                    {hasRange && ` of ${minPage}-${maxPage}`}
                </div>

                {/* Image */}
                <div className="relative">
                    <img
                        src={getImageUrl(currentPage)}
                        alt={`Quran Page ${currentPage}`}
                        className="w-full h-auto"
                        onError={handleImageError}
                    />
                </div>

                {/* Controls */}
                {showControls && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-navy/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                            {/* Previous Page */}
                            {hasRange && (
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage <= minPage}
                                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}

                            {/* Fullscreen Toggle */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                                title="View Fullscreen"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>

                            {/* Next Page */}
                            {hasRange && (
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage >= maxPage}
                                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Next Page"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
                    {/* Close Button */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Page Number */}
                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-lg font-bold">
                        Page {currentPage}
                    </div>

                    {/* Fullscreen Image */}
                    <img
                        src={getImageUrl(currentPage, 'high')}
                        alt={`Quran Page ${currentPage}`}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </>
    );
}

