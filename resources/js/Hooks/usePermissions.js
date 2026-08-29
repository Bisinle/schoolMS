import { usePage } from '@inertiajs/react';

/**
 * Reads the current user's granted permissions from the shared Inertia
 * `auth.user.permissions` prop (populated server-side by
 * HandleInertiaRequests from Spatie's $user->getAllPermissions()).
 *
 * `role` is unaffected and still shared separately — this hook is additive,
 * not a replacement for role reads used for display (e.g. "logged in as
 * admin" labels).
 *
 * @returns {{ can: (permission: string) => boolean, canAny: (permissions: string[]) => boolean }}
 *
 * @example
 * const { can } = usePermissions();
 * {can('students.create') && <CreateButton />}
 *
 * @example
 * const { canAny } = usePermissions();
 * {canAny(['quran-homework.view', 'quran-homework.view-own']) && <Page />}
 */
export default function usePermissions() {
    const { auth } = usePage().props;
    const granted = new Set(auth?.user?.permissions ?? []);

    return {
        can: (permission) => granted.has(permission),
        canAny: (permissions) => permissions.some((p) => granted.has(p)),
    };
}
