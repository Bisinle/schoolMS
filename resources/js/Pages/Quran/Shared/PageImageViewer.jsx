import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X } from 'lucide-react';

/**
 * PageImageViewer Component
 * 
 * Full-screen Quran page viewer with navigation, zoom, and download controls.
 * 
 * @param {Object} props
 * @param {number} props.pageNumber - Initial page number to display (1-604)
 * @param {Function} [props.onClose] - Callback when viewer is closed
 * @param {boolean} [props.showControls=true] - Show navigation and zoom controls
 * @param {string} [props.quality='high'] - Image quality: 'high', 'medium', 'low'
 */
export default function PageImageViewer({ 
    pageNumber, 
    onClose = null,
    showControls = true,
    quality = 'high'
}) {
    const [currentPage, setCurrentPage] = useState(pageNumber);
    const [zoom, setZoom] = useState(1);
    const [loading, setLoading] = useState(true);

    // Update current page when pageNumber prop changes
    useEffect(() => {
        setCurrentPage(pageNumber);
        setLoading(true);
    }, [pageNumber]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                handlePrevPage();
            } else if (e.key === 'ArrowRight') {
                handleNextPage();
            } else if (e.key === 'Escape' && onClose) {
                onClose();
            } else if (e.key === '+' || e.key === '=') {
                handleZoomIn();
            } else if (e.key === '-') {
                handleZoomOut();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, zoom, onClose]);

    const getImageUrl = (page, qual = quality) => {
        const qualityPaths = {
            'high': 'w1920',
            'medium': 'w960',
            'low': 'w480'
        };

        const width = qualityPaths[qual] || 'w1920';
        const paddedPage = String(page).padStart(3, '0');

        // CORRECTED: Using cdn.qurancdn.com with 'w' prefix for width
        return `https://cdn.qurancdn.com/images/${width}/page${paddedPage}.png`;
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            setLoading(true);
        }
    };

    const handleNextPage = () => {
        if (currentPage < 604) {
            setCurrentPage(currentPage + 1);
            setLoading(true);
        }
    };

    const handleZoomIn = () => {
        setZoom(Math.min(zoom + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(Math.max(zoom - 0.25, 0.5));
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = getImageUrl(currentPage);
        link.download = `quran-page-${currentPage}.png`;
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
            {/* Header */}
            {showControls && (
                <div className="bg-gray-900 border-b border-gray-700 p-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="text-white">
                            <h3 className="text-lg font-bold">
                                Quran Page {currentPage}
                            </h3>
                            <p className="text-sm text-gray-400">
                                Page {currentPage} of 604
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Navigation */}
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Previous Page (←)"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <span className="text-white font-medium px-3">
                                {currentPage}
                            </span>

                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === 604}
                                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Next Page (→)"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Zoom Controls */}
                            <div className="ml-4 flex items-center gap-2">
                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 0.5}
                                    className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                    title="Zoom Out (-)"
                                >
                                    <ZoomOut className="w-5 h-5" />
                                </button>

                                <span className="text-white font-medium px-2">
                                    {Math.round(zoom * 100)}%
                                </span>

                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 3}
                                    className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                    title="Zoom In (+)"
                                >
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Download */}
                            <button
                                onClick={handleDownload}
                                className="ml-4 p-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"
                                title="Download Page"
                            >
                                <Download className="w-5 h-5" />
                            </button>

                            {/* Close */}
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="ml-4 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    title="Close (Esc)"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Container */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                <div
                    className="relative transition-transform duration-300"
                    style={{ transform: `scale(${zoom})` }}
                >
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange border-t-transparent"></div>
                        </div>
                    )}

                    <img
                        src={getImageUrl(currentPage)}
                        alt={`Quran Page ${currentPage}`}
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setLoading(false);
                            console.error('Failed to load Quran page image');
                        }}
                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                    />
                </div>
            </div>

            {/* Footer Info */}
            {showControls && (
                <div className="bg-gray-900 border-t border-gray-700 p-3 text-center">
                    <p className="text-sm text-gray-400">
                        Use arrow keys or buttons to navigate • Click and drag to pan when zoomed • Press Esc to close
                    </p>
                </div>
            )}
        </div>
    );
}

