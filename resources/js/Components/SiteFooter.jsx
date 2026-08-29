import { Link } from '@inertiajs/react';
import { School } from 'lucide-react';

/**
 * Shared footer for every public-facing page (Home, demo booking flow,
 * legal pages). Single source of truth so Privacy Policy / Terms of
 * Service links can't silently go missing from one page while present on
 * another.
 */
export default function SiteFooter() {
    return (
        <footer className="relative z-10 bg-navy py-10 px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/10 rounded-md flex items-center justify-center">
                        <School className="w-5 h-5 text-orange" />
                    </div>
                    <span className="text-white font-display font-semibold">SchoolMS</span>
                </div>
                <div className="flex flex-col items-center md:items-end gap-2">
                    <p className="text-white/40 text-sm text-center md:text-right">
                        © {new Date().getFullYear()} SchoolMS. Empowering education through technology.
                    </p>
                    <div className="flex items-center gap-5 text-white/50 text-xs">
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
