<?php

namespace App\Console\Commands;

use App\Models\Guardian;
use App\Models\Teacher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Finds teacher/guardian rows whose linked user was soft-deleted without the
 * profile row being cleaned up alongside it (the orphan bug fixed going
 * forward in UserManagementService::deleteUser(), TeacherController::destroy()
 * and GuardianController::destroy() - see commit c1b53b6). Those pre-existing
 * orphans are what crash TimetableComplianceService and friends when a
 * grade/timetable still references one.
 *
 * Runs outside any authenticated request, so the SchoolScope global scope on
 * Teacher/Guardian does not apply here - queries below intentionally see
 * every school unless --school-id narrows them, and soft-deleting the row
 * that this command finds never touches any other school's data since it
 * only ever acts on that row's own school_id.
 */
class CleanupOrphanedTeacherGuardianProfiles extends Command
{
    protected $signature = 'profiles:cleanup-orphaned
                            {--apply : Soft-delete the orphaned rows found. Without this flag, the command only reports them.}
                            {--school-id= : Limit to a single school instead of scanning every school.}';

    protected $description = 'Find (and optionally soft-delete) teacher/guardian rows whose linked user is missing or soft-deleted';

    public function handle(): int
    {
        $schoolId = $this->option('school-id');

        $orphanedTeachers = Teacher::query()
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId))
            ->get()
            ->reject(fn ($teacher) => $this->hasLiveUser($teacher->user_id));

        $orphanedGuardians = Guardian::query()
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId))
            ->get()
            ->reject(fn ($guardian) => $this->hasLiveUser($guardian->user_id));

        if ($orphanedTeachers->isEmpty() && $orphanedGuardians->isEmpty()) {
            $this->info('No orphaned teacher/guardian rows found.');

            return self::SUCCESS;
        }

        if ($orphanedTeachers->isNotEmpty()) {
            $this->warn("Found {$orphanedTeachers->count()} orphaned teacher row(s):");
            $this->table(
                ['Teacher ID', 'School ID', 'Employee #', 'user_id', 'User status'],
                $orphanedTeachers->map(fn ($t) => [
                    $t->id, $t->school_id, $t->employee_number, $t->user_id, $this->userStatus($t->user_id),
                ])
            );
        }

        if ($orphanedGuardians->isNotEmpty()) {
            $this->warn("Found {$orphanedGuardians->count()} orphaned guardian row(s):");
            $this->table(
                ['Guardian ID', 'School ID', 'user_id', 'User status'],
                $orphanedGuardians->map(fn ($g) => [
                    $g->id, $g->school_id, $g->user_id, $this->userStatus($g->user_id),
                ])
            );
        }

        if (! $this->option('apply')) {
            $this->newLine();
            $this->info('Dry run - no changes made. Re-run with --apply to soft-delete these rows.');

            return self::SUCCESS;
        }

        if (! $this->confirm('Soft-delete all of the rows listed above?', true)) {
            $this->info('Cancelled - no changes made.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($orphanedTeachers, $orphanedGuardians) {
            $orphanedTeachers->each->delete();
            $orphanedGuardians->each->delete();
        });

        $this->info("Soft-deleted {$orphanedTeachers->count()} teacher row(s) and {$orphanedGuardians->count()} guardian row(s).");

        return self::SUCCESS;
    }

    private function hasLiveUser(?int $userId): bool
    {
        if (! $userId) {
            return false;
        }

        return DB::table('users')->where('id', $userId)->whereNull('deleted_at')->exists();
    }

    private function userStatus(?int $userId): string
    {
        if (! $userId) {
            return 'no user_id';
        }

        $user = DB::table('users')->where('id', $userId)->first();

        if (! $user) {
            return 'missing';
        }

        return $user->deleted_at ? 'soft-deleted' : 'active';
    }
}
