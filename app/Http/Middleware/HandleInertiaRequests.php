<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // Get school data without loading relationships to avoid circular reference
        $schoolData = null;
        $isSuperAdmin = $user && $user->isSuperAdmin();

        if ($user && $user->school_id && !$isSuperAdmin) {
            $school = \App\Models\School::select('id', 'name', 'logo_path', 'is_active', 'status')
                ->find($user->school_id);

            if ($school) {
                $schoolData = [
                    'id' => $school->id,
                    'name' => $school->name,
                    'logo_path' => $school->logo_path,
                    'is_active' => $school->is_active,
                    'status' => $school->status,
                ];
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => $user->is_active ?? true,
                    'school_id' => $user->school_id,
                    'is_super_admin' => $isSuperAdmin,
                ] : null,
            ],
            'school' => $schoolData,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'generated_password' => fn () => $request->session()->get('generated_password'),
                'user_name' => fn () => $request->session()->get('user_name'),
            ],
            'impersonation' => [
                'isImpersonating' => session()->has('impersonated_by'),
                'impersonatedUser' => session()->has('impersonated_by') ? $user : null,
                'impersonatorId' => session()->get('impersonated_by'),
            ],

        ];
    }
}