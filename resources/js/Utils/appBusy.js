// resources/js/Utils/appBusy.js
//
// Per-tab (in-memory only — not persisted, not shared across tabs)
// tracking of whether the user is mid-flow in a multi-step wizard that
// holds meaningful state only in memory (bulk import preview/confirm,
// invoice preview). Consulted by the service worker's update-reload
// flow so an automatic reload never discards an in-progress wizard.

const busyReasons = new Set();

export function markBusy(reason) {
    busyReasons.add(reason);
}

export function clearBusy(reason) {
    busyReasons.delete(reason);
}

export function isBusy() {
    return busyReasons.size > 0;
}
