import React, { useState } from 'react';
import { Eye, ExternalLink } from 'lucide-react';
import PageImageViewer from './PageImageViewer';

/**
 * PageImagePreview Component
 * 
 * Inline preview of a Quran page with option to open in fullscreen viewer.
 * 
 * @param {Object} props
 * @param {number} props.pageNumber - Page number to display (1-604)
 * @param {string} [props.quality='medium'] - Image quality: 'high', 'medium', 'low'
 * @param {boolean} [props.showFullscreenButton=true] - Show button to open fullscreen viewer
 * @param {string} [props.className] - Additional CSS classes
 */
export default function PageImagePreview({ 
    pageNumber, 
    quality = 'medium',
    showFullscreenButton = true,
    className = ''
}) {
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const getImageUrl = (page, qual = quality) => {
        const qualityPaths = {
            'high': 'w1920',
            'medium': 'w960',
            'low': 'w480'
        };

        const width = qualityPaths[qual] || 'w960';
        const paddedPage = String(page).padStart(3, '0');

        // CORRECTED: Using cdn.qurancdn.com with 'w' prefix for width
        return `https://cdn.qurancdn.com/images/${width}/page${paddedPage}.png`;
    };

    if (imageError) {
        return (
            <div className={`bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center ${className}`}>
                <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <p className="text-gray-600 font-medium">Unable to load page image</p>
                <p className="text-sm text-gray-500 mt-1">Page {pageNumber}</p>
            </div>
        );
    }

    return (
        <>
            <div className={`relative group ${className}`}>
                {/* Loading Spinner */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange border-t-transparent"></div>
                    </div>
                )}

                {/* Image */}
                <img
                    src={getImageUrl(pageNumber)}
                    alt={`Quran Page ${pageNumber}`}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setImageError(true);
                        console.error('Failed to load page preview');
                    }}
                    className="w-full h-auto rounded-lg shadow-md border border-gray-200"
                />

                {/* Overlay with buttons (appears on hover) */}
                {showFullscreenButton && !loading && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                            onClick={() => setShowFullscreen(true)}
                            className="px-4 py-2 bg-orange text-white rounded-lg font-semibold hover:bg-orange-dark transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Eye className="w-5 h-5" />
                            View Full Page
                        </button>
                    </div>
                )}

                {/* Page Number Badge */}
                <div className="absolute top-2 right-2 bg-navy text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    Page {pageNumber}
                </div>
            </div>

            {/* Fullscreen Viewer Modal */}
            {showFullscreen && (
                <PageImageViewer
                    pageNumber={pageNumber}
                    onClose={() => setShowFullscreen(false)}
                    quality="high"
                />
            )}
        </>
    );
}

