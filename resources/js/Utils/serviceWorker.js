// resources/js/Utils/serviceWorker.js
//
// Service worker registration and update lifecycle. Relocated here from
// a classic <script> in app.blade.php, which could not reach the
// Inertia router or import ES modules (recovery.js/appBusy.js) — see
// the design doc's Section 3 for the verification behind that move.
//
// Update activation and the resulting reload are deliberately two
// independently-gated steps: clients.claim() affects every tab on the
// origin at once when a new worker activates, so gating the activation
// trigger on one tab's busy state would not protect a *different* tab
// that happens to be mid-wizard. Instead: any tab may trigger
// activation; each tab's own controllerchange listener decides for
// itself whether *it* is safe to reload right now.

import { attemptRecovery } from './recovery';
import { isBusy } from './appBusy';

function showUpdateBanner(registration) {
    const banner = document.createElement('div');
    banner.className = 'fixed bottom-4 right-4 text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-sm border border-orange-500';
    banner.style.background = 'linear-gradient(135deg, #0b1a34 0%, #1e3a5f 100%)';
    banner.innerHTML = `
        <div class="flex items-center justify-between gap-4">
            <div>
                <p class="font-semibold mb-1 text-orange-500">Update Available!</p>
                <p class="text-sm text-gray-300">A new version of SchoolMS is ready.</p>
            </div>
            <button
                class="update-btn bg-orange-500 text-white px-4 py-2 rounded font-medium hover:bg-orange-600 transition-colors"
                style="background-color: #ff6b35;"
            >
                Update
            </button>
        </div>
    `;

    banner.querySelector('.update-btn').addEventListener('click', () => {
        if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        banner.remove();
    });

    document.body.appendChild(banner);
}

function tryReload() {
    if (isBusy()) {
        // Defer — this tab keeps running its current code until its own
        // next natural navigation, at which point the already-active new
        // worker controls it anyway. Re-check shortly rather than never.
        setTimeout(tryReload, 5000);
        return;
    }

    if (attemptRecovery('sw-update')) {
        window.location.reload();
    }
}

export function initServiceWorker(router) {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) {
            return;
        }
        refreshing = true;
        tryReload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                router.on('navigate', () => {
                    registration.update();
                });

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateBanner(registration);

                            // Any tab may auto-post SKIP_WAITING — no
                            // busy-check here (see module docblock).
                            registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error('Service Worker registration failed:', error);
            });
    });
}
