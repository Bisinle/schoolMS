<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Phase 4 of the Spatie migration (docs/spatie-migration-worksheet.md):
 * seeds the roles and permissions from the finalized taxonomy table, and
 * nothing else. Deliberately does NOT touch the User model (no HasRoles
 * trait yet), does NOT assign any actual user to a Spatie role, and is
 * never called from anywhere the app runs today -- the old role-string +
 * Policy system stays the sole thing actually governing access until
 * Phase 5 rewires policies/middleware to consult this instead.
 *
 * Idempotent: firstOrCreate/syncPermissions throughout, safe to re-run.
 *
 * Permission list source of truth is the worksheet's taxonomy table (90
 * permissions: 86 school-level + 4 super-admin) -- this seeder is a
 * direct, mechanical transcription of it, not an independent judgment
 * call. If the taxonomy changes, regenerate this file's arrays from the
 * table rather than hand-editing them out of sync.
 */
class RolePermissionSeeder extends Seeder
{
    private const GUARD = 'web';

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::ALL_PERMISSIONS as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => self::GUARD]);
        }

        $roles = [
            'admin' => self::ADMIN_PERMISSIONS,
            'teacher' => self::TEACHER_PERMISSIONS,
            'guardian' => self::GUARDIAN_PERMISSIONS,
            'super_admin' => self::SUPER_ADMIN_PERMISSIONS,
        ];

        foreach ($roles as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => self::GUARD]);
            $role->syncPermissions($permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Every permission in the taxonomy (90 total) -- must be created before
     * any role can be given one of them.
     */
    private const ALL_PERMISSIONS = [
        'students.view',
        'students.create',
        'students.update',
        'students.delete',
        'teachers.view',
        'teachers.create',
        'teachers.update',
        'teachers.delete',
        'guardians.view',
        'guardians.create',
        'guardians.update',
        'guardians.delete',
        'users.view',
        'users.create',
        'users.update',
        'users.delete',
        'users.reset-password',
        'users.toggle-status',
        'users.impersonate',
        'fees.manage',
        'fees.view-own-invoices',
        'settings.manage',
        'attendance.view',
        'attendance.create',
        'attendance.delete',
        'attendance.view-own-children',
        'grades.view',
        'grades.create',
        'grades.update',
        'grades.delete',
        'subjects.view',
        'subjects.create',
        'subjects.update',
        'subjects.delete',
        'exams.view',
        'exams.create',
        'exams.update',
        'exams.delete',
        'exam-results.view',
        'exam-results.create',
        'exam-results.update',
        'exam-results.delete',
        'timetable-periods.view',
        'timetable-periods.manage',
        'timetable-rooms.view',
        'timetable-rooms.manage',
        'timetable-slots.view',
        'timetable-slots.manage',
        'timetable-templates.manage',
        'timetable-dashboard.view',
        'timetable-schedule.view-own',
        'timetable-availability.manage',
        'reports.view',
        'report-comments.create',
        'report-comments.update',
        'report-comments.delete',
        'report-comments.manage-lock',
        'reports.headteacher-comment',
        'documents.view',
        'documents.create',
        'documents.verify',
        'documents.reject',
        'documents.delete',
        'accident-reports.view',
        'accident-reports.create',
        'accident-reports.review',
        'accident-reports.update',
        'accident-reports.delete',
        'incident-reports.view',
        'incident-reports.create',
        'incident-reports.review',
        'incident-reports.update',
        'incident-reports.delete',
        'quran-dashboard.view',
        'quran-homework.view',
        'quran-homework.view-own',
        'quran-homework.create',
        'quran-homework.update',
        'quran-schedule.view',
        'quran-schedule.create',
        'quran-schedule.update',
        'policies.view',
        'policies.acknowledge',
        'policies.manage',
        'document-categories.view',
        'document-categories.manage',
        'super-admin.schools.manage',
        'super-admin.users.manage',
        'super-admin.settings.manage',
        'super-admin.schools.impersonate',
    ];

    private const ADMIN_PERMISSIONS = [
        'students.view',
        'students.create',
        'students.update',
        'students.delete',
        'teachers.view',
        'teachers.create',
        'teachers.update',
        'teachers.delete',
        'guardians.view',
        'guardians.create',
        'guardians.update',
        'guardians.delete',
        'users.view',
        'users.create',
        'users.update',
        'users.delete',
        'users.reset-password',
        'users.toggle-status',
        'users.impersonate',
        'fees.manage',
        'settings.manage',
        'attendance.view',
        'attendance.create',
        'attendance.delete',
        'grades.view',
        'grades.create',
        'grades.update',
        'grades.delete',
        'subjects.view',
        'subjects.create',
        'subjects.update',
        'subjects.delete',
        'exams.view',
        'exams.create',
        'exams.update',
        'exams.delete',
        'exam-results.view',
        'exam-results.create',
        'exam-results.update',
        'exam-results.delete',
        'timetable-periods.view',
        'timetable-periods.manage',
        'timetable-rooms.view',
        'timetable-rooms.manage',
        'timetable-slots.view',
        'timetable-slots.manage',
        'timetable-templates.manage',
        'timetable-dashboard.view',
        'timetable-availability.manage',
        'reports.view',
        'report-comments.create',
        'report-comments.update',
        'report-comments.delete',
        'report-comments.manage-lock',
        'reports.headteacher-comment',
        'documents.view',
        'documents.create',
        'documents.verify',
        'documents.reject',
        'documents.delete',
        'accident-reports.view',
        'accident-reports.create',
        'accident-reports.review',
        'accident-reports.update',
        'accident-reports.delete',
        'incident-reports.view',
        'incident-reports.create',
        'incident-reports.review',
        'incident-reports.update',
        'incident-reports.delete',
        'quran-dashboard.view',
        'quran-homework.view',
        'quran-homework.create',
        'quran-homework.update',
        'quran-schedule.view',
        'quran-schedule.create',
        'quran-schedule.update',
        'policies.view',
        'policies.acknowledge',
        'policies.manage',
        'document-categories.view',
        'document-categories.manage',
    ];

    private const TEACHER_PERMISSIONS = [
        'students.view',
        'guardians.view',
        'attendance.view',
        'attendance.create',
        'grades.view',
        'subjects.view',
        'exams.view',
        'exams.create',
        'exams.update',
        'exam-results.view',
        'exam-results.create',
        'exam-results.update',
        'timetable-periods.view',
        'timetable-rooms.view',
        'timetable-slots.view',
        'timetable-schedule.view-own',
        'timetable-availability.manage',
        'reports.view',
        'report-comments.create',
        'report-comments.update',
        'documents.view',
        'documents.create',
        'documents.delete',
        'accident-reports.view',
        'accident-reports.create',
        'accident-reports.update',
        'incident-reports.view',
        'incident-reports.create',
        'incident-reports.review',
        'incident-reports.update',
        'quran-dashboard.view',
        'quran-homework.view',
        'quran-homework.create',
        'quran-homework.update',
        'quran-schedule.view',
        'quran-schedule.create',
        'quran-schedule.update',
        'policies.view',
        'policies.acknowledge',
    ];

    private const GUARDIAN_PERMISSIONS = [
        'fees.view-own-invoices',
        'attendance.view-own-children',
        'reports.view',
        'documents.view',
        'documents.create',
        'documents.delete',
        'accident-reports.view',
        'incident-reports.view',
        'quran-dashboard.view',
        'quran-homework.view-own',
        'quran-schedule.view',
        'policies.view',
        'policies.acknowledge',
    ];

    private const SUPER_ADMIN_PERMISSIONS = [
        'super-admin.schools.manage',
        'super-admin.users.manage',
        'super-admin.settings.manage',
        'super-admin.schools.impersonate',
    ];
}
