import "../css/app.css";
import "./bootstrap";

import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

import { AnimatePresence } from "framer-motion";

import ErrorBoundary from "./Components/ErrorBoundary";
import { attemptRecovery, initRecoveryTracking } from "./Utils/recovery";
import { initServiceWorker } from "./Utils/serviceWorker";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

initRecoveryTracking(router);
initServiceWorker(router);

// Defense-in-depth for a genuinely non-Inertia response (a network-level
// failure, an unexpected proxy page) — Section 1's Laravel changes make
// this rare, but it's kept as a fallback rather than leaving Inertia's
// default dismiss-only iframe modal in place.
document.addEventListener("inertia:invalid", (event) => {
    event.preventDefault();

    if (attemptRecovery("invalid")) {
        router.reload();
    } else {
        window.__inertiaRecoveryFallback = true;
        document.body.innerHTML =
            '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0b1a34,#1a2f5a);padding:1rem;font-family:system-ui,sans-serif;">' +
            '<div style="max-width:32rem;text-align:center;color:white;">' +
            '<h2 style="font-size:1.5rem;font-weight:600;margin-bottom:1rem;">Something went wrong</h2>' +
            '<p style="color:#d1d5db;margin-bottom:2rem;">Please try again.</p>' +
            '<div style="display:flex;gap:1rem;justify-content:center;">' +
            '<button onclick="window.location.reload()" style="padding:0.75rem 1.5rem;background:white;color:#0b1a34;font-weight:600;border-radius:0.5rem;border:none;cursor:pointer;">Try Again</button>' +
            '<a href="/dashboard" style="padding:0.75rem 1.5rem;background:#ff6b35;color:white;font-weight:600;border-radius:0.5rem;text-decoration:none;">Go to Dashboard</a>' +
            "</div></div></div>";
    }
});

// A stale tab (still running an old JS module graph after a deploy,
// because the service worker's clients.claim() claims it with no
// busy-check) can hit a since-deleted hashed chunk when Inertia
// dynamically imports a page component it hasn't loaded yet. Vite's
// production preload helper dispatches this cancelable event and
// re-throws unless we call preventDefault() — verified directly against
// the installed vite@7.3.3 package's build-output source.
window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();

    if (attemptRecovery("preload-error")) {
        window.location.reload();
        return;
    }

    // Second occurrence this session — a persistent problem, not a
    // one-off deploy-window race. Don't loop; render a minimal fallback
    // that doesn't depend on React/Inertia being functional, since
    // that's precisely what's in question here.
    document.body.innerHTML =
        '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0b1a34,#1a2f5a);padding:1rem;font-family:system-ui,sans-serif;">' +
        '<div style="max-width:32rem;text-align:center;color:white;">' +
        '<h2 style="font-size:1.5rem;font-weight:600;margin-bottom:1rem;">Something went wrong loading this page</h2>' +
        '<p style="color:#d1d5db;margin-bottom:2rem;">Please reload the page.</p>' +
        '<button onclick="window.location.reload()" style="padding:0.75rem 1.5rem;background:white;color:#0b1a34;font-weight:600;border-radius:0.5rem;border:none;cursor:pointer;">Reload</button>' +
        "</div></div>";
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
