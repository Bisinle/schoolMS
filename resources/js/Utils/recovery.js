// resources/js/Utils/recovery.js
//
// One-shot reload-loop protection shared by every automatic-recovery
// action in the app (the global Inertia `invalid` handler, the
// `vite:preloadError` handler, and the service worker's update-reload
// flow). Each failure type gets its own key so one type's one-shot flag
// can't mask a different, unrelated failure later in the same session.
// All flags are cleared together on the next successful Inertia
// `navigate` event (fires on both a fresh document load/reload and an
// ordinary SPA visit — verified against @inertiajs/core@2.3.23 source,
// unlike `success` which only fires on SPA visits).

const PREFIX = 'recovery:';

export function attemptRecovery(key) {
    if (typeof sessionStorage === 'undefined') {
        return true;
    }

    const storageKey = PREFIX + key;

    if (sessionStorage.getItem(storageKey)) {
        return false;
    }

    sessionStorage.setItem(storageKey, '1');
    return true;
}

export function clearRecoveryFlags() {
    if (typeof sessionStorage === 'undefined') {
        return;
    }

    Object.keys(sessionStorage)
        .filter((key) => key.startsWith(PREFIX))
        .forEach((key) => sessionStorage.removeItem(key));
}

export function initRecoveryTracking(router) {
    router.on('navigate', () => {
        clearRecoveryFlags();
    });
}
