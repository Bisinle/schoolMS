import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';
import axios from 'axios';

/**
 * QuranPageTextViewer Component
 *
 * Fullscreen, distraction-free reading mode for a Mushaf page rendered as
 * live Arabic text. Replaces PageImageViewer (which showed a page image via
 * a dead CDN). Keeps what carries over naturally from the image viewer —
 * fullscreen, page navigation, a zoom-equivalent — and drops what doesn't:
 * "zoom" becomes a font-size control, and there's no download button (no
 * meaningful equivalent for text).
 *
 * @param {Object} props
 * @param {number} props.pageNumber - Initial page number to display (1-604)
 * @param {Array<{verse_key: string, text_qpc_hafs: string}>} [props.verses] - Pre-loaded verses for the initial page
 * @param {Function} [props.onClose] - Callback when the viewer is closed
 */
export default function QuranPageTextViewer({ pageNumber, verses: initialVerses = null, onClose = null }) {
    const [currentPage, setCurrentPage] = useState(pageNumber);
    const [verses, setVerses] = useState(initialVerses);
    const [loading, setLoading] = useState(initialVerses === null);
    const [error, setError] = useState(false);
    const [fontScale, setFontScale] = useState(1);

    const loadPage = useCallback((page) => {
        setLoading(true);
        setError(false);
        axios
            .get(`/api/quran/page/${page}/verses`)
            .then((response) => {
                setVerses(response.data);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (currentPage === pageNumber && initialVerses !== null) {
            return;
        }
        loadPage(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < 604) setCurrentPage(currentPage + 1);
    };

    const handleZoomIn = () => setFontScale((z) => Math.min(z + 0.15, 2));
    const handleZoomOut = () => setFontScale((z) => Math.max(z - 0.15, 0.6));

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrevPage();
            else if (e.key === 'ArrowRight') handleNextPage();
            else if (e.key === 'Escape' && onClose) onClose();
            else if (e.key === '+' || e.key === '=') handleZoomIn();
            else if (e.key === '-') handleZoomOut();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-700 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="text-white">
                        <h3 className="text-lg font-bold">Quran Page {currentPage}</h3>
                        <p className="text-sm text-gray-400">Page {currentPage} of 604</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Previous Page (←)"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="text-white font-medium px-3">{currentPage}</span>

                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === 604}
                            className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Next Page (→)"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="ml-4 flex items-center gap-2">
                            <button
                                onClick={handleZoomOut}
                                disabled={fontScale <= 0.6}
                                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                title="Smaller Text (-)"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>

                            <span className="text-white font-medium px-2">{Math.round(fontScale * 100)}%</span>

                            <button
                                onClick={handleZoomIn}
                                disabled={fontScale >= 2}
                                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                title="Larger Text (+)"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                        </div>

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

            {/* Text Container */}
            <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
                <div className="max-w-3xl w-full bg-white rounded-lg shadow-2xl p-8">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange border-t-transparent"></div>
                        </div>
                    )}

                    {!loading && (error || !verses || verses.length === 0) && (
                        <p className="text-center text-gray-500 py-16">Unable to load page text</p>
                    )}

                    {!loading && verses && verses.length > 0 && (
                        <>
                            <p
                                dir="rtl"
                                lang="ar"
                                className="text-right text-gray-900 font-uthmani leading-loose"
                                style={{ fontSize: `${1.5 * fontScale}rem` }}
                            >
                                {verses.map((verse) => (
                                    <span key={verse.verse_key}>{verse.text_qpc_hafs}{' '}</span>
                                ))}
                            </p>
                            <p className="mt-6 text-xs text-gray-400 text-right" dir="rtl">
                                Quran data provided by Quran Foundation
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <div className="bg-gray-900 border-t border-gray-700 p-3 text-center">
                <p className="text-sm text-gray-400">
                    Use arrow keys or buttons to navigate • Press Esc to close
                </p>
            </div>
        </div>
    );
}
