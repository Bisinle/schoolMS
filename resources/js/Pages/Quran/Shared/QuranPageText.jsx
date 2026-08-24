import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import axios from 'axios';

/**
 * QuranPageText Component
 *
 * Renders a Mushaf page as live Arabic text (Uthmani script), fetched from
 * the app's own /api/quran/page/{page}/verses endpoint. Replaces the old
 * PageImagePreview component, which depended on a page-image CDN
 * (cdn.qurancdn.com) that no longer resolves and has no properly licensed
 * self-hostable replacement.
 *
 * Two modes:
 * - Pass `verses` directly (already fetched server-side, e.g. via Inertia
 *   props) for a static detail view — no network call is made.
 * - Omit `verses` and this component fetches them itself, debounced,
 *   whenever `pageNumber` changes — for a live preview while a page number
 *   is still being typed into a form.
 *
 * @param {Object} props
 * @param {number} props.pageNumber - Page number to display (1-604)
 * @param {Array<{verse_key: string, text_qpc_hafs: string}>} [props.verses] - Pre-loaded verses; skips the internal fetch when provided
 * @param {string} [props.highlightVerseKey] - Verse key (e.g. "2:255") to visually highlight
 * @param {string} [props.title] - Card heading; defaults to "Page {pageNumber}"
 * @param {Function} [props.onExpand] - If provided, shows a "View Full Page" button that calls this
 * @param {string} [props.className] - Additional CSS classes
 */
export default function QuranPageText({
    pageNumber,
    verses: providedVerses = null,
    highlightVerseKey = null,
    title = null,
    onExpand = null,
    className = '',
}) {
    const [fetchedVerses, setFetchedVerses] = useState(null);
    const [loading, setLoading] = useState(providedVerses === null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (providedVerses !== null || !pageNumber) {
            return;
        }

        setLoading(true);
        setError(false);

        const timeoutId = setTimeout(() => {
            axios
                .get(`/api/quran/page/${pageNumber}/verses`)
                .then((response) => {
                    setFetchedVerses(response.data);
                    setLoading(false);
                })
                .catch(() => {
                    setError(true);
                    setLoading(false);
                });
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [pageNumber, providedVerses]);

    const verses = providedVerses !== null ? providedVerses : fetchedVerses;

    if (loading) {
        return (
            <div className={`bg-gray-50 rounded-lg border border-gray-200 p-8 flex items-center justify-center ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange border-t-transparent"></div>
            </div>
        );
    }

    if (error || !verses || verses.length === 0) {
        return (
            <div className={`bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center ${className}`}>
                <p className="text-gray-600 font-medium">Unable to load page text</p>
                <p className="text-sm text-gray-500 mt-1">Page {pageNumber}</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {(title || onExpand) && (
                <div className="flex items-center justify-between mb-3">
                    {title && <h4 className="text-sm font-semibold text-gray-700">{title}</h4>}
                    {onExpand && (
                        <button
                            type="button"
                            onClick={onExpand}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:text-orange-dark transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            View Full Page
                        </button>
                    )}
                </div>
            )}
            <p dir="rtl" lang="ar" className="text-right text-2xl leading-loose text-gray-900 font-uthmani">
                {verses.map((verse) => (
                    <span
                        key={verse.verse_key}
                        className={verse.verse_key === highlightVerseKey ? 'bg-orange/10 rounded' : ''}
                    >
                        {verse.text_qpc_hafs}{' '}
                    </span>
                ))}
            </p>
            <p className="mt-4 text-xs text-gray-400 text-right" dir="rtl">
                Quran data provided by Quran Foundation
            </p>
        </div>
    );
}
