<?php

namespace App\Policies;

use App\Models\TimetableTemplate;
use App\Models\User;

class TimetableTemplatePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, TimetableTemplate $timetableTemplate): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher()) {
            // Teachers can view timetables for grades they teach
            return $user->teacher->grades()->where('grades.id', $timetableTemplate->grade_id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, TimetableTemplate $timetableTemplate): bool
    {
        // Only admins can update, and only if it's in draft status
        return $user->isAdmin() && $timetableTemplate->isDraft();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TimetableTemplate $timetableTemplate): bool
    {
        // Only admins can delete, and only if it's in draft status
        return $user->isAdmin() && $timetableTemplate->isDraft();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can publish the timetable.
     */
    public function publish(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->isAdmin() && $timetableTemplate->isDraft();
    }

    /**
     * Determine whether the user can archive the timetable.
     */
    public function archive(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can unarchive the timetable.
     */
    public function unarchive(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->isAdmin() && $timetableTemplate->status === 'archived';
    }

    /**
     * Determine whether the user can delete an archived timetable.
     */
    public function deleteArchived(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->isAdmin() && $timetableTemplate->status === 'archived';
    }
}
